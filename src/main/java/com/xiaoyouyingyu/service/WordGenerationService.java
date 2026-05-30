package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.TopicRepository;
import com.xiaoyouyingyu.repository.WordBookTopicRepository;
import com.xiaoyouyingyu.repository.WordRepository;
import com.xiaoyouyingyu.repository.WordTopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WordGenerationService {
    private final AiService aiService;
    private final WordBookService wordBookService;
    private final WordRepository wordRepository;
    private final TopicRepository topicRepository;
    private final WordTopicRepository wordTopicRepository;
    private final WordBookTopicRepository wordBookTopicRepository;
    private final WordService wordService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public Map<String, Object> generateByScene(Long bookId, Map<String, Object> body) {
        WordBook book = wordBookService.getRequired(bookId);
        Long ttsModelId = longValue(body.get("ttsModelId"));
        List<Word> candidates = generateSceneCandidates(body);
        SaveResult saved = saveCandidatesWithoutAudio(book, candidates);
        generateAudio(saved.savedWords(), ttsModelId);
        return saved.toResponse(saved.savedWords());
    }

    public List<Word> generateSceneCandidates(Map<String, Object> body) {
        String scene = stringValue(body.get("scene"));
        int count = intValue(body.get("count"), 10);
        WordDifficulty difficulty = parseDifficulty(stringValue(body.get("difficulty")));
        Long modelId = longValue(body.get("modelId"));
        String aiContent = aiService.generateWordsByScene(modelId, scene, count, difficulty.name().toLowerCase());
        return parseWords(aiContent, difficulty, scene, null, null);
    }

    @Transactional
    public Map<String, Object> generateByTopics(Long bookId, Map<String, Object> body) {
        WordBook book = wordBookService.getRequired(bookId);
        Long ttsModelId = longValue(body.get("ttsModelId"));
        List<Word> allCandidates = generateTopicCandidates(book, body);
        SaveResult saved = saveCandidatesWithoutAudio(book, allCandidates);
        generateAudio(saved.savedWords(), ttsModelId);
        return saved.toResponse(saved.savedWords());
    }

    @Transactional
    public List<Word> generateTopicCandidates(WordBook book, Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Object> rawTopicIds = (List<Object>) body.getOrDefault("topicIds", List.of());
        int beginnerCount = intValue(body.get("beginnerCount"), 5);
        int advancedCount = intValue(body.get("advancedCount"), 5);
        Long modelId = longValue(body.get("modelId"));

        List<Word> allCandidates = new ArrayList<>();
        for (Object rawId : rawTopicIds) {
            Long topicId = longValue(rawId);
            if (topicId == null) continue;
            topicRepository.findById(topicId).ifPresent(topic -> {
                linkBookTopic(book, topic);
                if (beginnerCount > 0) {
                    String content = aiService.generateWordsByTopic(modelId, topic, beginnerCount, "beginner");
                    allCandidates.addAll(parseWords(content, WordDifficulty.BEGINNER, null, topic.getId(), topic.getTitleZh()));
                }
                if (advancedCount > 0) {
                    String content = aiService.generateWordsByTopic(modelId, topic, advancedCount, "advanced");
                    allCandidates.addAll(parseWords(content, WordDifficulty.ADVANCED, null, topic.getId(), topic.getTitleZh()));
                }
            });
        }
        return allCandidates;
    }

    @Transactional
    public SaveResult saveCandidatesWithoutAudio(WordBook book, List<Word> candidates) {
        int saved = 0;
        int skipped = 0;
        List<Word> words = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Word candidate : candidates) {
            String normalized = Word.normalize(candidate.getWord());
            if (normalized.isBlank() || isBlank(candidate.getDefinitionZh()) || isBlank(candidate.getDefinitionEn())) {
                skipped++;
                errors.add("跳过字段不完整的单词：" + stringValue(candidate.getWord()));
                continue;
            }
            Optional<Word> existing = wordRepository.findByWordBookIdAndNormalizedWordAndDeletedFalse(book.getId(), normalized);
            if (existing.isPresent()) {
                mergeSourceTopic(existing.get(), candidate);
                skipped++;
                continue;
            }
            candidate.setWordBook(book);
            candidate.setNormalizedWord(normalized);
            candidate.setStatus(WordStatus.DRAFT);
            Word savedWord = wordService.createWithoutAudio(book, candidate);
            linkWordTopic(savedWord, candidate.getSourceTopicId());
            words.add(savedWord);
            saved++;
        }

        return new SaveResult(saved, skipped, words, errors);
    }

    @Transactional
    public Word generateAudio(Word word, Long ttsModelId) {
        wordService.regenerateAudio(List.of(word.getId()), ttsModelId);
        return wordRepository.findById(word.getId()).orElse(word);
    }

    @Transactional
    public List<Word> generateAudio(List<Word> words, Long ttsModelId) {
        List<Word> updated = new ArrayList<>();
        for (Word word : words) {
            updated.add(generateAudio(word, ttsModelId));
        }
        return updated;
    }

    public Map<String, Object> toResponse(SaveResult result, List<Word> words) {
        return result.toResponse(words);
    }

    private void mergeSourceTopic(Word existing, Word candidate) {
        if (candidate.getSourceTopicId() != null) {
            linkWordTopic(existing, candidate.getSourceTopicId());
        }
        if (existing.getSourceTopicId() == null && candidate.getSourceTopicId() != null) {
            existing.setSourceTopicId(candidate.getSourceTopicId());
            existing.setSourceTopicTitle(candidate.getSourceTopicTitle());
            wordRepository.save(existing);
        }
    }

    private void linkBookTopic(WordBook book, Topic topic) {
        wordBookTopicRepository.findByWordBookIdAndTopicId(book.getId(), topic.getId()).orElseGet(() -> {
            WordBookTopic link = new WordBookTopic();
            link.setWordBook(book);
            link.setTopic(topic);
            return wordBookTopicRepository.save(link);
        });
    }

    private void linkWordTopic(Word word, Long topicId) {
        if (topicId == null) return;
        topicRepository.findById(topicId).ifPresent(topic ->
                wordTopicRepository.findByWordIdAndTopicId(word.getId(), topicId).orElseGet(() -> {
                    WordTopic link = new WordTopic();
                    link.setWord(word);
                    link.setTopic(topic);
                    link.setTopicTitleEn(topic.getTitle());
                    link.setTopicTitleZh(topic.getTitleZh());
                    return wordTopicRepository.save(link);
                })
        );
    }

    private List<Word> parseWords(String content, WordDifficulty fallbackDifficulty, String sourceScene, Long sourceTopicId, String sourceTopicTitle) {
        try {
            JsonNode root = objectMapper.readTree(stripCodeFence(content));
            JsonNode array = root.has("words") ? root.get("words") : root;
            if (!array.isArray()) {
                throw new IllegalArgumentException("AI 返回不是 words 数组");
            }
            List<Word> words = new ArrayList<>();
            int index = 0;
            for (JsonNode node : array) {
                Word word = new Word();
                word.setWord(text(node, "word"));
                word.setPhonetic(text(node, "phonetic"));
                word.setPartOfSpeech(text(node, "partOfSpeech"));
                word.setDefinitionZh(text(node, "definitionZh"));
                word.setDefinitionEn(text(node, "definitionEn"));
                word.setCommonPatterns(text(node, "commonPatterns"));
                word.setExampleEn(text(node, "exampleEn"));
                word.setExampleZh(text(node, "exampleZh"));
                word.setDifficulty(parseDifficulty(text(node, "difficulty"), fallbackDifficulty));
                word.setSourceScene(firstNonBlank(text(node, "sourceScene"), sourceScene));
                word.setSourceTopicId(sourceTopicId);
                word.setSourceTopicTitle(sourceTopicTitle);
                word.setSortOrder(index++);
                words.add(word);
            }
            return words;
        } catch (Exception e) {
            throw new IllegalArgumentException("AI 返回格式错误：" + e.getMessage());
        }
    }

    private static String stripCodeFence(String content) {
        String text = content == null ? "" : content.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        return text;
    }

    private static String text(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        if (value.isArray()) {
            List<String> parts = new ArrayList<>();
            value.forEach(item -> parts.add(item.asText()));
            return String.join("\n", parts);
        }
        return value.asText();
    }

    private static WordDifficulty parseDifficulty(String value) {
        return parseDifficulty(value, WordDifficulty.BEGINNER);
    }

    private static WordDifficulty parseDifficulty(String value, WordDifficulty fallback) {
        if (value == null || value.isBlank()) return fallback;
        return "advanced".equalsIgnoreCase(value) || "ADVANCED".equalsIgnoreCase(value)
                ? WordDifficulty.ADVANCED
                : WordDifficulty.BEGINNER;
    }

    private static String stringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String firstNonBlank(String first, String second) {
        return !isBlank(first) ? first : second;
    }

    private static int intValue(Object value, int fallback) {
        return value == null ? fallback : ((Number) value).intValue();
    }

    public record SaveResult(int saved, int skipped, List<Word> savedWords, List<String> errors) {
        Map<String, Object> toResponse(List<Word> words) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("saved", saved);
            result.put("skipped", skipped);
            result.put("words", words.stream().map(word -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", word.getId());
                item.put("word", word.getWord());
                item.put("audioStatus", word.getAudioStatus());
                return item;
            }).toList());
            result.put("errors", errors);
            return result;
        }
    }

    static Long longValue(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(String.valueOf(value));
    }
}
