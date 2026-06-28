package com.xiaoyouyingyu.dto.topicsubmission;

import com.xiaoyouyingyu.entity.TopicSubmission;
import com.xiaoyouyingyu.entity.TopicSubmissionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TopicSubmissionCreateResponse {
    private Long id;
    private String title;
    private TopicSubmissionStatus status;
    private LocalDateTime createdAt;

    public static TopicSubmissionCreateResponse from(TopicSubmission submission) {
        return TopicSubmissionCreateResponse.builder()
                .id(submission.getId())
                .title(submission.getTitle())
                .status(submission.getStatus())
                .createdAt(submission.getCreatedAt())
                .build();
    }
}
