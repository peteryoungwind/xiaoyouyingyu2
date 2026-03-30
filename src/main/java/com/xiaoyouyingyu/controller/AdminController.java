package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.Topic;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.TopicRepository;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final TopicRepository topicRepository;
    private final UserRepository userRepository;
    private final AiService aiService;

    @PostMapping("/topics")
    public ResponseEntity<Topic> createTopic(@Valid @RequestBody Topic topic, Authentication auth) {
        userRepository.findByUsername((String) auth.getPrincipal())
                .ifPresent(u -> topic.setCreatorId(u.getId()));
        return ResponseEntity.ok(topicRepository.save(topic));
    }

    @PutMapping("/topics/{id}")
    public ResponseEntity<?> updateTopic(@PathVariable Long id, @RequestBody Topic updated) {
        return topicRepository.findById(id).map(topic -> {
            topic.setTitle(updated.getTitle());
            topic.setTitleZh(updated.getTitleZh());
            topic.setTags(updated.getTags());
            topic.setEventDate(updated.getEventDate());
            topic.setQuestions(updated.getQuestions());
            return ResponseEntity.ok(topicRepository.save(topic));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<?> deleteTopic(@PathVariable Long id) {
        topicRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "删除成功"));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "用户已删除"));
    }

    @PostMapping("/ai/generate")
    public ResponseEntity<?> aiGenerate(@RequestBody Map<String, Object> body) {
        String prompt = (String) body.get("prompt");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("history");
        String result = aiService.generate(prompt, history);
        return ResponseEntity.ok(Map.of("content", result));
    }
}
