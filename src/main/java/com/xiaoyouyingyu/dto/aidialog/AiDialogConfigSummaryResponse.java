package com.xiaoyouyingyu.dto.aidialog;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiDialogConfigSummaryResponse {
    private Boolean enabled;
    private Integer maxRoundsPerSession;
    private Integer dailyMessageLimit;
    private Integer remainingToday;
}
