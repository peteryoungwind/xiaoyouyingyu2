package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "topic_submissions", indexes = {
        @Index(name = "idx_topic_submission_status_created_at", columnList = "status, created_at"),
        @Index(name = "idx_topic_submission_user_id", columnList = "user_id")
})
public class TopicSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 500)
    private String reason;

    @Column(length = 50)
    private String category;

    @Column(name = "extra_info", length = 500)
    private String extraInfo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TopicSubmissionStatus status = TopicSubmissionStatus.PENDING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = TopicSubmissionStatus.PENDING;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
