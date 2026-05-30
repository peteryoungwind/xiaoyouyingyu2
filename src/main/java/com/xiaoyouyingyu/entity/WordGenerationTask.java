package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "word_generation_tasks",
        indexes = {
                @Index(name = "idx_word_generation_tasks_created", columnList = "created_at"),
                @Index(name = "idx_word_generation_tasks_book", columnList = "word_book_id")
        }
)
public class WordGenerationTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_book_id", nullable = false)
    private WordBook wordBook;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WordGenerationTaskType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WordGenerationTaskStatus status = WordGenerationTaskStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WordGenerationTaskStage stage = WordGenerationTaskStage.PENDING;

    @Column(length = 200)
    private String message = "任务已创建";

    @Column(nullable = false)
    private Integer progress = 0;

    @Column(name = "total_words", nullable = false)
    private Integer totalWords = 0;

    @Column(name = "saved_words", nullable = false)
    private Integer savedWords = 0;

    @Column(name = "skipped_words", nullable = false)
    private Integer skippedWords = 0;

    @Column(name = "audio_total", nullable = false)
    private Integer audioTotal = 0;

    @Column(name = "audio_done", nullable = false)
    private Integer audioDone = 0;

    @Column(name = "error", length = 1000)
    private String error;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        updatedAt = LocalDateTime.now();
    }
}
