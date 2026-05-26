package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tts_models")
public class TtsModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "TTS 模型显示名称不能为空")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "TTS API 地址不能为空")
    @Column(name = "base_url", nullable = false, length = 500)
    private String baseUrl;

    @NotBlank(message = "TTS API Key 不能为空")
    @Column(name = "api_key", nullable = false, length = 500)
    private String apiKey;

    @NotBlank(message = "TTS 模型名称不能为空")
    @Column(name = "model_name", nullable = false, length = 200)
    private String modelName;

    @Column(length = 60)
    private String provider = "openai";

    @Column(name = "voice_us", nullable = false, length = 80)
    private String voiceUs = "alloy";

    @Column(name = "voice_uk", nullable = false, length = 80)
    private String voiceUk = "verse";

    @Column(name = "output_format", nullable = false, length = 20)
    private String outputFormat = "mp3";

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(nullable = false)
    private Boolean enabled = true;

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
