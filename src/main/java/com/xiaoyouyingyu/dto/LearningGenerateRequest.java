package com.xiaoyouyingyu.dto;

import lombok.Data;

@Data
public class LearningGenerateRequest {
    private String titleEn;
    private String titleZh;
    private String mode;
    private String exclude;
    private String type;
}
