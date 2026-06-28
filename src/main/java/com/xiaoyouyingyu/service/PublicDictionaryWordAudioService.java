package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.Word;
import com.xiaoyouyingyu.entity.WordAudioStatus;
import com.xiaoyouyingyu.repository.WordRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PublicDictionaryWordAudioService {
    private static final String DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private static final String WIKTIONARY_API = "https://en.wiktionary.org/w/api.php?action=parse&prop=wikitext&format=json&page=";
    private static final String COMMONS_API = "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url%7Cextmetadata&format=json&titles=";

    private final WordRepository wordRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.word-audio.public-source.user-agent:xiaoyouyingyu-public-dictionary-audio/1.0}")
    private String userAgent;

    @Value("${app.word-audio.public-source.wiktionary-backoff-ms:600000}")
    private long wiktionaryBackoffMs;

    private volatile Instant wiktionaryBlockedUntil = Instant.EPOCH;

    @Transactional
    public BackfillResult backfillOneMissingWord() {
        Optional<Word> optionalWord = wordRepository.findMissingPublicAudio(PageRequest.of(0, 1)).stream().findFirst();
        if (optionalWord.isEmpty()) {
            return BackfillResult.idle();
        }

        Word word = optionalWord.get();
        try {
            AudioMatch match = fetchFromDictionaryApi(word.getWord());
            if (!match.hasAnyAudio() && Instant.now().isAfter(wiktionaryBlockedUntil)) {
                match = fetchFromWiktionary(word.getWord());
                if (match.isRateLimited()) {
                    wiktionaryBlockedUntil = Instant.now().plusMillis(wiktionaryBackoffMs);
                    return BackfillResult.rateLimited(word.getId(), word.getWord(), wiktionaryBlockedUntil);
                }
            }

            if (!match.hasAnyAudio()) {
                word.setAudioError("PUBLIC_DICTIONARY_AUDIO_MISSING");
                wordRepository.save(word);
                return BackfillResult.missing(word.getId(), word.getWord());
            }

            boolean changed = false;
            if (isBlank(word.getAudioUsUrl()) && !isBlank(match.getUsUrl())) {
                word.setAudioUsUrl(match.getUsUrl());
                changed = true;
            }
            if (isBlank(word.getAudioUkUrl()) && !isBlank(match.getUkUrl())) {
                word.setAudioUkUrl(match.getUkUrl());
                changed = true;
            }
            if (!changed) {
                return BackfillResult.unchanged(word.getId(), word.getWord());
            }

            if (!isBlank(word.getAudioUsUrl()) && !isBlank(word.getAudioUkUrl())) {
                word.setAudioStatus(WordAudioStatus.READY);
                word.setAudioError(null);
            } else {
                word.setAudioError("PUBLIC_DICTIONARY_AUDIO_PARTIAL");
            }
            wordRepository.save(word);
            return BackfillResult.updated(word.getId(), word.getWord(), word.getAudioUsUrl(), word.getAudioUkUrl());
        } catch (Exception e) {
            log.warn("Public dictionary word audio backfill failed: wordId={}, word={}, error={}",
                    word.getId(), word.getWord(), e.getMessage());
            return BackfillResult.failed(word.getId(), word.getWord(), e.getMessage());
        }
    }

    private AudioMatch fetchFromDictionaryApi(String word) throws Exception {
        HttpResponse<String> response = get(DICTIONARY_API + encodeWord(word));
        if (response.statusCode() == 404) {
            return new AudioMatch();
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("dictionary api failed (" + response.statusCode() + ")");
        }

        JsonNode root = objectMapper.readTree(response.body());
        AudioMatch match = new AudioMatch();
        if (!root.isArray()) {
            return match;
        }
        for (JsonNode entry : root) {
            JsonNode phonetics = entry.path("phonetics");
            if (!phonetics.isArray()) {
                continue;
            }
            for (JsonNode phonetic : phonetics) {
                String audio = text(phonetic.path("audio"));
                if (audio == null) {
                    continue;
                }
                String lower = audio.toLowerCase(Locale.ROOT);
                if (match.getUsUrl() == null && (lower.contains("-us.") || lower.contains("_us."))) {
                    match.setUsUrl(audio);
                } else if (match.getUkUrl() == null && (lower.contains("-uk.") || lower.contains("_uk.") || lower.contains("-gb.") || lower.contains("_gb."))) {
                    match.setUkUrl(audio);
                }
                if (match.hasBothAudio()) {
                    return match;
                }
            }
        }
        return match;
    }

    private AudioMatch fetchFromWiktionary(String word) throws Exception {
        HttpResponse<String> response = get(WIKTIONARY_API + encodeWord(word));
        if (response.statusCode() == 404) {
            return new AudioMatch();
        }
        if (response.statusCode() == 429) {
            AudioMatch match = new AudioMatch();
            match.setRateLimited(true);
            return match;
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("wiktionary api failed (" + response.statusCode() + ")");
        }

        String wikitext = text(objectMapper.readTree(response.body()).path("parse").path("wikitext").path("*"));
        if (wikitext == null) {
            return new AudioMatch();
        }

        AudioMatch match = new AudioMatch();
        for (String template : findAudioTemplates(wikitext)) {
            String fileName = audioFileName(template);
            if (fileName == null) {
                continue;
            }
            String lowerTemplate = template.toLowerCase(Locale.ROOT);
            String lowerFileName = fileName.toLowerCase(Locale.ROOT);
            boolean us = lowerTemplate.contains("a=us") || lowerTemplate.contains("a=ga") || lowerFileName.contains("en-us-");
            boolean uk = lowerTemplate.contains("a=uk") || lowerTemplate.contains("a=rp") || lowerTemplate.contains("a=gb") || lowerFileName.contains("en-uk-");
            if (!us && !uk) {
                continue;
            }

            CommonsFile file = fetchCommonsFile(fileName);
            if (file.getUrl() == null) {
                continue;
            }
            if (us && match.getUsUrl() == null) {
                match.setUsUrl(file.getUrl());
            } else if (uk && match.getUkUrl() == null) {
                match.setUkUrl(file.getUrl());
            }
            if (match.hasBothAudio()) {
                return match;
            }
        }
        return match;
    }

    private CommonsFile fetchCommonsFile(String fileName) throws Exception {
        String title = fileName.startsWith("File:") ? fileName : "File:" + fileName;
        HttpResponse<String> response = get(COMMONS_API + URLEncoder.encode(title, StandardCharsets.UTF_8));
        if (response.statusCode() == 429) {
            wiktionaryBlockedUntil = Instant.now().plusMillis(wiktionaryBackoffMs);
            return new CommonsFile();
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("commons api failed (" + response.statusCode() + ")");
        }

        JsonNode pages = objectMapper.readTree(response.body()).path("query").path("pages");
        if (!pages.isObject()) {
            return new CommonsFile();
        }
        for (JsonNode page : pages) {
            JsonNode imageInfo = page.path("imageinfo");
            if (imageInfo.isArray() && imageInfo.size() > 0) {
                CommonsFile file = new CommonsFile();
                file.setUrl(text(imageInfo.get(0).path("url")));
                return file;
            }
        }
        return new CommonsFile();
    }

    private HttpResponse<String> get(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("User-Agent", userAgent)
                .timeout(Duration.ofSeconds(20))
                .GET()
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private static List<String> findAudioTemplates(String wikitext) {
        List<String> templates = new ArrayList<>();
        String marker = "{{audio|en|";
        int index = 0;
        while ((index = wikitext.indexOf(marker, index)) >= 0) {
            int end = wikitext.indexOf("}}", index);
            if (end < 0) {
                break;
            }
            templates.add(wikitext.substring(index, end + 2));
            index = end + 2;
        }
        return templates;
    }

    private static String audioFileName(String template) {
        String[] parts = template.substring(2, template.length() - 2).split("\\|");
        if (parts.length < 3) {
            return null;
        }
        String fileName = parts[2].trim();
        return fileName.isBlank() ? null : fileName;
    }

    private static String encodeWord(String word) {
        return URLEncoder.encode(word.trim().toLowerCase(Locale.ROOT), StandardCharsets.UTF_8);
    }

    private static String text(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Data
    public static class BackfillResult {
        private String status;
        private Long wordId;
        private String word;
        private String audioUsUrl;
        private String audioUkUrl;
        private Instant blockedUntil;
        private String error;

        static BackfillResult idle() {
            BackfillResult result = new BackfillResult();
            result.setStatus("IDLE");
            return result;
        }

        static BackfillResult updated(Long wordId, String word, String audioUsUrl, String audioUkUrl) {
            BackfillResult result = base("UPDATED", wordId, word);
            result.setAudioUsUrl(audioUsUrl);
            result.setAudioUkUrl(audioUkUrl);
            return result;
        }

        static BackfillResult missing(Long wordId, String word) {
            return base("MISSING", wordId, word);
        }

        static BackfillResult unchanged(Long wordId, String word) {
            return base("UNCHANGED", wordId, word);
        }

        static BackfillResult rateLimited(Long wordId, String word, Instant blockedUntil) {
            BackfillResult result = base("RATE_LIMITED", wordId, word);
            result.setBlockedUntil(blockedUntil);
            return result;
        }

        static BackfillResult failed(Long wordId, String word, String error) {
            BackfillResult result = base("FAILED", wordId, word);
            result.setError(error);
            return result;
        }

        private static BackfillResult base(String status, Long wordId, String word) {
            BackfillResult result = new BackfillResult();
            result.setStatus(status);
            result.setWordId(wordId);
            result.setWord(word);
            return result;
        }
    }

    @Data
    private static class AudioMatch {
        private String usUrl;
        private String ukUrl;
        private boolean rateLimited;

        boolean hasAnyAudio() {
            return usUrl != null || ukUrl != null;
        }

        boolean hasBothAudio() {
            return usUrl != null && ukUrl != null;
        }
    }

    @Data
    private static class CommonsFile {
        private String url;
    }
}
