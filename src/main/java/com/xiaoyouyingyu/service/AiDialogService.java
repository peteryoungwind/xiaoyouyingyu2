package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.dto.aidialog.*;
import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiDialogService {
    private final AiDialogConfigService configService;
    private final AiDialogUsageService usageService;
    private final AiDialogAudioService audioService;
    private final AiService aiService;
    private final TopicRepository topicRepository;
    private final ObjectMapper objectMapper;

    public AiDialogConfigSummaryResponse getSummary(Long userId) {
        AiDialogConfig config = configService.getEffectiveConfig();
        int remaining = usageService.remainingToday(userId, config.getDailyMessageLimit());
        return new AiDialogConfigSummaryResponse(
                config.getEnabled(),
                config.getMaxRoundsPerSession(),
                config.getDailyMessageLimit(),
                remaining
        );
    }

    public AiDialogMessageResponse sendMessage(Long userId, AiDialogMessageRequest request) {
        AiDialogConfig config = configService.getEffectiveConfig();
        if (!Boolean.TRUE.equals(config.getEnabled())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI 对话暂不可用，请稍后再试");
        }
        validateMessage(request, config);
        usageService.ensureQuota(userId, config.getDailyMessageLimit());

        String topicContext = buildTopicContext(request);
        String systemPrompt = buildSystemPrompt(config, request, topicContext);
        List<Map<String, String>> history = sanitizeHistory(request.getHistory());
        String userPrompt = """
                用户本轮发言：
                %s
                """.formatted(request.getMessage().trim());

        String content = aiService.generateStructuredReply(
                config.getAiModelId(),
                systemPrompt,
                userPrompt,
                history,
                config.getTemperature()
        );
        AiDialogReply reply = parseReply(content, request.getMode());
        int remaining = usageService.incrementAfterSuccess(userId, config.getDailyMessageLimit());
        String audioUrl = audioService.generateReplyAudio(config.getTtsModelId(), reply.getReplyEn(), config.getTtsVoice());
        return new AiDialogMessageResponse(remaining, reply, audioUrl);
    }

    private void validateMessage(AiDialogMessageRequest request, AiDialogConfig config) {
        if (request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("消息不能为空");
        }
        if (request.getMessage().trim().length() > 1000) {
            throw new IllegalArgumentException("单条消息不能超过 1000 个字符");
        }
        int roundCount = request.getRoundCount() == null ? 0 : request.getRoundCount();
        if (roundCount < 0) {
            throw new IllegalArgumentException("轮数不能小于 0");
        }
        if (roundCount >= config.getMaxRoundsPerSession()) {
            throw new IllegalArgumentException("本次对话已达到最大轮数，请重新开始");
        }
        if (request.getTopicSource() == AiDialogTopicSource.CUSTOM) {
            if (request.getCustomTopic() == null || request.getCustomTopic().isBlank()) {
                throw new IllegalArgumentException("请输入自定义主题");
            }
            if (request.getCustomTopic().trim().length() > 100) {
                throw new IllegalArgumentException("自定义主题不能超过 100 个字符");
            }
        }
        if (request.getTopicSource() == AiDialogTopicSource.SYSTEM && request.getTopicId() == null) {
            throw new IllegalArgumentException("请选择系统主题");
        }
    }

    private String buildTopicContext(AiDialogMessageRequest request) {
        if (request.getTopicSource() == AiDialogTopicSource.CUSTOM) {
            return "自定义主题：" + request.getCustomTopic().trim();
        }
        Topic topic = topicRepository.findById(request.getTopicId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "主题不存在"));
        return """
                系统主题英文标题：%s
                系统主题中文标题：%s
                标签：%s
                讨论问题 JSON：%s
                """.formatted(
                nullToBlank(topic.getTitle()),
                nullToBlank(topic.getTitleZh()),
                nullToBlank(topic.getTags()),
                nullToBlank(topic.getQuestions())
        );
    }

    private String buildSystemPrompt(AiDialogConfig config, AiDialogMessageRequest request, String topicContext) {
        return """
                %s

                ## 当前练习上下文
                %s

                ## 运行规则
                - 当前模式：%s
                - 当前难度：%s
                - 你必须参考当前主题和最近上下文回复。
                - 输出必须是可被 JSON.parse 解析的纯 JSON，不要加 Markdown 代码块。
                """.formatted(
                configService.selectPrompt(config, request.getMode(), request.getDifficulty()),
                topicContext,
                request.getMode(),
                request.getDifficulty()
        );
    }

    private List<Map<String, String>> sanitizeHistory(List<AiDialogHistoryMessage> history) {
        List<Map<String, String>> messages = new ArrayList<>();
        if (history == null) {
            return messages;
        }
        int from = Math.max(0, history.size() - 16);
        for (AiDialogHistoryMessage item : history.subList(from, history.size())) {
            if (item.getContent() == null || item.getContent().isBlank()) {
                continue;
            }
            String role = "assistant".equals(item.getRole()) ? "assistant" : "user";
            messages.add(Map.of("role", role, "content", item.getContent()));
        }
        return messages;
    }

    private AiDialogReply parseReply(String content, AiDialogMode mode) {
        try {
            JsonNode root = objectMapper.readTree(extractJson(content));
            if (root.has("error")) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, root.path("error").asText("AI 对话生成失败"));
            }
            AiDialogReply reply = new AiDialogReply();
            reply.setReplyEn(root.path("replyEn").asText(""));
            reply.setFeedbackZh(blankToNull(root.path("feedbackZh").asText(null)));
            reply.setBetterExpressionEn(blankToNull(root.path("betterExpressionEn").asText(null)));
            reply.setBetterExpressionZh(blankToNull(root.path("betterExpressionZh").asText(null)));
            reply.setNextPromptEn(blankToNull(root.path("nextPromptEn").asText(null)));
            if (reply.getReplyEn() == null || reply.getReplyEn().isBlank()) {
                throw new IllegalArgumentException("AI 回复缺少 replyEn");
            }
            if (mode == AiDialogMode.TEACHING && (
                    reply.getFeedbackZh() == null
                            || reply.getBetterExpressionEn() == null
                            || reply.getBetterExpressionZh() == null
                            || reply.getNextPromptEn() == null
            )) {
                throw new IllegalArgumentException("教学模式回复字段不完整");
            }
            return reply;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI 回复格式异常，请稍后重试");
        }
    }

    private static String extractJson(String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("AI 回复为空");
        }
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceFirst("^```(?:json)?", "").replaceFirst("```$", "").trim();
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private static String nullToBlank(String value) {
        return value == null ? "" : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
