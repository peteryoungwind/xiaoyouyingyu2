package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.LearningGenerateRequest;
import com.xiaoyouyingyu.dto.LearningReviewRequest;
import com.xiaoyouyingyu.repository.TopicRepository;
import com.xiaoyouyingyu.service.AiService;
import com.xiaoyouyingyu.service.SpeechToTextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/spoken-warmup")
@RequiredArgsConstructor
public class SpokenWarmupController {
    private final AiService aiService;
    private final TopicRepository topicRepository;
    private final SpeechToTextService speechToTextService;

    @GetMapping("/topic/{id}")
    public ResponseEntity<?> getTopic(@PathVariable Long id) {
        return topicRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/warmup")
    public ResponseEntity<?> generateWarmup(@RequestBody LearningGenerateRequest request) {
        return content(aiService.generateWarmup(null, request.getTitleEn(), request.getTitleZh(), request.getMode(), request.getExclude()));
    }

    @PostMapping("/vocabulary")
    public ResponseEntity<?> generateVocabulary(@RequestBody LearningGenerateRequest request) {
        return content(aiService.generateVocabulary(null, request.getTitleEn(), request.getTitleZh(), request.getMode(), request.getExclude()));
    }

    @PostMapping("/sentence-patterns")
    public ResponseEntity<?> generateSentencePatterns(@RequestBody LearningGenerateRequest request) {
        return content(aiService.generateSentencePatterns(null, request.getTitleEn(), request.getTitleZh(), request.getMode(), request.getExclude()));
    }

    @PostMapping("/idiomatic-expressions")
    public ResponseEntity<?> generateIdiomaticExpressions(@RequestBody LearningGenerateRequest request) {
        return content(aiService.generateIdiomaticExpressions(null, request.getTitleEn(), request.getTitleZh(), request.getMode(), request.getExclude()));
    }

    @PostMapping("/tasks")
    public ResponseEntity<?> generateTasks(@RequestBody LearningGenerateRequest request) {
        return content(aiService.generateTasks(null, request.getTitleEn(), request.getTitleZh(), request.getMode(), request.getExclude()));
    }

    @PostMapping("/review")
    public ResponseEntity<?> reviewAnswer(@RequestBody LearningReviewRequest request) {
        return content(aiService.reviewAnswer(null, request.getTitleEn(), request.getTitleZh(),
                request.getTaskTitle(), request.getTaskDescription(), request.getAnswer(), request.getMode(), request.getInputMode()));
    }

    @PostMapping(value = "/speech-to-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> speechToText(@RequestParam("audioFile") MultipartFile audioFile,
                                          @RequestParam(required = false) String filename,
                                          @RequestParam(required = false) String contentType) {
        return ResponseEntity.ok(Map.of("text", speechToTextService.transcribe(audioFile, filename, contentType)));
    }

    private static ResponseEntity<?> content(String content) {
        return ResponseEntity.ok(Map.of("content", content));
    }
}
