package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.entity.AiModel;
import com.xiaoyouyingyu.entity.Topic;
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
    private record ResolvedAiConfig(String apiUrl, String apiKey, String modelName) {}

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
                你是一位专业英语教育专家，专注于设计适合大众练习的英语口语主题。

                ## 任务
                根据用户需求一次生成 5 个英语口语练习主题标题（仅标题，无需问题）。

                ## 主题设计要求
                - 主题必须贴近日常工作与日常生活，优先选择大多数人都真实经历过、观察过、思考过的场景
                - 优先方向：日常沟通、工作协作、学习成长、时间安排、消费选择、健康习惯、人际关系、家庭生活、通勤出行、休闲放松、网络生活、情绪与压力管理
                - 标题不要太虚、太空、太宏大，也不要过于概念化
                - 不要把主题限定在某一小群体、某一种职业、某个年龄层、某个特定身份或小众经历上
                - 标题应让学生、上班族、自由职业者、全职家长等不同背景的人都能结合自己的经验开口表达
                - 标题要具体到能联想到真实场景，但又不能细到只剩一个小问题
                - 标题应该是一个能自然展开 10 个讨论问题的话题，而不是一个只能回答一两句话的具体问题

                ## 示例
                - 好的标题示例：「下班后的时间安排」「和同事相处」「线上购物习惯」「家庭分工」「工作压力」「周末放松方式」
                - 不好的标题示例（太虚/太空）：「现代社会的发展」「科技改变世界」「人生的意义」
                - 不好的标题示例（太窄/太细）：「程序员如何在凌晨发布系统后缓解压力」「空乘人员在国际航班上的沟通技巧」

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
                ? "请帮我生成5个贴近日常工作和生活、适合大多数人表达的英语口语练习主题"
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

    // ===================== 单词练习：生成单词 =====================

    public String generateWordsByScene(Long modelId, String scene, int count, String difficulty) {
        String systemPrompt = wordGenerationSystemPrompt(difficulty);
        String userPrompt = """
                场景描述：%s
                生成数量：%d
                难度：%s

                请生成适合该场景的单词或短语，按语义相关性排序，让相关词相邻。
                """.formatted(scene, count, difficulty);
        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    public String generateWordsByTopic(Long modelId, Topic topic, int count, String difficulty) {
        String systemPrompt = wordGenerationSystemPrompt(difficulty);
        String userPrompt = """
                口语主题英文标题：%s
                口语主题中文标题：%s
                标签：%s
                讨论问题 JSON：%s
                生成数量：%d
                难度：%s

                请生成和该口语主题高度相关、能帮助用户表达该主题的单词或短语。
                """.formatted(topic.getTitle(), topic.getTitleZh(), topic.getTags(), topic.getQuestions(), count, difficulty);
        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    private String wordGenerationSystemPrompt(String difficulty) {
        boolean advanced = "advanced".equalsIgnoreCase(difficulty);
        return """
                你是一位专业英语词汇教研老师。请为“小柚英语”的单词练习模块生成结构化词汇。

                ## 难度要求
                - 当前难度：%s
                %s

                ## 内容要求
                - 返回单词或高频短语，不要生成长句
                - 按语义相关性排序，让相关词相邻
                - 每个词必须包含中文释义、英文释义、音标、词性、常用搭配或常用句型、英文例句、中文例句翻译
                - 例句要自然、适合口语表达

                ## 输出格式
                必须返回严格 JSON，不要 Markdown，不要解释：
                {
                  "words": [
                    {
                      "word": "word or phrase",
                      "phonetic": "/.../",
                      "partOfSpeech": "noun/verb/phrase",
                      "definitionZh": "中文释义",
                      "definitionEn": "English definition",
                      "commonPatterns": "common collocations or sentence patterns",
                      "exampleEn": "Natural example sentence.",
                      "exampleZh": "例句中文翻译",
                      "difficulty": "%s",
                      "sourceScene": "来源场景，可为空"
                    }
                  ]
                }
                """.formatted(
                advanced ? "advanced" : "beginner",
                advanced
                        ? "- 进阶词汇应更精确、更地道，适合表达升级，但仍需常见可用"
                        : "- 初级词汇应高频、基础、容易用于日常开口表达，避免过难或生僻词",
                advanced ? "advanced" : "beginner"
        );
    }

    // ===================== 学习中心：生成词汇 =====================

    public String generateVocabulary(Long modelId, String titleEn, String titleZh, String mode, String exclude) {
        boolean beginner = "beginner".equals(mode);
        String excludeRule = (exclude != null && !exclude.isBlank())
                ? "\n\n## 去重规则（非常重要！）\n以下词汇/短语已经生成过，本次绝对不能再出现这些内容，必须生成全新的词汇：\n【已有内容】" + exclude
                : "";
        String systemPrompt = """
                你是一位专业英语教育专家。根据给定的口语练习主题，生成主题相关词汇表。

                ## 模式：%s

                ## 要求
                - 生成恰好 10 个与主题紧密相关的词汇/短语
                - 按分类组织：基础词汇、高频短语、观点表达词、连接词
                %s%s

                ## 输出格式
                必须返回严格的 JSON：
                {
                  "vocabulary": [
                    {
                      "word": "英文单词或短语",
                      "zh": "中文释义",
                      "example": "英文例句",
                      "exampleZh": "例句中文翻译",
                      "category": "分类名",
                      "difficulty": "basic/intermediate/advanced"
                    }
                  ]
                }
                生成恰好 10 个 vocabulary items。只返回 JSON，不要其他内容。
                """.formatted(
                beginner ? "初级" : "进阶",
                beginner ? "- 不要生成太基础的词汇（如 like, good, big, happy 等小学水平的词），要生成实用但有一定含金量的词汇和短语\n- 优先选择日常口语中高频使用、但中国学生不太熟悉的地道表达和短语\n- 例句简短，中文释义清晰明确" : "- 增加地道表达和同义替换\n- 增加高阶词汇",
                excludeRule
        );
        return callAi(modelId, systemPrompt, "主题：%s（%s）".formatted(titleEn, titleZh), null);
    }

    // ===================== 口语热身：生成句型模板 =====================

    public String generateSentencePatterns(Long modelId, String titleEn, String titleZh, String mode, String exclude) {
        boolean beginner = "beginner".equals(mode);
        String excludeRule = (exclude != null && !exclude.isBlank())
                ? "\n\n## 去重规则（非常重要！）\n以下句型模板已经生成过，本次绝对不能再出现相同或高度相似的模板结构，必须生成全新的句型：\n【已有内容】" + exclude
                : "";
        String systemPrompt = """
                你是一位专业英语口语教研老师。根据给定主题，生成可以直接套用的口语句型模板。

                ## 模式：%s

                ## 要求
                - 生成恰好 6 个句型模板
                - 每个模板都要适合围绕当前主题开口表达
                - 初级模板要短、清晰、容易替换关键词
                - 进阶模板要包含原因、转折、让步、比较、假设等逻辑关系
                %s

                ## 输出格式
                必须返回严格 JSON：
                {
                  "sentencePatterns": [
                    {
                      "pattern": "I tend to ... when ...",
                      "zh": "中文解释",
                      "useCase": "适用场景",
                      "example": "套用当前主题后的英文例句",
                      "exampleZh": "例句中文解释"
                    }
                  ]
                }
                生成恰好 6 个 sentencePatterns。只返回 JSON，不要其他内容。
                """.formatted(beginner ? "初级" : "进阶", excludeRule);
        return callAi(modelId, systemPrompt, "主题：%s（%s）".formatted(titleEn, titleZh), null);
    }

    // ===================== 口语热身：生成地道表达 =====================

    public String generateIdiomaticExpressions(Long modelId, String titleEn, String titleZh, String mode, String exclude) {
        boolean beginner = "beginner".equals(mode);
        String excludeRule = (exclude != null && !exclude.isBlank())
                ? "\n\n## 去重规则（非常重要！）\n以下地道表达已经生成过，本次绝对不能再出现这些表达或高度相似表达，必须生成全新的表达：\n【已有内容】" + exclude
                : "";
        String systemPrompt = """
                你是一位专业英语口语教研老师。根据给定主题，生成能提升自然度的主题相关地道表达。

                ## 模式：%s

                ## 要求
                - 生成恰好 6 个地道表达
                - 表达必须适合真实口语场景，不要过度书面化
                - 初级表达要常用、低风险、容易开口
                - 进阶表达要更自然，可以包含固定搭配、语气表达或观点表达
                %s

                ## 输出格式
                必须返回严格 JSON：
                {
                  "idiomaticExpressions": [
                    {
                      "expression": "It depends on the situation.",
                      "zh": "中文含义",
                      "usage": "使用说明",
                      "example": "套用当前主题后的英文例句",
                      "exampleZh": "例句中文解释"
                    }
                  ]
                }
                生成恰好 6 个 idiomaticExpressions。只返回 JSON，不要其他内容。
                """.formatted(beginner ? "初级" : "进阶", excludeRule);
        return callAi(modelId, systemPrompt, "主题：%s（%s）".formatted(titleEn, titleZh), null);
    }

    // ===================== 学习中心：生成表达工具箱 =====================

    public String generateExpressions(Long modelId, String titleEn, String titleZh, String mode, String exclude) {
        boolean beginner = "beginner".equals(mode);
        String excludeRule = (exclude != null && !exclude.isBlank())
                ? "\n\n## 去重规则（非常重要！）\n以下表达模板已经生成过，本次绝对不能再出现这些内容，必须生成全新的表达：\n【已有内容】" + exclude
                : "";
        String systemPrompt = """
                你是一位专业英语教育专家。根据给定的口语练习主题，生成实用表达模板。

                ## 模式：%s

                ## 要求
                按功能分类生成表达模板：表达观点、说明原因、举例说明、对比比较、补充展开、总结结尾
                每个分类 2-3 个表达
                %s%s

                ## 输出格式
                必须返回严格的 JSON：
                {
                  "expressions": [
                    {
                      "category": "分类名（如：表达观点）",
                      "template": "I think ___ is important because ___.",
                      "zh": "中文说明",
                      "example": "完整例句",
                      "exampleZh": "例句中文翻译"
                    }
                  ]
                }
                只返回 JSON，不要其他内容。
                """.formatted(
                beginner ? "初级" : "进阶",
                beginner ? "- 句型简单，带中文提示槽位" : "- 增加自然衔接表达和高阶替换句型",
                excludeRule
        );
        return callAi(modelId, systemPrompt, "主题：%s（%s）".formatted(titleEn, titleZh), null);
    }

    // ===================== 学习中心：生成练习任务 =====================

    public String generateTasks(Long modelId, String titleEn, String titleZh, String mode, String exclude) {
        boolean beginner = "beginner".equals(mode);
        String excludeRule = (exclude != null && !exclude.isBlank())
                ? "\n\n## 去重规则（非常重要！）\n以下练习任务已经生成过，本次绝对不能再出现相同或高度相似的任务，必须生成全新的任务：\n【已有内容】" + exclude
                : "";
        String systemPrompt = """
                你是一位专业英语教育专家。根据给定的口语练习主题，生成练习任务。

                ## 模式：%s

                ## 任务类型
                %s%s

                ## 输出格式
                必须返回严格的 JSON：
                {
                  "tasks": [
                    {
                      "title": "任务标题",
                      "titleZh": "中文标题",
                      "type": "任务类型",
                      "description": "英文任务描述",
                      "descriptionZh": "中文任务描述",
                      "hints": ["提示1", "提示2"],
                      "estimatedMinutes": 3,
                      "difficulty": "easy/medium/hard"
                    }
                  ]
                }
                生成恰好 3 个任务，难度递进。只返回 JSON，不要其他内容。
                """.formatted(
                beginner ? "初级" : "进阶",
                beginner ?
                    "- 关键词开口：给关键词说2-3句话\n- 句型填充：补充句型框架\n- 短回答：15-30秒简短回答\n- 模仿替换：看参考答案后替换自己信息\n- 看提示复述：根据要点组织语言" :
                    "- 限时表达：30/60/90秒表达\n- 观点展开：观点+原因+例子\n- 立场转换：先支持再反对\n- 追问挑战：回答后接受追问\n- 双角度分析：个人和社会角度",
                excludeRule
        );
        return callAi(modelId, systemPrompt, "主题：%s（%s）".formatted(titleEn, titleZh), null);
    }

    // ===================== 学习中心：AI 点评 =====================

    public String reviewAnswer(Long modelId, String titleEn, String titleZh, String taskTitle, String userAnswer, String mode) {
        return reviewAnswer(modelId, titleEn, titleZh, taskTitle, "", userAnswer, mode, "");
    }

    public String reviewAnswer(Long modelId, String titleEn, String titleZh, String taskTitle, String taskDescription, String userAnswer, String mode, String inputMode) {
        if (userAnswer == null || userAnswer.isBlank()) {
            throw new IllegalArgumentException("回答不能为空");
        }
        boolean beginner = "beginner".equals(mode);
        String systemPrompt = """
                你是一位专业英语口语教练。请对用户的口语练习回答进行点评。

                ## 模式：%s
                ## 输入方式：%s

                ## 点评要求
                %s

                ## 输出格式
                必须返回严格的 JSON：
                {
                  "score": 85,
                  "strengths": ["优点1", "优点2"],
                  "improvements": ["改进建议1", "改进建议2"],
                  "corrections": [
                    { "original": "用户原句", "corrected": "更自然的表达", "explanationZh": "中文说明" }
                  ],
                  "improvedAnswer": "优化后的英文参考回答",
                  "encouragement": "鼓励性总结"
                }
                只返回 JSON，不要其他内容。
                """.formatted(
                beginner ? "初级" : "进阶",
                inputMode == null || inputMode.isBlank() ? "text" : inputMode,
                beginner ? "- 聚焦最关键的错误\n- 语气鼓励\n- 建议具体直接" : "- 关注地道性、逻辑性、简洁性\n- 提供高阶表达替换\n- 评估思维深度"
        );
        String userPrompt = "主题：%s（%s）\n任务：%s\n任务说明：%s\n\n用户回答：\n%s".formatted(titleEn, titleZh, taskTitle, taskDescription, userAnswer);
        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    // ===================== 跟读精听：单句跟读点评 =====================

    public String reviewShadowingSentence(Long modelId,
                                          String lessonTitle,
                                          String lessonTitleZh,
                                          Integer sentenceIndex,
                                          String referenceText,
                                          String referenceTextZh,
                                          String phonetic,
                                          String recognizedText,
                                          Long durationMs) {
        if (recognizedText == null || recognizedText.isBlank()) {
            throw new IllegalArgumentException("识别文本不能为空");
        }
        String systemPrompt = """
                你是一位英语跟读教练。请基于 ASR 识别文本和原句，对用户的单句跟读做学习辅助型点评。

                ## 评分要求
                - 分数范围必须是 0-100
                - accuracyScore 主要参考识别文本与原句的接近程度
                - fluencyScore 参考完整度、自然停顿和录音时长信息
                - pronunciationScore 参考关键词是否可识别、连读和清晰度
                - 评分应鼓励但真实，不包装成专业考试评分
                - 建议必须具体到可复读的词组或短句

                ## 输出格式
                必须返回严格 JSON，不要 Markdown，不要解释：
                {
                  "overallScore": 88,
                  "pronunciationScore": 86,
                  "fluencyScore": 84,
                  "accuracyScore": 94,
                  "strengths": ["中文优点1", "中文优点2"],
                  "improvements": ["中文改进建议1", "中文改进建议2"],
                  "suggestedPractice": ["需要复读的英文短语1", "需要复读的英文短语2"],
                  "encouragement": "一句中文鼓励"
                }
                """;
        String userPrompt = """
                资源标题：%s
                资源中文标题：%s
                句子序号：%s
                原句英文：%s
                原句中文：%s
                音标：%s
                ASR 识别文本：%s
                录音时长毫秒：%s
                """.formatted(
                lessonTitle,
                lessonTitleZh,
                sentenceIndex == null ? "" : sentenceIndex + 1,
                referenceText,
                referenceTextZh == null ? "" : referenceTextZh,
                phonetic == null ? "" : phonetic,
                recognizedText,
                durationMs == null ? "" : durationMs
        );
        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    public String reviewShadowingTranslation(Long modelId,
                                             String lessonTitle,
                                             String lessonTitleZh,
                                             String promptZh,
                                             String referenceText,
                                             String userAnswer,
                                             String inputMode) {
        if (userAnswer == null || userAnswer.isBlank()) {
            throw new IllegalArgumentException("翻译内容不能为空");
        }
        String systemPrompt = """
                你是一位英语翻译与口语表达教练。用户会根据中文提示自己翻译成英文，请对用户译文做学习型点评。

                ## 点评要求
                - 分数范围是 0-100，鼓励但真实
                - 先看意思是否完整，再看语法准确性、表达自然度和可口语输出程度
                - 如果提供了参考英文，不要求用户逐字一致，允许自然表达
                - 改进建议要具体，指出可以替换或补充的表达

                ## 输出格式
                必须返回严格 JSON，不要 Markdown，不要解释：
                {
                  "score": 85,
                  "strengths": ["中文优点1", "中文优点2"],
                  "improvements": ["中文改进建议1", "中文改进建议2"],
                  "corrections": [
                    { "original": "用户原句或片段", "corrected": "更自然的英文", "explanationZh": "中文说明" }
                  ],
                  "improvedAnswer": "优化后的英文参考翻译",
                  "encouragement": "一句中文鼓励"
                }
                """;
        String userPrompt = """
                资源标题：%s
                资源中文标题：%s
                输入方式：%s
                中文提示：%s
                参考英文：%s

                用户英文翻译：
                %s
                """.formatted(
                lessonTitle,
                lessonTitleZh,
                inputMode == null || inputMode.isBlank() ? "text" : inputMode,
                promptZh,
                referenceText == null ? "" : referenceText,
                userAnswer
        );
        return callAi(modelId, systemPrompt, userPrompt, null);
    }

    // ===================== 学习中心：生成热身内容 =====================

    public String generateWarmup(Long modelId, String titleEn, String titleZh, String mode, String exclude) {
        boolean beginner = "beginner".equals(mode);
        String excludeRule = (exclude != null && !exclude.isBlank())
                ? "\n\n## 去重规则（非常重要！）\n以下热身内容已经生成过，本次绝对不能再出现相同或高度相似的内容，必须生成全新的热身内容：\n【已有内容】" + exclude
                : "";
        String systemPrompt = """
                你是一位专业英语教育专家。根据给定的口语练习主题，生成热身内容帮助用户进入语境。

                ## 模式：%s

                ## 输出格式
                必须返回严格的 JSON：
                {
                  "introduction": "主题简介（英文）",
                  "warmupQuestions": [
                    { "en": "简单热身问题?", "zh": "中文翻译?" }
                  ]
                }
                生成 1 段 introduction 和恰好 3 个 warmupQuestions。%s%s
                只返回 JSON，不要其他内容。
                """.formatted(
                beginner ? "初级" : "进阶",
                beginner ? "简介和提示要简短，附中文辅助。" : "简介用自然英文，提示更深入。",
                excludeRule
        );
        return callAi(modelId, systemPrompt, "主题：%s（%s）".formatted(titleEn, titleZh), null);
    }

    public String generateStructuredReply(Long modelId, String systemPrompt, String userPrompt, List<Map<String, String>> history, Double temperature) {
        return callAi(modelId, systemPrompt, userPrompt, history, temperature);
    }

    private ResolvedAiConfig resolveAiConfig(Long modelId) {
        if (modelId != null) {
            AiModel aiModel = aiModelRepository.findById(modelId).orElse(null);
            if (aiModel == null) {
                throw new IllegalArgumentException("AI 数据源不存在: " + modelId);
            }
            return new ResolvedAiConfig(aiModel.getApiUrl(), aiModel.getApiKey(), aiModel.getModelName());
        }

        AiModel defaultModelConfig = aiModelRepository.findByIsDefaultTrue().orElse(null);
        if (defaultModelConfig != null) {
            return new ResolvedAiConfig(defaultModelConfig.getApiUrl(), defaultModelConfig.getApiKey(), defaultModelConfig.getModelName());
        }

        return new ResolvedAiConfig(defaultApiUrl, defaultApiKey, defaultModel);
    }

    // ===================== 统一 AI 调用方法 =====================

    private String callAi(Long modelId, String systemPrompt, String userPrompt, List<Map<String, String>> history) {
        return callAi(modelId, systemPrompt, userPrompt, history, null);
    }

    private String callAi(Long modelId, String systemPrompt, String userPrompt, List<Map<String, String>> history, Double temperature) {
        try {
            ResolvedAiConfig config = resolveAiConfig(modelId);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            if (history != null) {
                messages.addAll(history);
            }
            messages.add(Map.of("role", "user", "content", userPrompt));

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", config.modelName());
            body.put("messages", messages);
            if (temperature != null) {
                body.put("temperature", temperature);
            }
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.apiUrl()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + config.apiKey())
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
