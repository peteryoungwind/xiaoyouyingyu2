package com.xiaoyouyingyu.dto.shadowing;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ShadowingReviewResponse {
    private String recognizedText;
    private Integer overallScore;
    private Integer pronunciationScore;
    private Integer fluencyScore;
    private Integer accuracyScore;
    private List<String> strengths;
    private List<String> improvements;
    private List<String> suggestedPractice;
    private String encouragement;
}
