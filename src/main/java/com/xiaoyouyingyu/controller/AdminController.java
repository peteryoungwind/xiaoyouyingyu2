package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.AiModel;
import com.xiaoyouyingyu.entity.Topic;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.AiModelRepository;
import com.xiaoyouyingyu.repository.TopicRepository;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.AiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
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
    private final AiModelRepository aiModelRepository;

    // ===================== 话题管理 =====================

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

    // ===================== 用户管理 =====================

    @GetMapping("/users")
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "用户已删除"));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (!"ADMIN".equals(newRole) && !"PREMIUM_USER".equals(newRole) && !"USER".equals(newRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "无效的角色"));
        }
        return userRepository.findById(id).map(user -> {
            if (user.getRole() == User.Role.ADMIN && "USER".equals(newRole)
                    && userRepository.countByRole(User.Role.ADMIN) <= 1) {
                return ResponseEntity.badRequest().body(Map.of("error", "无法降级唯一的管理员"));
            }
            user.setRole(User.Role.valueOf(newRole));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "角色更新成功"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ===================== AI 生成（旧接口保留兼容） =====================

    @PostMapping("/ai/generate")
    public ResponseEntity<?> aiGenerate(@RequestBody Map<String, Object> body) {
        String prompt = (String) body.get("prompt");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> history = (List<Map<String, String>>) body.get("history");
        String result = aiService.generate(prompt, history);
        return ResponseEntity.ok(Map.of("content", result));
    }

    // ===================== AI 生成新流程 =====================

    /**
     * 批量生成5个主题标题
     */
    @PostMapping("/ai/generate-titles")
    public ResponseEntity<?> aiGenerateTitles(@RequestBody Map<String, Object> body) {
        String prompt = (String) body.get("prompt");
        Long modelId = body.get("modelId") != null ? ((Number) body.get("modelId")).longValue() : null;
        String result = aiService.generateTitles(modelId, prompt);
        return ResponseEntity.ok(Map.of("content", result));
    }

    /**
     * 根据选中主题生成10个讨论问题
     */
    @PostMapping("/ai/generate-questions")
    public ResponseEntity<?> aiGenerateQuestions(@RequestBody Map<String, String> body) {
        String titleEn = body.get("titleEn");
        String titleZh = body.get("titleZh");
        Long modelId = body.get("modelId") != null ? Long.parseLong(body.get("modelId")) : null;
        if (titleEn == null || titleZh == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "主题标题不能为空"));
        }
        String result = aiService.generateQuestions(modelId, titleEn, titleZh);
        return ResponseEntity.ok(Map.of("content", result));
    }

    // ===================== AI 模型管理 =====================

    @GetMapping("/ai/models")
    public ResponseEntity<List<AiModel>> listModels() {
        return ResponseEntity.ok(aiModelRepository.findAll());
    }

    @PostMapping("/ai/models")
    @Transactional
    public ResponseEntity<?> createModel(@Valid @RequestBody AiModel model) {
        if (Boolean.TRUE.equals(model.getIsDefault())) {
            aiModelRepository.clearDefault();
        }
        return ResponseEntity.ok(aiModelRepository.save(model));
    }

    @PutMapping("/ai/models/{id}")
    @Transactional
    public ResponseEntity<?> updateModel(@PathVariable Long id, @Valid @RequestBody AiModel updated) {
        return aiModelRepository.findById(id).map(model -> {
            if (Boolean.TRUE.equals(updated.getIsDefault())) {
                aiModelRepository.clearDefault();
            }
            model.setName(updated.getName());
            model.setApiUrl(updated.getApiUrl());
            model.setApiKey(updated.getApiKey());
            model.setModelName(updated.getModelName());
            model.setIsDefault(updated.getIsDefault());
            return ResponseEntity.ok(aiModelRepository.save(model));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/ai/models/{id}")
    public ResponseEntity<?> deleteModel(@PathVariable Long id) {
        aiModelRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "模型已删除"));
    }
}
