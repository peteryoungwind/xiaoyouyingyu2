package com.xiaoyouyingyu.dto.topicsubmission;

import com.xiaoyouyingyu.entity.TopicSubmission;
import com.xiaoyouyingyu.entity.TopicSubmissionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TopicSubmissionDetailResponse {
    private Long id;
    private String title;
    private String username;
    private String category;
    private String reason;
    private String extraInfo;
    private TopicSubmissionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TopicSubmissionDetailResponse from(TopicSubmission submission) {
        return TopicSubmissionDetailResponse.builder()
                .id(submission.getId())
                .title(submission.getTitle())
                .username(submission.getUsername())
                .category(submission.getCategory())
                .reason(submission.getReason())
                .extraInfo(submission.getExtraInfo())
                .status(submission.getStatus())
                .createdAt(submission.getCreatedAt())
                .updatedAt(submission.getUpdatedAt())
                .build();
    }
}
