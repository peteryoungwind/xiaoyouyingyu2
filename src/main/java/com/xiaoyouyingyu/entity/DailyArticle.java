package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "daily_articles", indexes = {
        @Index(name = "idx_daily_articles_published_date", columnList = "published_date"),
        @Index(name = "idx_daily_articles_status_published", columnList = "status,published_date")
})
public class DailyArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "英文标题不能为空")
    @Column(nullable = false, length = 300)
    private String title;

    @Column(name = "title_zh", length = 300)
    private String titleZh;

    @Column(name = "audio_url", length = 1000)
    private String audioUrl;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "json")
    private String vocabulary;

    @Column(columnDefinition = "json")
    private String expressions;

    @Column(name = "difficulty_stars")
    private Integer difficultyStars;

    @Column(name = "word_count")
    private Integer wordCount;

    @Column(name = "source_name", length = 200)
    private String sourceName;

    @Column(name = "key_sentences", columnDefinition = "json")
    private String keySentences;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DailyArticleStatus status = DailyArticleStatus.DRAFT;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        updatedAt = LocalDateTime.now();
    }
}
