package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.AiModel;
import com.xiaoyouyingyu.repository.AiModelRepository;
import com.xiaoyouyingyu.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {
    @Value("${app.ai.api-key}")
    private String defaultApiKey;

    @Value("${app.ai.api-url}")
    private String defaultApiUrl;

    @Value("${app.ai.model}")
    private String defaultModel;

    private final AiModelRepository aiModelRepository;
    private final TopicRepository topicRepository;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // ===================== 旧接口保留（兼容） =====================

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
        return callAi(null, SYSTEM_PROMPT, prompt, history);
    }

    // ===================== 新接口：批量生成标题 =====================

    /**
     * 批量生成5个主题标题，避免与近一年主题重复
     */
    public String generateTitles(Long modelId, String prompt) {
        // 获取近一年的主题中文标题
        List<String> recentTitles = topicRepository.findRecentTitleZhSince(LocalDate.now().minusYears(1));
        // 获取所有历史标题（用于轻度相似提醒）
        List<String> allTitles = topicRepository.findAllTitleZh();

        String recentTitlesStr = recentTitles.isEmpty() ? "（暂无）" : String.join("、", recentTitles);
        // 一年之前的标题 = 所有标题 - 近一年标题
        List<String> olderTitles = new ArrayList<>(allTitles);
        olderTitles.removeAll(recentTitles);
        String olderTitlesStr = olderTitles.isEmpty() ? "（暂无）" : String.join("、", olderTitles);

        String systemPrompt = """
                你是一位专业英语教育专家，专注于为年轻人设计英语口语练习话题。

                ## 任务
                根据用户需求一次生成 5 个英语口语练习主题标题（仅标题，无需问题）。

                ## 主题设计要求
                - 标题要宽泛、概括性强，是一个大方向/大主题，而不是一个具体的小问题
                - 好的标题示例：「周末时光」「职场社交」「童年回忆」「饮食习惯」「旅行见闻」
                - 不好的标题示例（太细）：「如何在周末早起去跑步」「第一次独自出国旅行的经历」
                - 标题应该是一个能展开 10 个讨论问题的大话题，而不是一个只能回答一两句话的具体问题
                - 主题要贴近年轻人生活，有普适性，让每个人都能有话可说
                - 避免过于学术或宏大的话题（如"全球化""人工智能的未来"）

                ## 去重规则（非常重要！）
                以下是近一年内已有的主题中文标题，生成的新主题绝对不能与这些相同或高度相似：
                【近一年主题】%s

                以下是一年之前的历史主题，新主题可以与这些有轻度相似，但不要完全相同：
                【历史主题】%s

                ## 输出格式
                必须返回严格的 JSON 格式，不要包含任何其他内容：
                {
                  "titles": [
                    { "en": "English Title", "zh": "中文标题" },
                    { "en": "English Title", "zh": "中文标题" },
                    { "en": "English Title", "zh": "中文标题" },
                    { "en": "English Title", "zh": "中文标题" },
                    { "en": "English Title", "zh": "中文标题" }
                  ]
                }
                只返回 JSON，不要任何解释或多余文字。
                """.formatted(recentTitlesStr, olderTitlesStr);

        String userPrompt = (prompt == null || prompt.isBlank())
                ? "请帮我生成5个适合年轻人讨论的英语口语练习话题"
                : prompt;

        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    // ===================== 新接口：根据主题生成问题 =====================

    /**
     * 根据选中的主题标题生成10个讨论问题
     */
    public String generateQuestions(Long modelId, String titleEn, String titleZh) {
        String systemPrompt = """
                你是一位专业英语教育专家，专注于为年轻人设计英语口语练习问题。

                ## 任务
                根据给定的主题，生成 10 个英语口语讨论问题（中英双语）。

                ## 问题设计要求
                1. 问题不能特别宽泛，要更容易回答
                2. 尽量和每个人的日常生活相关
                3. 从最简单的口语化问题，到更有深度的问题依次递进：
                   - 前 2-3 个问题：非常简单、日常口语化，如个人经历、习惯偏好
                   - 中间 4-5 个问题：中等难度，需要一些思考和表达观点
                   - 最后 2-3 个问题：有一定深度，涉及分析、对比、假设等
                4. 每个问题都应该让人有话可说，避免只能回答"是/否"的问题

                ## 输出格式
                必须返回严格的 JSON 格式：
                {
                  "questions": [
                    { "en": "English Question?", "zh": "中文问题？" }
                  ]
                }
                生成恰好 10 个问题。只返回 JSON，不要任何解释或多余文字。
                """;

        String userPrompt = "主题：%s（%s）\n请为这个主题生成10个由浅入深的英语口语讨论问题。".formatted(titleEn, titleZh);

        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    // ===================== 统一 AI 调用方法 =====================

    private String callAi(Long modelId, String systemPrompt, String userPrompt, List<Map<String, String>> history) {
        try {
            // 确定使用的模型配置
            String apiUrl = defaultApiUrl;
            String apiKey = defaultApiKey;
            String model = defaultModel;

            if (modelId != null) {
                AiModel aiModel = aiModelRepository.findById(modelId).orElse(null);
                if (aiModel != null) {
                    apiUrl = aiModel.getApiUrl();
                    apiKey = aiModel.getApiKey();
                    model = aiModel.getModelName();
                }
            }

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            if (history != null) {
                messages.addAll(history);
            }
            messages.add(Map.of("role", "user", "content", userPrompt));

            Map<String, Object> body = Map.of("model", model, "messages", messages);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(Duration.ofSeconds(180))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = mapper.readTree(response.body());

            // 检查是否有错误
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText("AI 调用失败");
                return "{\"error\": \"" + errorMsg.replace("\"", "\\\"") + "\"}";
            }

            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            return "{\"error\": \"AI 生成失败: " + e.getMessage().replace("\"", "\\\"") + "\"}";
        }
    }
}
