package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.topicsubmission.TopicSubmissionCreateRequest;
import com.xiaoyouyingyu.dto.topicsubmission.TopicSubmissionCreateResponse;
import com.xiaoyouyingyu.entity.TopicSubmission;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.TopicSubmissionRepository;
import com.xiaoyouyingyu.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/topic-submissions")
@RequiredArgsConstructor
public class TopicSubmissionController {
    private final TopicSubmissionRepository topicSubmissionRepository;
    private final UserRepository userRepository;

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public TopicSubmissionCreateResponse create(
            @Valid @RequestBody TopicSubmissionCreateRequest request,
            Authentication auth
    ) {
        User user = resolveUser(auth);
        TopicSubmission submission = new TopicSubmission();
        String title = clean(request.getTitle());
        if (title == null || title.length() < 2) {
            throw new IllegalArgumentException("话题标题需为2-100个字符");
        }
        submission.setUserId(user.getId());
        submission.setUsername(user.getUsername());
        submission.setTitle(title);
        submission.setReason(cleanOptional(request.getReason()));
        submission.setCategory(cleanOptional(request.getCategory()));
        submission.setExtraInfo(cleanOptional(request.getExtraInfo()));
        return TopicSubmissionCreateResponse.from(topicSubmissionRepository.save(submission));
    }

    private User resolveUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
        if (auth.getDetails() instanceof User user) {
            return user;
        }
        return userRepository.findByUsername(String.valueOf(auth.getPrincipal()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录"));
    }

    private static String clean(String value) {
        return value == null ? null : value.trim();
    }

    private static String cleanOptional(String value) {
        String cleaned = clean(value);
        return cleaned == null || cleaned.isEmpty() ? null : cleaned;
    }
}
