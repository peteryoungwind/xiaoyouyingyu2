package com.xiaoyouyingyu.dto.aidialog;

import lombok.Data;

@Data
public class AdminAiDialogConfigRequest {
    private Boolean enabled;
    private Long aiModelId;
    private Long asrModelId;
    private Long ttsModelId;
    private String ttsVoice;
    private String speechProvider;
    private String ttsProvider;
    private Double temperature;
    private Integer maxRoundsPerSession;
    private Integer dailyMessageLimit;
    private String teachingBeginnerPrompt;
    private String teachingAdvancedPrompt;
    private String practiceBeginnerPrompt;
    private String practiceAdvancedPrompt;
}
