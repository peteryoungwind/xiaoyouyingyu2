package com.xiaoyouyingyu.dto.aidialog;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiDialogMessageResponse {
    private Integer remainingToday;
    private AiDialogReply reply;
    private String audioUrl;
}
