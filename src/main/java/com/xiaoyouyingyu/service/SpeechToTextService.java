package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.AiModel;
import com.xiaoyouyingyu.repository.AiModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SpeechToTextService {
    private static final String CRLF = "\r\n";

    private final AiModelRepository aiModelRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${app.ai.api-key}")
    private String defaultApiKey;

    @Value("${app.ai.api-url}")
    private String defaultApiUrl;

    @Value("${app.asr.api-url:}")
    private String asrApiUrl;

    @Value("${app.asr.model:whisper-1}")
    private String asrModel;

    public String transcribe(MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new IllegalArgumentException("请上传录音文件");
        }
        try {
            String filename = audioFile.getOriginalFilename();
            String contentType = audioFile.getContentType();
            return transcribe(audioFile.getBytes(), filename, contentType);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "语音识别失败，请重试");
        }
    }

    public String transcribe(byte[] audioBytes, String filename, String contentType) {
        if (audioBytes == null || audioBytes.length == 0) {
            throw new IllegalArgumentException("请上传录音文件");
        }
        try {
            ResolvedAsrConfig config = resolveConfig();
            String boundary = "----xiaoyou-asr-" + UUID.randomUUID();
            byte[] body = multipartBody(boundary, audioBytes, filename, contentType, config.model());

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.apiUrl()))
                    .header("Authorization", "Bearer " + config.apiKey())
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .timeout(Duration.ofSeconds(120))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "语音识别失败，请重试");
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (root.has("error")) {
                String message = root.path("error").path("message").asText("语音识别失败，请重试");
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, message);
            }

            String text = root.path("text").asText("");
            if (text == null || text.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "未识别到有效语音内容，请重录或改用文字输入");
            }
            return text.trim();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "语音识别失败，请重试");
        }
    }

    private ResolvedAsrConfig resolveConfig() {
        AiModel defaultModelConfig = aiModelRepository.findByIsDefaultTrue().orElse(null);
        String apiKey = defaultModelConfig != null ? defaultModelConfig.getApiKey() : defaultApiKey;
        String chatUrl = defaultModelConfig != null ? defaultModelConfig.getApiUrl() : defaultApiUrl;
        String url = asrApiUrl == null || asrApiUrl.isBlank() ? inferTranscriptionUrl(chatUrl) : asrApiUrl.trim();
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "语音识别配置缺少 API Key");
        }
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "语音识别配置缺少 API 地址");
        }
        String model = asrModel == null || asrModel.isBlank() ? "whisper-1" : asrModel.trim();
        return new ResolvedAsrConfig(url, apiKey, model);
    }

    private static String inferTranscriptionUrl(String chatUrl) {
        if (chatUrl == null || chatUrl.isBlank()) {
            return "";
        }
        String trimmed = chatUrl.trim();
        if (trimmed.endsWith("/audio/transcriptions")) {
            return trimmed;
        }
        if (trimmed.endsWith("/chat/completions")) {
            return trimmed.substring(0, trimmed.length() - "/chat/completions".length()) + "/audio/transcriptions";
        }
        if (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed + "/audio/transcriptions";
    }

    private static byte[] multipartBody(String boundary, MultipartFile file, String model) throws Exception {
        return multipartBody(boundary, file.getBytes(), file.getOriginalFilename(), file.getContentType(), model);
    }

    private static byte[] multipartBody(String boundary, byte[] fileBytes, String filename, String contentType, String model) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        writeField(out, boundary, "model", model);
        writeField(out, boundary, "language", "en");

        if (filename == null || filename.isBlank()) {
            filename = "recording.mp3";
        }
        if (contentType == null || contentType.isBlank()) {
            contentType = "audio/mpeg";
        }

        out.write(("--" + boundary + CRLF).getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + safeFilename(filename) + "\"" + CRLF).getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: " + contentType + CRLF + CRLF).getBytes(StandardCharsets.UTF_8));
        out.write(fileBytes);
        out.write(CRLF.getBytes(StandardCharsets.UTF_8));
        out.write(("--" + boundary + "--" + CRLF).getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    private static void writeField(ByteArrayOutputStream out, String boundary, String name, String value) throws Exception {
        out.write(("--" + boundary + CRLF).getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"" + name + "\"" + CRLF + CRLF).getBytes(StandardCharsets.UTF_8));
        out.write(value.getBytes(StandardCharsets.UTF_8));
        out.write(CRLF.getBytes(StandardCharsets.UTF_8));
    }

    private static String safeFilename(String filename) {
        return filename.replace("\"", "").replace("\r", "").replace("\n", "");
    }

    private record ResolvedAsrConfig(String apiUrl, String apiKey, String model) {}
}
