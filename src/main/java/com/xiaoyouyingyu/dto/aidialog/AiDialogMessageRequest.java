package com.xiaoyouyingyu.dto.aidialog;

import com.xiaoyouyingyu.entity.AiDialogDifficulty;
import com.xiaoyouyingyu.entity.AiDialogMode;
import com.xiaoyouyingyu.entity.AiDialogTopicSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class AiDialogMessageRequest {
    private String sessionId;

    @NotNull(message = "主题来源不能为空")
    private AiDialogTopicSource topicSource;

    private Long topicId;
    private String customTopic;

    @NotNull(message = "对话模式不能为空")
    private AiDialogMode mode;

    @NotNull(message = "难度不能为空")
    private AiDialogDifficulty difficulty;

    private Integer roundCount = 0;

    @NotBlank(message = "消息不能为空")
    private String message;

    private List<AiDialogHistoryMessage> history = new ArrayList<>();
}
