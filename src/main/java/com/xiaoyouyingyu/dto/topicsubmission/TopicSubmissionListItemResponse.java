package com.xiaoyouyingyu.dto.topicsubmission;

import com.xiaoyouyingyu.entity.TopicSubmission;
import com.xiaoyouyingyu.entity.TopicSubmissionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TopicSubmissionListItemResponse {
    private Long id;
    private String title;
    private String username;
    private String category;
    private TopicSubmissionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TopicSubmissionListItemResponse from(TopicSubmission submission) {
        return TopicSubmissionListItemResponse.builder()
                .id(submission.getId())
                .title(submission.getTitle())
                .username(submission.getUsername())
                .category(submission.getCategory())
                .status(submission.getStatus())
                .createdAt(submission.getCreatedAt())
                .updatedAt(submission.getUpdatedAt())
                .build();
    }
}
