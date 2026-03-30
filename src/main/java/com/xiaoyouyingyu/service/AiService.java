package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
public class AiService {
    @Value("${app.ai.api-key}")
    private String apiKey;

    @Value("${app.ai.api-url}")
    private String apiUrl;

    @Value("${app.ai.model}")
    private String model;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    private static final String SYSTEM_PROMPT = """
            你是一位专业英语教育专家。根据用户输入生成一个结构化的英语口语练习主题。
            必须返回严格的 JSON 格式：
            {
              "title": "主题标题",
              "tags": ["标签1", "标签2"],
              "questions": [
                { "en": "English Question?", "zh": "中文对应问题？" }
              ]
            }
            生成 5-8 个讨论问题，每个问题必须包含英文和中文。只返回 JSON，不要其他内容。
            """;

    public String generate(String prompt, List<Map<String, String>> history) {
        try {
            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
            if (history != null) {
                messages.addAll(history);
            }
            messages.add(Map.of("role", "user", "content", prompt));

            Map<String, Object> body = Map.of("model", model, "messages", messages);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(response.body());
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            return "{\"error\": \"AI 生成失败: " + e.getMessage() + "\"}";
        }
    }
}
