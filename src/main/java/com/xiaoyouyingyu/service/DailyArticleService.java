package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.dto.dailyarticle.*;
import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.DailyArticleParagraphRepository;
import com.xiaoyouyingyu.repository.DailyArticleReadRepository;
import com.xiaoyouyingyu.repository.DailyArticleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DailyArticleService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final DailyArticleRepository articleRepository;
    private final DailyArticleParagraphRepository paragraphRepository;
    private final DailyArticleReadRepository readRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public Page<DailyArticleListItemResponse> listForUser(Long userId, Boolean read, Pageable pageable) {
        return articleRepository.findPublishedByReadStatus(userId, read, pageable)
                .map(article -> toUserListItem(article, readRepository.existsByArticleIdAndUserId(article.getId(), userId)));
    }

    @Transactional
    public DailyArticleDetailResponse getUserDetail(Long id, User user) {
        DailyArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "外刊不存在"));
        if (article.getPublishedDate() == null && user.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "外刊不存在");
        }
        markRead(article.getId(), user.getId());
        return toDetail(article, true);
    }

    public Page<AdminDailyArticleListItemResponse> listForAdmin(DailyArticleStatus status, Boolean published, Pageable pageable) {
        return articleRepository.searchAdmin(status, published, pageable).map(this::toAdminListItem);
    }

    public DailyArticleDetailResponse getAdminDetail(Long id) {
        return toDetail(getRequired(id), false);
    }

    @Transactional
    public DailyArticleDetailResponse create(DailyArticleSaveRequest request) {
        DailyArticle article = new DailyArticle();
        apply(article, request);
        DailyArticle saved = articleRepository.save(article);
        replaceParagraphs(saved.getId(), request.getParagraphs());
        return toDetail(saved, false);
    }

    @Transactional
    public DailyArticleDetailResponse update(Long id, DailyArticleSaveRequest request) {
        DailyArticle article = getRequired(id);
        apply(article, request);
        DailyArticle saved = articleRepository.save(article);
        replaceParagraphs(saved.getId(), request.getParagraphs());
        return toDetail(saved, false);
    }

    @Transactional
    public AdminDailyArticleListItemResponse changeStatus(Long id, DailyArticleStatus status) {
        DailyArticle article = getRequired(id);
        article.setStatus(status);
        return toAdminListItem(articleRepository.save(article));
    }

    @Transactional
    public void delete(Long id) {
        DailyArticle article = getRequired(id);
        paragraphRepository.deleteByArticleId(article.getId());
        readRepository.deleteByArticleId(article.getId());
        articleRepository.delete(article);
    }

    @Transactional
    public synchronized DailyArticlePublishResponse publishToday() {
        LocalDate today = LocalDate.now();
        if (articleRepository.existsByPublishedDate(today)) {
            return DailyArticlePublishResponse.builder()
                    .message("今日外刊已存在")
                    .publishedDate(today)
                    .build();
        }
        List<DailyArticle> candidates = articleRepository.findByStatusAndPublishedDateIsNull(DailyArticleStatus.ENABLED);
        if (candidates.isEmpty()) {
            return DailyArticlePublishResponse.builder()
                    .message("没有可推送的外刊")
                    .publishedDate(today)
                    .build();
        }
        DailyArticle selected = candidates.get(RANDOM.nextInt(candidates.size()));
        selected.setPublishedDate(today);
        articleRepository.save(selected);
        return DailyArticlePublishResponse.builder()
                .message("今日外刊已生成")
                .articleId(selected.getId())
                .publishedDate(today)
                .build();
    }

    public DailyArticleAudioUploadResponse uploadAudio(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("请选择音频文件");
        }
        String contentType = file.getContentType();
        if (contentType != null && !contentType.startsWith("audio/")) {
            throw new IllegalArgumentException("仅支持音频文件");
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String suffix = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            suffix = original.substring(dot).replaceAll("[^A-Za-z0-9.]", "");
        }
        String filename = UUID.randomUUID() + (suffix.isBlank() ? ".mp3" : suffix);
        try {
            Path dir = Path.of(uploadDir, "daily-articles");
            Files.createDirectories(dir);
            Path target = dir.resolve(filename);
            file.transferTo(target);
            return new DailyArticleAudioUploadResponse("/uploads/daily-articles/" + filename);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "音频上传失败");
        }
    }

    private DailyArticle getRequired(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "外刊不存在"));
    }

    private void apply(DailyArticle article, DailyArticleSaveRequest request) {
        article.setTitle(request.getTitle());
        article.setTitleZh(blankToNull(request.getTitleZh()));
        article.setAudioUrl(blankToNull(request.getAudioUrl()));
        article.setSummary(blankToNull(request.getSummary()));
        article.setVocabulary(blankToNull(request.getVocabulary()));
        article.setExpressions(blankToNull(request.getExpressions()));
        article.setStatus(request.getStatus() == null ? DailyArticleStatus.DRAFT : request.getStatus());
    }

    private void replaceParagraphs(Long articleId, List<DailyArticleParagraphRequest> requests) {
        paragraphRepository.deleteByArticleId(articleId);
        if (requests == null || requests.isEmpty()) {
            return;
        }
        int index = 1;
        for (DailyArticleParagraphRequest request : requests) {
            if (isBlank(request.getContentEn()) && isBlank(request.getContentZh())) {
                continue;
            }
            DailyArticleParagraph paragraph = new DailyArticleParagraph();
            paragraph.setArticleId(articleId);
            paragraph.setSortOrder(request.getSortOrder() == null ? index : request.getSortOrder());
            paragraph.setContentEn(blankToNull(request.getContentEn()));
            paragraph.setContentZh(blankToNull(request.getContentZh()));
            paragraphRepository.save(paragraph);
            index++;
        }
    }

    private void markRead(Long articleId, Long userId) {
        if (!readRepository.existsByArticleIdAndUserId(articleId, userId)) {
            DailyArticleRead read = new DailyArticleRead();
            read.setArticleId(articleId);
            read.setUserId(userId);
            read.setReadAt(LocalDateTime.now());
            readRepository.save(read);
        }
    }

    private DailyArticleListItemResponse toUserListItem(DailyArticle article, boolean read) {
        return DailyArticleListItemResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .titleZh(article.getTitleZh())
                .publishedDate(article.getPublishedDate())
                .read(read)
                .build();
    }

    private AdminDailyArticleListItemResponse toAdminListItem(DailyArticle article) {
        return AdminDailyArticleListItemResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .titleZh(article.getTitleZh())
                .audioUrl(article.getAudioUrl())
                .status(article.getStatus())
                .publishedDate(article.getPublishedDate())
                .published(article.getPublishedDate() != null)
                .paragraphCount((int) paragraphRepository.countByArticleId(article.getId()))
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }

    private DailyArticleDetailResponse toDetail(DailyArticle article, boolean read) {
        return DailyArticleDetailResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .titleZh(article.getTitleZh())
                .audioUrl(article.getAudioUrl())
                .summary(article.getSummary())
                .vocabulary(article.getVocabulary())
                .expressions(article.getExpressions())
                .difficultyStars(normalizeDifficultyStars(article.getDifficultyStars()))
                .wordCount(normalizeWordCount(article.getWordCount()))
                .sourceName(blankToNull(article.getSourceName()))
                .keySentences(blankToNull(article.getKeySentences()))
                .publishedDate(article.getPublishedDate())
                .read(read)
                .paragraphs(paragraphRepository.findByArticleIdOrderBySortOrderAscIdAsc(article.getId()).stream()
                        .map(this::toParagraphResponse)
                        .toList())
                .build();
    }

    private DailyArticleParagraphResponse toParagraphResponse(DailyArticleParagraph paragraph) {
        return DailyArticleParagraphResponse.builder()
                .id(paragraph.getId())
                .sortOrder(paragraph.getSortOrder())
                .contentEn(paragraph.getContentEn())
                .contentZh(paragraph.getContentZh())
                .build();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private Integer normalizeDifficultyStars(Integer value) {
        if (value == null) {
            return null;
        }
        return Math.max(1, Math.min(5, value));
    }

    private Integer normalizeWordCount(Integer value) {
        if (value == null || value <= 0) {
            return null;
        }
        return value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
