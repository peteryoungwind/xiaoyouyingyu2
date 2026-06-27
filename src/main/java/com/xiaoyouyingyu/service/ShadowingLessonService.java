package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.xiaoyouyingyu.dto.shadowing.ShadowingLessonDetailResponse;
import com.xiaoyouyingyu.dto.shadowing.ShadowingLessonListItemResponse;
import com.xiaoyouyingyu.dto.shadowing.ShadowingReviewResponse;
import com.xiaoyouyingyu.dto.shadowing.ShadowingTranslationReviewRequest;
import com.xiaoyouyingyu.entity.ShadowingLesson;
import com.xiaoyouyingyu.entity.ShadowingLessonStatus;
import com.xiaoyouyingyu.entity.ShadowingReviewRecord;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.entity.UserShadowingLessonRecord;
import com.xiaoyouyingyu.repository.ShadowingLessonRepository;
import com.xiaoyouyingyu.repository.ShadowingReviewRecordRepository;
import com.xiaoyouyingyu.repository.UserShadowingLessonRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ShadowingLessonService {
    private static final Pattern EPISODE_TITLE_MARKER = Pattern.compile("(?i)\\bEpisode\\s*\\d+\\b");
    private static final String LINGOHOW_SOURCE_MARKER = "Lingohow";
    private static final String GENERIC_SHADOWING_CATEGORY = "300期油管地道口语";

    private final ShadowingLessonRepository lessonRepository;
    private final UserShadowingLessonRecordRepository recordRepository;
    private final ShadowingReviewRecordRepository reviewRecordRepository;
    private final SpeechToTextService speechToTextService;
    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public Page<ShadowingLessonListItemResponse> list(User user, Boolean learned, Pageable pageable) {
        if (user == null && Boolean.TRUE.equals(learned)) {
            return new PageImpl<>(List.of(), pageable, 0);
        }
        Long userId = user == null ? null : user.getId();
        Boolean effectiveLearned = user == null ? null : learned;
        return lessonRepository.findPublishedForUser(userId, effectiveLearned, pageable)
                .map(lesson -> toListItem(lesson, userId));
    }

    @Transactional
    public ShadowingLessonDetailResponse detail(Long id, User user) {
        ShadowingLesson lesson = lessonRepository.findByIdAndStatus(id, ShadowingLessonStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "跟读精听内容不存在"));
        if (user == null) {
            return toDetail(lesson, true, false);
        }
        markLearned(user.getId(), lesson.getId());
        return toDetail(lesson, false, true);
    }

    @Transactional
    public ShadowingReviewResponse reviewSentence(Long id, int sentenceIndex, String referenceText, Long durationMs, MultipartFile audioFile, User user) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先完成录音");
        }
        ShadowingLesson lesson = lessonRepository.findByIdAndStatus(id, ShadowingLessonStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "跟读精听内容不存在"));
        JsonNode sentence = findSentence(lesson, sentenceIndex);
        String referenceEn = text(sentence, "en");
        if (referenceEn.isBlank()) {
            referenceEn = referenceText == null ? "" : referenceText.trim();
        }
        if (referenceEn.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "句子原文缺失，无法点评");
        }

        String recognizedText = speechToTextService.transcribe(audioFile);
        String aiJson = aiService.reviewShadowingSentence(null,
                lesson.getTitle(),
                lesson.getTitleZh(),
                sentenceIndex,
                referenceEn,
                text(sentence, "zh"),
                text(sentence, "phonetic"),
                recognizedText,
                durationMs);
        ShadowingReviewResponse response = parseReviewResponse(recognizedText, aiJson);
        saveReview(user.getId(), lesson.getId(), sentenceIndex, referenceEn, recognizedText, response, aiJson);
        return response;
    }

    public String reviewTranslation(Long id, ShadowingTranslationReviewRequest request, User user) {
        ShadowingLesson lesson = lessonRepository.findByIdAndStatus(id, ShadowingLessonStatus.PUBLISHED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "跟读精听内容不存在"));
        String promptZh = request == null ? "" : safe(request.getPromptZh());
        String referenceText = request == null ? "" : safe(request.getReferenceText());
        String userAnswer = request == null ? "" : safe(request.getUserAnswer());
        String inputMode = request == null ? "" : safe(request.getInputMode());
        if (promptZh.isBlank()) {
            JsonNode content = parseContent(lesson.getContentJson());
            promptZh = text(content.path("cloze"), "zhPromptText");
            if (promptZh.isBlank()) {
                promptZh = text(content.path("cloze"), "promptText");
            }
        }
        if (referenceText.isBlank()) {
            JsonNode content = parseContent(lesson.getContentJson());
            referenceText = text(content.path("cloze"), "enFullText");
        }
        if (promptZh.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "中文翻译题目缺失，无法点评");
        }
        if (userAnswer.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请先输入或识别你的英文翻译");
        }
        return aiService.reviewShadowingTranslation(null,
                lesson.getTitle(),
                lesson.getTitleZh(),
                promptZh,
                referenceText,
                userAnswer,
                inputMode);
    }

    private void markLearned(Long userId, Long lessonId) {
        UserShadowingLessonRecord record = recordRepository.findByUserIdAndLessonId(userId, lessonId)
                .orElseGet(() -> {
                    UserShadowingLessonRecord created = new UserShadowingLessonRecord();
                    created.setUserId(userId);
                    created.setLessonId(lessonId);
                    created.setFirstOpenedAt(LocalDateTime.now());
                    return created;
                });
        record.setLastOpenedAt(LocalDateTime.now());
        recordRepository.save(record);
    }

    private ShadowingLessonListItemResponse toListItem(ShadowingLesson lesson, Long userId) {
        return ShadowingLessonListItemResponse.builder()
                .id(lesson.getId())
                .title(displayTitle(lesson.getTitle()))
                .titleZh(displayTitle(lesson.getTitleZh()))
                .description(lesson.getDescription())
                .episodeNo(lesson.getEpisodeNo())
                .category(displayCategory(lesson.getCategory()))
                .topic(lesson.getTopic())
                .sourceName(displaySourceName(lesson.getSourceName()))
                .thumbnailUrl(lesson.getThumbnailUrl())
                .publishedDate(lesson.getPublishedDate())
                .sentenceCount(defaultNumber(lesson.getSentenceCount()))
                .expressionCount(defaultNumber(lesson.getExpressionCount()))
                .learned(userId != null && recordRepository.existsByUserIdAndLessonId(userId, lesson.getId()))
                .build();
    }

    private ShadowingLessonDetailResponse toDetail(ShadowingLesson lesson, boolean previewOnly, boolean learned) {
        return ShadowingLessonDetailResponse.builder()
                .id(lesson.getId())
                .title(displayTitle(lesson.getTitle()))
                .titleZh(displayTitle(lesson.getTitleZh()))
                .description(lesson.getDescription())
                .episodeNo(lesson.getEpisodeNo())
                .category(displayCategory(lesson.getCategory()))
                .topic(lesson.getTopic())
                .sourceName(displaySourceName(lesson.getSourceName()))
                .sourceUrl(lesson.getSourceUrl())
                .thumbnailUrl(lesson.getThumbnailUrl())
                .videoUrl(lesson.getVideoUrl())
                .audioUrl(lesson.getAudioUrl())
                .publishedDate(lesson.getPublishedDate())
                .sentenceCount(defaultNumber(lesson.getSentenceCount()))
                .expressionCount(defaultNumber(lesson.getExpressionCount()))
                .previewOnly(previewOnly)
                .learned(learned)
                .content(previewOnly ? null : parseContent(lesson.getContentJson()))
                .build();
    }

    private JsonNode parseContent(String contentJson) {
        if (contentJson == null || contentJson.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(contentJson);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "跟读精听内容格式异常");
        }
    }

    private JsonNode findSentence(ShadowingLesson lesson, int sentenceIndex) {
        if (sentenceIndex < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "句子不存在");
        }
        JsonNode content = parseContent(lesson.getContentJson());
        JsonNode sentences = content.path("sentences");
        if (!sentences.isArray() || sentenceIndex >= sentences.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "句子不存在");
        }
        JsonNode sentence = sentences.get(sentenceIndex);
        if (sentence == null || sentence.isMissingNode() || sentence.isNull()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "句子不存在");
        }
        return sentence;
    }

    private ShadowingReviewResponse parseReviewResponse(String recognizedText, String aiJson) {
        try {
            JsonNode root = objectMapper.readTree(stripCodeFence(aiJson));
            if (root.has("error")) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, root.path("error").asText("点评暂时不可用，请稍后重试"));
            }
            return ShadowingReviewResponse.builder()
                    .recognizedText(recognizedText)
                    .overallScore(score(root, "overallScore", 75))
                    .pronunciationScore(score(root, "pronunciationScore", 75))
                    .fluencyScore(score(root, "fluencyScore", 75))
                    .accuracyScore(score(root, "accuracyScore", 75))
                    .strengths(strings(root.path("strengths")))
                    .improvements(strings(root.path("improvements")))
                    .suggestedPractice(strings(root.path("suggestedPractice")))
                    .encouragement(root.path("encouragement").asText("继续练这一句，下一遍会更顺。"))
                    .build();
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            return ShadowingReviewResponse.builder()
                    .recognizedText(recognizedText)
                    .overallScore(70)
                    .pronunciationScore(70)
                    .fluencyScore(70)
                    .accuracyScore(70)
                    .strengths(List.of("已经完成本句跟读，并获得了可识别文本。"))
                    .improvements(List.of("AI 点评格式暂时异常，请先对照识别文本和原句复读。"))
                    .suggestedPractice(List.of(recognizedText))
                    .encouragement("这次结果已记录，可以再读一次刷新点评。")
                    .build();
        }
    }

    private void saveReview(Long userId, Long lessonId, int sentenceIndex, String referenceText, String recognizedText, ShadowingReviewResponse response, String rawAiJson) {
        ShadowingReviewRecord record = new ShadowingReviewRecord();
        record.setUserId(userId);
        record.setLessonId(lessonId);
        record.setSentenceIndex(sentenceIndex);
        record.setReferenceText(referenceText);
        record.setRecognizedText(recognizedText);
        record.setOverallScore(response.getOverallScore());
        record.setPronunciationScore(response.getPronunciationScore());
        record.setFluencyScore(response.getFluencyScore());
        record.setAccuracyScore(response.getAccuracyScore());
        record.setFeedbackJson(rawAiJson);
        reviewRecordRepository.save(record);
    }

    private static int defaultNumber(Integer value) {
        return value == null ? 0 : value;
    }

    private static String text(JsonNode node, String field) {
        String value = node.path(field).asText("");
        return value == null ? "" : value.trim();
    }

    private static String safe(String value) {
        return value == null ? "" : value.trim();
    }

    private static String displayTitle(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = EPISODE_TITLE_MARKER.matcher(value).replaceAll("");
        cleaned = cleaned.replaceAll("\\s{2,}", " ").trim();
        cleaned = cleaned.replaceAll("^[\\s·,，:：\\-—–|]+", "");
        cleaned = cleaned.replaceAll("[\\s·,，:：\\-—–|]+$", "").trim();
        return cleaned;
    }

    private static String displaySourceName(String value) {
        String sourceName = safe(value);
        if (isGenericSourceMarker(sourceName)) {
            return null;
        }
        return sourceName.isBlank() ? null : sourceName;
    }

    private static String displayCategory(String value) {
        String category = safe(value);
        if (isGenericSourceMarker(category)) {
            return null;
        }
        return category.isBlank() ? null : category;
    }

    private static boolean isGenericSourceMarker(String value) {
        String marker = safe(value);
        if (LINGOHOW_SOURCE_MARKER.equalsIgnoreCase(marker)) {
            return true;
        }
        return GENERIC_SHADOWING_CATEGORY.equals(marker.replaceAll("\\s+", ""));
    }

    private static int score(JsonNode root, String field, int fallback) {
        int value = root.path(field).asInt(fallback);
        return Math.max(0, Math.min(100, value));
    }

    private static List<String> strings(JsonNode node) {
        if (!node.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        ArrayNode array = (ArrayNode) node;
        array.forEach(item -> {
            String value = item.asText("");
            if (!value.isBlank()) {
                values.add(value);
            }
        });
        return values;
    }

    private static String stripCodeFence(String value) {
        if (value == null) {
            return "{}";
        }
        String text = value.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```[a-zA-Z]*\\s*", "");
            text = text.replaceFirst("\\s*```$", "");
        }
        return text.trim();
    }
}
