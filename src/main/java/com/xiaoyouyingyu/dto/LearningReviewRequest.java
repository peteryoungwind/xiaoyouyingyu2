package com.xiaoyouyingyu.dto;

import lombok.Data;

@Data
public class LearningReviewRequest {
    private String titleEn;
    private String titleZh;
    private String mode;
    private String taskTitle;
    private String taskDescription;
    private String answer;
    private String inputMode;
}
