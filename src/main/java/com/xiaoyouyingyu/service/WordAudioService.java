package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.TtsModel;
import com.xiaoyouyingyu.entity.Word;
import com.xiaoyouyingyu.entity.WordAudioStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WordAudioService {
    private final TtsModelService ttsModelService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public void markPending(Word word) {
        word.setAudioStatus(WordAudioStatus.PENDING);
        word.setAudioError(null);
    }

    public void generateAllAudio(Word word) {
        generateAllAudio(word, null);
    }

    public void generateAllAudio(Word word, Long ttsModelId) {
        if (word.getId() == null) {
            markPending(word);
            word.setAudioError("单词保存后才能生成音频");
            return;
        }

        try {
            TtsModel model = ttsModelService.getEnabled(ttsModelId);
            String format = resolveStoredFormat(model);
            Path dir = Path.of(uploadDir, "word-audio", String.valueOf(word.getWordBook().getId()), String.valueOf(word.getId()));
            Files.createDirectories(dir);

            word.setAudioUsUrl(generateOne(model, word.getWord(), model.getVoiceUs(), dir.resolve("word-us." + format)));
            word.setAudioUkUrl(generateOne(model, word.getWord(), model.getVoiceUk(), dir.resolve("word-uk." + format)));

            if (word.getExampleEn() != null && !word.getExampleEn().isBlank()) {
                word.setExampleAudioUsUrl(generateOne(model, word.getExampleEn(), model.getVoiceUs(), dir.resolve("example-us." + format)));
                word.setExampleAudioUkUrl(generateOne(model, word.getExampleEn(), model.getVoiceUk(), dir.resolve("example-uk." + format)));
            }

            word.setAudioStatus(WordAudioStatus.READY);
            word.setAudioError(null);
        } catch (Exception e) {
            word.setAudioStatus(WordAudioStatus.FAILED);
            word.setAudioError(e.getMessage() == null ? "音频生成失败" : truncate(e.getMessage()));
        }
    }

    private String generateOne(TtsModel model, String text, String voice, Path target) throws Exception {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("音频文本不能为空");
        }

        if (isQwenProvider(model)) {
            return generateQwen(model, text, voice, target);
        }
        return generateOpenAiCompatible(model, text, voice, target);
    }

    private String generateOpenAiCompatible(TtsModel model, String text, String voice, Path target) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.getModelName());
        body.put("voice", voice);
        body.put("input", text);
        body.put("response_format", normalizeFormat(model.getOutputFormat()));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeSpeechUrl(model.getBaseUrl())))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + model.getApiKey())
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String error = new String(response.body(), StandardCharsets.UTF_8);
            throw new IllegalStateException("TTS 调用失败（" + response.statusCode() + "）：" + truncate(error));
        }
        Files.write(target, response.body());
        return localUrl(target);
    }

    private String generateQwen(TtsModel model, String text, String voice, Path target) throws Exception {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("text", text);
        input.put("voice", voice);
        input.put("language_type", "English");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model.getModelName());
        body.put("input", input);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(normalizeQwenGenerationUrl(model.getBaseUrl())))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + model.getApiKey())
                .timeout(Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
                .build();

        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String error = new String(response.body(), StandardCharsets.UTF_8);
            throw new IllegalStateException("Qwen TTS 调用失败（" + response.statusCode() + "）：" + truncate(error));
        }

        JsonNode root = objectMapper.readTree(response.body());
        String audioUrl = root.path("output").path("audio").path("url").asText();
        if (audioUrl == null || audioUrl.isBlank()) {
            throw new IllegalStateException("Qwen TTS 未返回音频 URL：" + truncate(root.toString()));
        }

        HttpRequest downloadRequest = HttpRequest.newBuilder()
                .uri(URI.create(audioUrl))
                .timeout(Duration.ofSeconds(120))
                .GET()
                .build();
        HttpResponse<byte[]> downloadResponse = httpClient.send(downloadRequest, HttpResponse.BodyHandlers.ofByteArray());
        if (downloadResponse.statusCode() < 200 || downloadResponse.statusCode() >= 300) {
            String error = new String(downloadResponse.body(), StandardCharsets.UTF_8);
            throw new IllegalStateException("Qwen TTS 音频下载失败（" + downloadResponse.statusCode() + "）：" + truncate(error));
        }

        Files.write(target, downloadResponse.body());
        return localUrl(target);
    }

    private static String normalizeSpeechUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalArgumentException("TTS API 地址不能为空");
        }
        String trimmed = baseUrl.trim();
        if (trimmed.endsWith("/audio/speech")) {
            return trimmed;
        }
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed + "/audio/speech";
    }

    private static String normalizeQwenGenerationUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new IllegalArgumentException("TTS API 地址不能为空");
        }
        String trimmed = baseUrl.trim();
        if (trimmed.endsWith("/services/aigc/multimodal-generation/generation")) {
            return trimmed;
        }
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed + "/services/aigc/multimodal-generation/generation";
    }

    private static boolean isQwenProvider(TtsModel model) {
        String provider = model.getProvider();
        if (provider == null) {
            return false;
        }
        String normalized = provider.trim().toLowerCase();
        return normalized.equals("qwen") || normalized.equals("dashscope") || normalized.equals("aliyun");
    }

    private static String resolveStoredFormat(TtsModel model) {
        if (isQwenProvider(model)) {
            String format = normalizeFormat(model.getOutputFormat());
            return "mp3".equals(format) ? "wav" : format;
        }
        return normalizeFormat(model.getOutputFormat());
    }

    private static String normalizeFormat(String format) {
        if (format == null || format.isBlank()) {
            return "mp3";
        }
        return format.trim().toLowerCase();
    }

    private static String localUrl(Path target) {
        Path wordDir = target.getParent();
        Path bookDir = wordDir.getParent();
        return "/uploads/word-audio/" + bookDir.getFileName() + "/" + wordDir.getFileName() + "/" + target.getFileName();
    }

    private static String truncate(String value) {
        if (value == null) {
            return "";
        }
        return value.length() > 900 ? value.substring(0, 900) : value;
    }
}
