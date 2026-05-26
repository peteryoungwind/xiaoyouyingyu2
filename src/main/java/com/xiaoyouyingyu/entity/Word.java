package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "words",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_words_book_normalized", columnNames = {"word_book_id", "normalized_word"})
        },
        indexes = {
                @Index(name = "idx_words_book_difficulty_status", columnList = "word_book_id,difficulty,status"),
                @Index(name = "idx_words_source_topic", columnList = "source_topic_id")
        }
)
public class Word {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_book_id", nullable = false)
    private WordBook wordBook;

    @NotBlank(message = "英文单词不能为空")
    @Column(nullable = false, length = 120)
    private String word;

    @Column(name = "normalized_word", nullable = false, length = 120)
    private String normalizedWord;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WordDifficulty difficulty = WordDifficulty.BEGINNER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WordStatus status = WordStatus.DRAFT;

    @Column(name = "phonetic", length = 120)
    private String phonetic;

    @Column(name = "part_of_speech")
    private String partOfSpeech;

    @Column(name = "definition_zh", nullable = false, length = 1000)
    private String definitionZh;

    @Column(name = "definition_en", nullable = false, length = 1000)
    private String definitionEn;

    @Column(name = "common_patterns", length = 1200)
    private String commonPatterns;

    @Column(name = "example_en", length = 1200)
    private String exampleEn;

    @Column(name = "example_zh", length = 1200)
    private String exampleZh;

    @Column(name = "source_scene", length = 500)
    private String sourceScene;

    @Column(name = "source_topic_id")
    private Long sourceTopicId;

    @Column(name = "source_topic_title", length = 300)
    private String sourceTopicTitle;

    @Column(name = "audio_us_url", length = 500)
    private String audioUsUrl;

    @Column(name = "audio_uk_url", length = 500)
    private String audioUkUrl;

    @Column(name = "example_audio_us_url", length = 500)
    private String exampleAudioUsUrl;

    @Column(name = "example_audio_uk_url", length = 500)
    private String exampleAudioUkUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "audio_status", nullable = false, length = 20)
    private WordAudioStatus audioStatus = WordAudioStatus.PENDING;

    @Column(name = "audio_error", length = 1000)
    private String audioError;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        normalizedWord = normalize(word);
        updatedAt = LocalDateTime.now();
    }

    public static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
