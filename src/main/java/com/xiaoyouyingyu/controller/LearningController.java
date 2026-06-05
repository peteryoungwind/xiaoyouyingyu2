package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.repository.TopicRepository;
import com.xiaoyouyingyu.service.AiService;
import com.xiaoyouyingyu.dto.LearningGenerateRequest;
import com.xiaoyouyingyu.dto.LearningReviewRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {
    private final AiService aiService;
    private final TopicRepository topicRepository;

    @GetMapping("/topic/{id}")
    public ResponseEntity<?> getTopicForLearning(@PathVariable Long id) {
        return topicRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/warmup")
    public ResponseEntity<?> generateWarmup(@RequestBody LearningGenerateRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateWarmup(null, body.getTitleEn(), body.getTitleZh(), body.getMode(), body.getExclude())));
    }

    @PostMapping("/vocabulary")
    public ResponseEntity<?> generateVocabulary(@RequestBody LearningGenerateRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateVocabulary(null, body.getTitleEn(), body.getTitleZh(), body.getMode(), body.getExclude())));
    }

    @PostMapping("/expressions")
    public ResponseEntity<?> generateExpressions(@RequestBody LearningGenerateRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateExpressions(null, body.getTitleEn(), body.getTitleZh(), body.getMode(), body.getExclude())));
    }

    @PostMapping("/sentence-patterns")
    public ResponseEntity<?> generateSentencePatterns(@RequestBody LearningGenerateRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateSentencePatterns(null, body.getTitleEn(), body.getTitleZh(), body.getMode(), body.getExclude())));
    }

    @PostMapping("/idiomatic-expressions")
    public ResponseEntity<?> generateIdiomaticExpressions(@RequestBody LearningGenerateRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateIdiomaticExpressions(null, body.getTitleEn(), body.getTitleZh(), body.getMode(), body.getExclude())));
    }

    @PostMapping("/tasks")
    public ResponseEntity<?> generateTasks(@RequestBody LearningGenerateRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateTasks(null, body.getTitleEn(), body.getTitleZh(), body.getMode(), body.getExclude())));
    }

    @PostMapping("/review")
    public ResponseEntity<?> reviewAnswer(@RequestBody LearningReviewRequest body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.reviewAnswer(null, body.getTitleEn(), body.getTitleZh(),
                        body.getTaskTitle(), body.getTaskDescription(), body.getAnswer(), body.getMode(), body.getInputMode())));
    }
}
