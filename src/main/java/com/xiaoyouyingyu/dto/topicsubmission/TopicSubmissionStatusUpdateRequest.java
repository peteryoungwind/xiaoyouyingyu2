package com.xiaoyouyingyu.dto.topicsubmission;

import com.xiaoyouyingyu.entity.TopicSubmissionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TopicSubmissionStatusUpdateRequest {
    @NotNull(message = "状态不能为空")
    private TopicSubmissionStatus status;
}
