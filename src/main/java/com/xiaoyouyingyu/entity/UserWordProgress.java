package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "user_word_progress",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_word_progress", columnNames = {"user_id", "word_id"})
        },
        indexes = {
                @Index(name = "idx_user_word_book_status", columnList = "user_id,word_book_id,status"),
                @Index(name = "idx_user_word_next_review", columnList = "user_id,next_review_at")
        }
)
public class UserWordProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_book_id", nullable = false)
    private WordBook wordBook;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WordDifficulty difficulty = WordDifficulty.BEGINNER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserWordStatus status = UserWordStatus.NEW;

    @Column(name = "study_count", nullable = false)
    private int studyCount = 0;

    @Column(name = "known_count", nullable = false)
    private int knownCount = 0;

    @Column(name = "unknown_count", nullable = false)
    private int unknownCount = 0;

    @Column(name = "fuzzy_count", nullable = false)
    private int fuzzyCount = 0;

    @Column(name = "consecutive_known_count", nullable = false)
    private int consecutiveKnownCount = 0;

    @Column(name = "first_studied_at")
    private LocalDateTime firstStudiedAt;

    @Column(name = "last_practiced_at")
    private LocalDateTime lastPracticedAt;

    @Column(name = "next_review_at")
    private LocalDateTime nextReviewAt;

    @Column(name = "mastered_at")
    private LocalDateTime masteredAt;

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
