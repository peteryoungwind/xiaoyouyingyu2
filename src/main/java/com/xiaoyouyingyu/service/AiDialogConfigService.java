package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.dto.aidialog.AdminAiDialogConfigRequest;
import com.xiaoyouyingyu.dto.aidialog.AdminAiDialogConfigResponse;
import com.xiaoyouyingyu.entity.AiDialogConfig;
import com.xiaoyouyingyu.entity.AiDialogDifficulty;
import com.xiaoyouyingyu.entity.AiDialogMode;
import com.xiaoyouyingyu.repository.AiDialogConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiDialogConfigService {
    private final AiDialogConfigRepository repository;

    public AiDialogConfig getEffectiveConfig() {
        return repository.findTopByOrderByIdAsc().orElseGet(this::defaultConfig);
    }

    @Transactional
    public AdminAiDialogConfigResponse save(AdminAiDialogConfigRequest request) {
        AiDialogConfig config = repository.findTopByOrderByIdAsc().orElseGet(this::defaultConfig);
        apply(request, config);
        validate(config);
        return toResponse(repository.save(config));
    }

    @Transactional
    public AdminAiDialogConfigResponse resetPrompts() {
        AiDialogConfig config = repository.findTopByOrderByIdAsc().orElseGet(this::defaultConfig);
        AiDialogConfig defaults = defaultConfig();
        config.setTeachingBeginnerPrompt(defaults.getTeachingBeginnerPrompt());
        config.setTeachingAdvancedPrompt(defaults.getTeachingAdvancedPrompt());
        config.setPracticeBeginnerPrompt(defaults.getPracticeBeginnerPrompt());
        config.setPracticeAdvancedPrompt(defaults.getPracticeAdvancedPrompt());
        validate(config);
        return toResponse(repository.save(config));
    }

    public AdminAiDialogConfigResponse getAdminResponse() {
        return toResponse(getEffectiveConfig());
    }

    public String selectPrompt(AiDialogConfig config, AiDialogMode mode, AiDialogDifficulty difficulty) {
        if (mode == AiDialogMode.PRACTICE) {
            return difficulty == AiDialogDifficulty.ADVANCED
                    ? config.getPracticeAdvancedPrompt()
                    : config.getPracticeBeginnerPrompt();
        }
        return difficulty == AiDialogDifficulty.ADVANCED
                ? config.getTeachingAdvancedPrompt()
                : config.getTeachingBeginnerPrompt();
    }

    public AiDialogConfig defaultConfig() {
        AiDialogConfig config = new AiDialogConfig();
        config.setEnabled(true);
        config.setTemperature(0.7);
        config.setMaxRoundsPerSession(12);
        config.setDailyMessageLimit(30);
        config.setTtsVoice("alloy");
        config.setSpeechProvider("miniapp-native");
        config.setTtsProvider("configured-tts-model");
        config.setTeachingBeginnerPrompt("""
                你是“小柚英语”的英语口语 AI 对话教练。当前模式：教学模式，难度：初级。

                目标：帮助用户围绕主题进行轻松、可持续的英语口语练习。
                要求：
                - 使用简单英文短句回复，语气自然友好。
                - 每轮都要给出简短中文点评，指出一个最重要的表达问题或肯定一个亮点。
                - 给出一句更自然、更容易模仿的英文表达，并用中文解释。
                - 最后给出一句英文追问，引导用户继续说。
                - 不要长篇讲语法，不要输出 Markdown。

                必须只返回严格 JSON：
                {
                  "replyEn": "英文对话回复",
                  "feedbackZh": "简短中文点评或纠错",
                  "betterExpressionEn": "更自然的英文表达",
                  "betterExpressionZh": "中文解释",
                  "nextPromptEn": "下一句英文引导问题"
                }
                """);
        config.setTeachingAdvancedPrompt("""
                你是“小柚英语”的英语口语 AI 对话教练。当前模式：教学模式，难度：进阶。

                目标：帮助用户围绕主题提升地道表达、逻辑展开和观点深度。
                要求：
                - 用自然英文回应用户观点，信息密度可以略高，但保持口语感。
                - 中文点评聚焦表达准确性、地道性、逻辑衔接或观点展开中的一个关键点。
                - 给出一条更地道、更有层次的英文表达建议，并用中文说明为什么更好。
                - 最后用英文提出开放式追问，推动对话深入。
                - 不要输出 Markdown。

                必须只返回严格 JSON：
                {
                  "replyEn": "英文对话回复",
                  "feedbackZh": "简短中文点评或纠错",
                  "betterExpressionEn": "更自然的英文表达",
                  "betterExpressionZh": "中文解释",
                  "nextPromptEn": "下一句英文引导问题"
                }
                """);
        config.setPracticeBeginnerPrompt("""
                你是“小柚英语”的英语口语对话伙伴。当前模式：练习模式，难度：初级。

                目标：和用户围绕主题进行自然英文对话。
                要求：
                - 默认只用英文，不主动中文点评或纠错。
                - 使用常见词、短句和清晰问题。
                - 对用户表达保持鼓励，并自然延续话题。
                - 如果用户明确请求帮助，可以简短解释。
                - 不要输出 Markdown。

                必须只返回严格 JSON：
                {
                  "replyEn": "英文对话回复",
                  "nextPromptEn": "自然追问"
                }
                """);
        config.setPracticeAdvancedPrompt("""
                你是“小柚英语”的英语口语对话伙伴。当前模式：练习模式，难度：进阶。

                目标：和用户进行接近真实交流的英文对话。
                要求：
                - 默认只用英文，不主动中文点评或纠错。
                - 回复自然、有观点、有追问，可适度使用地道表达。
                - 鼓励用户展开原因、例子、对比和个人经历。
                - 如果用户明确请求帮助，可以简短解释。
                - 不要输出 Markdown。

                必须只返回严格 JSON：
                {
                  "replyEn": "英文对话回复",
                  "nextPromptEn": "自然追问"
                }
                """);
        return config;
    }

    private void apply(AdminAiDialogConfigRequest request, AiDialogConfig config) {
        config.setEnabled(request.getEnabled() != null ? request.getEnabled() : true);
        config.setAiModelId(request.getAiModelId());
        config.setAsrModelId(request.getAsrModelId());
        config.setTtsModelId(request.getTtsModelId());
        config.setTtsVoice(clean(request.getTtsVoice()));
        config.setSpeechProvider(clean(request.getSpeechProvider()));
        config.setTtsProvider(clean(request.getTtsProvider()));
        config.setTemperature(request.getTemperature());
        config.setMaxRoundsPerSession(request.getMaxRoundsPerSession());
        config.setDailyMessageLimit(request.getDailyMessageLimit());
        config.setTeachingBeginnerPrompt(request.getTeachingBeginnerPrompt());
        config.setTeachingAdvancedPrompt(request.getTeachingAdvancedPrompt());
        config.setPracticeBeginnerPrompt(request.getPracticeBeginnerPrompt());
        config.setPracticeAdvancedPrompt(request.getPracticeAdvancedPrompt());
    }

    private void validate(AiDialogConfig config) {
        if (config.getTemperature() == null || config.getTemperature() < 0 || config.getTemperature() > 2) {
            throw new IllegalArgumentException("温度必须在 0 到 2 之间");
        }
        if (config.getMaxRoundsPerSession() == null || config.getMaxRoundsPerSession() <= 0) {
            throw new IllegalArgumentException("单次最大轮数必须大于 0");
        }
        if (config.getDailyMessageLimit() == null || config.getDailyMessageLimit() <= 0) {
            throw new IllegalArgumentException("每日发送轮数限制必须大于 0");
        }
        requirePrompt(config.getTeachingBeginnerPrompt(), "教学初级提示词不能为空");
        requirePrompt(config.getTeachingAdvancedPrompt(), "教学进阶提示词不能为空");
        requirePrompt(config.getPracticeBeginnerPrompt(), "练习初级提示词不能为空");
        requirePrompt(config.getPracticeAdvancedPrompt(), "练习进阶提示词不能为空");
    }

    private static void requirePrompt(String prompt, String message) {
        if (prompt == null || prompt.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public AdminAiDialogConfigResponse toResponse(AiDialogConfig config) {
        AdminAiDialogConfigResponse response = new AdminAiDialogConfigResponse();
        response.setId(config.getId());
        response.setEnabled(config.getEnabled());
        response.setAiModelId(config.getAiModelId());
        response.setAsrModelId(config.getAsrModelId());
        response.setTtsModelId(config.getTtsModelId());
        response.setTtsVoice(config.getTtsVoice());
        response.setSpeechProvider(config.getSpeechProvider());
        response.setTtsProvider(config.getTtsProvider());
        response.setTemperature(config.getTemperature());
        response.setMaxRoundsPerSession(config.getMaxRoundsPerSession());
        response.setDailyMessageLimit(config.getDailyMessageLimit());
        response.setTeachingBeginnerPrompt(config.getTeachingBeginnerPrompt());
        response.setTeachingAdvancedPrompt(config.getTeachingAdvancedPrompt());
        response.setPracticeBeginnerPrompt(config.getPracticeBeginnerPrompt());
        response.setPracticeAdvancedPrompt(config.getPracticeAdvancedPrompt());
        response.setCreatedAt(config.getCreatedAt());
        response.setUpdatedAt(config.getUpdatedAt());
        return response;
    }
}
