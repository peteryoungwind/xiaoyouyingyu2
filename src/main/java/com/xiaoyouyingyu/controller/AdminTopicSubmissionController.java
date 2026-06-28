package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.topicsubmission.TopicSubmissionDetailResponse;
import com.xiaoyouyingyu.dto.topicsubmission.TopicSubmissionListItemResponse;
import com.xiaoyouyingyu.dto.topicsubmission.TopicSubmissionStatusUpdateRequest;
import com.xiaoyouyingyu.entity.TopicSubmission;
import com.xiaoyouyingyu.entity.TopicSubmissionStatus;
import com.xiaoyouyingyu.repository.TopicSubmissionRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin/topic-submissions")
@RequiredArgsConstructor
public class AdminTopicSubmissionController {
    private final TopicSubmissionRepository topicSubmissionRepository;

    @GetMapping
    public Page<TopicSubmissionListItemResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) TopicSubmissionStatus status,
            @RequestParam(required = false) String keyword
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return topicSubmissionRepository.search(status, cleanOptional(keyword), PageRequest.of(safePage, safeSize))
                .map(TopicSubmissionListItemResponse::from);
    }

    @GetMapping("/{id}")
    public TopicSubmissionDetailResponse detail(@PathVariable Long id) {
        return topicSubmissionRepository.findById(id)
                .map(TopicSubmissionDetailResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "提交记录不存在"));
    }

    @PutMapping("/{id}/status")
    public TopicSubmissionDetailResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody TopicSubmissionStatusUpdateRequest request
    ) {
        if (request.getStatus() == TopicSubmissionStatus.PENDING) {
            throw new IllegalArgumentException("无效的状态");
        }
        TopicSubmission submission = topicSubmissionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "提交记录不存在"));
        submission.setStatus(request.getStatus());
        return TopicSubmissionDetailResponse.from(topicSubmissionRepository.save(submission));
    }

    private static String cleanOptional(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }
}
