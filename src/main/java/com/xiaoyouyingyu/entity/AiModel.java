package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ai_models")
public class AiModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "模型显示名称不能为空")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "API地址不能为空")
    @Column(name = "api_url", nullable = false, length = 500)
    private String apiUrl;

    @NotBlank(message = "API Key不能为空")
    @Column(name = "api_key", nullable = false, length = 500)
    private String apiKey;

    @NotBlank(message = "模型名称不能为空")
    @Column(name = "model_name", nullable = false, length = 200)
    private String modelName;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
