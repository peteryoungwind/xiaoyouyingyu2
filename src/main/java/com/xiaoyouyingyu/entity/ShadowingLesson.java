package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "shadowing_lessons", indexes = {
        @Index(name = "idx_shadowing_lessons_status_date", columnList = "status,published_date"),
        @Index(name = "idx_shadowing_lessons_source_url", columnList = "source_url"),
        @Index(name = "idx_shadowing_lessons_episode_no", columnList = "episode_no")
})
public class ShadowingLesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "英文标题不能为空")
    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "title_zh", length = 255)
    private String titleZh;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "episode_no", length = 50)
    private String episodeNo;

    @Column(length = 100)
    private String category;

    @Column(length = 100)
    private String topic;

    @Column(name = "source_name", length = 100)
    private String sourceName;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;

    @Column(name = "video_url", length = 1000)
    private String videoUrl;

    @Column(name = "audio_url", length = 1000)
    private String audioUrl;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "sentence_count")
    private Integer sentenceCount = 0;

    @Column(name = "expression_count")
    private Integer expressionCount = 0;

    @Lob
    @Column(name = "content_json", columnDefinition = "LONGTEXT")
    private String contentJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ShadowingLessonStatus status = ShadowingLessonStatus.DRAFT;

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
