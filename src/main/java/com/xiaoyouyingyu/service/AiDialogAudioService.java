package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.TtsModel;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiDialogAudioService {
    private final TtsModelService ttsModelService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String generateReplyAudio(Long ttsModelId, String text, String voice) {
        if (text == null || text.isBlank()) {
            return null;
        }
        try {
            TtsModel model = ttsModelService.getEnabled(ttsModelId);
            String resolvedVoice = voice == null || voice.isBlank() ? model.getVoiceUs() : voice.trim();
            String format = resolveStoredFormat(model);
            Path dir = Path.of(uploadDir, "ai-dialog");
            Files.createDirectories(dir);
            Path target = dir.resolve(UUID.randomUUID() + "." + format);
            if (isQwenProvider(model)) {
                return generateQwen(model, text, resolvedVoice, target);
            }
            return generateOpenAiCompatible(model, text, resolvedVoice, target);
        } catch (Exception e) {
            return null;
        }
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
            throw new IllegalStateException(new String(response.body(), StandardCharsets.UTF_8));
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
            throw new IllegalStateException(new String(response.body(), StandardCharsets.UTF_8));
        }

        JsonNode root = objectMapper.readTree(response.body());
        String audioUrl = root.path("output").path("audio").path("url").asText();
        if (audioUrl == null || audioUrl.isBlank()) {
            throw new IllegalStateException("Qwen TTS 未返回音频 URL");
        }

        HttpRequest downloadRequest = HttpRequest.newBuilder()
                .uri(URI.create(audioUrl))
                .timeout(Duration.ofSeconds(120))
                .GET()
                .build();
        HttpResponse<byte[]> downloadResponse = httpClient.send(downloadRequest, HttpResponse.BodyHandlers.ofByteArray());
        if (downloadResponse.statusCode() < 200 || downloadResponse.statusCode() >= 300) {
            throw new IllegalStateException(new String(downloadResponse.body(), StandardCharsets.UTF_8));
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
        return format == null || format.isBlank() ? "mp3" : format.trim().toLowerCase();
    }

    private static String localUrl(Path target) {
        return "/uploads/ai-dialog/" + target.getFileName();
    }
}
