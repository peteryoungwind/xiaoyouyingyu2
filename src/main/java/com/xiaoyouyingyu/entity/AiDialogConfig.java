package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ai_dialog_config")
public class AiDialogConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "ai_model_id")
    private Long aiModelId;

    @Column(name = "asr_model_id")
    private Long asrModelId;

    @Column(name = "tts_model_id")
    private Long ttsModelId;

    @Column(name = "tts_voice", length = 100)
    private String ttsVoice;

    @Column(name = "speech_provider", length = 50)
    private String speechProvider;

    @Column(name = "tts_provider", length = 50)
    private String ttsProvider;

    @Column(nullable = false)
    private Double temperature = 0.7;

    @Column(name = "max_rounds_per_session", nullable = false)
    private Integer maxRoundsPerSession = 12;

    @Column(name = "daily_message_limit", nullable = false)
    private Integer dailyMessageLimit = 30;

    @Lob
    @Column(name = "teaching_beginner_prompt", nullable = false, columnDefinition = "TEXT")
    private String teachingBeginnerPrompt;

    @Lob
    @Column(name = "teaching_advanced_prompt", nullable = false, columnDefinition = "TEXT")
    private String teachingAdvancedPrompt;

    @Lob
    @Column(name = "practice_beginner_prompt", nullable = false, columnDefinition = "TEXT")
    private String practiceBeginnerPrompt;

    @Lob
    @Column(name = "practice_advanced_prompt", nullable = false, columnDefinition = "TEXT")
    private String practiceAdvancedPrompt;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    public void touch() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
}
