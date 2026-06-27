package com.xiaoyouyingyu.dto.shadowing;

import lombok.Data;

@Data
public class ShadowingTranslationReviewRequest {
    private String promptZh;
    private String referenceText;
    private String userAnswer;
    private String inputMode;
}
