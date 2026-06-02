package com.xiaoyouyingyu.dto.aidialog;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AdminAiDialogConfigResponse {
    private Long id;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
