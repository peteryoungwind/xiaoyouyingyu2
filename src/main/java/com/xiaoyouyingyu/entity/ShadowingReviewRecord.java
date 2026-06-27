package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "shadowing_review_records", indexes = {
        @Index(name = "idx_shadowing_review_user_lesson", columnList = "user_id,lesson_id"),
        @Index(name = "idx_shadowing_review_sentence", columnList = "lesson_id,sentence_index")
})
public class ShadowingReviewRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "sentence_index", nullable = false)
    private Integer sentenceIndex;

    @Lob
    @Column(name = "reference_text", columnDefinition = "TEXT")
    private String referenceText;

    @Lob
    @Column(name = "recognized_text", columnDefinition = "TEXT")
    private String recognizedText;

    @Column(name = "overall_score")
    private Integer overallScore;

    @Column(name = "pronunciation_score")
    private Integer pronunciationScore;

    @Column(name = "fluency_score")
    private Integer fluencyScore;

    @Column(name = "accuracy_score")
    private Integer accuracyScore;

    @Lob
    @Column(name = "feedback_json", columnDefinition = "LONGTEXT")
    private String feedbackJson;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
