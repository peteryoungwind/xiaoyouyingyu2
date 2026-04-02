package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.repository.TopicRepository;
import com.xiaoyouyingyu.service.AiService;
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
    public ResponseEntity<?> generateWarmup(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateWarmup(null, body.get("titleEn"), body.get("titleZh"), body.get("mode"), body.get("exclude"))));
    }

    @PostMapping("/vocabulary")
    public ResponseEntity<?> generateVocabulary(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateVocabulary(null, body.get("titleEn"), body.get("titleZh"), body.get("mode"), body.get("exclude"))));
    }

    @PostMapping("/expressions")
    public ResponseEntity<?> generateExpressions(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateExpressions(null, body.get("titleEn"), body.get("titleZh"), body.get("mode"), body.get("exclude"))));
    }

    @PostMapping("/tasks")
    public ResponseEntity<?> generateTasks(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.generateTasks(null, body.get("titleEn"), body.get("titleZh"), body.get("mode"), body.get("exclude"))));
    }

    @PostMapping("/review")
    public ResponseEntity<?> reviewAnswer(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(Map.of("content",
                aiService.reviewAnswer(null, body.get("titleEn"), body.get("titleZh"),
                        body.get("taskTitle"), body.get("answer"), body.get("mode"))));
    }
}
