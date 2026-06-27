package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.WordBookService;
import com.xiaoyouyingyu.service.WordGenerationService;
import com.xiaoyouyingyu.service.WordGenerationTaskService;
import com.xiaoyouyingyu.service.WordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminWordBookController {
    private final WordBookService wordBookService;
    private final WordService wordService;
    private final WordGenerationService wordGenerationService;
    private final WordGenerationTaskService wordGenerationTaskService;
    private final UserRepository userRepository;

    @GetMapping("/word-books")
    public ResponseEntity<?> listWordBooks(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(wordBookService.list(PageRequest.of(page, size)).map(wordBookService::toResponse));
    }

    @PostMapping("/word-books")
    public ResponseEntity<?> createWordBook(@Valid @RequestBody WordBook book, Authentication auth) {
        Long creatorId = currentUserId(auth);
        return ResponseEntity.ok(wordBookService.toResponse(wordBookService.create(book, creatorId)));
    }

    @GetMapping("/word-books/{id}")
    public ResponseEntity<?> getWordBook(@PathVariable Long id) {
        return ResponseEntity.ok(wordBookService.toResponse(wordBookService.getRequired(id)));
    }

    @PutMapping("/word-books/{id}")
    public ResponseEntity<?> updateWordBook(@PathVariable Long id, @Valid @RequestBody WordBook book) {
        return ResponseEntity.ok(wordBookService.toResponse(wordBookService.update(id, book)));
    }

    @PatchMapping("/word-books/{id}/publish")
    public ResponseEntity<?> publishWordBook(@PathVariable Long id) {
        return ResponseEntity.ok(wordBookService.toResponse(wordBookService.changeStatus(id, WordBookStatus.PUBLISHED)));
    }

    @PatchMapping("/word-books/{id}/offline")
    public ResponseEntity<?> offlineWordBook(@PathVariable Long id) {
        return ResponseEntity.ok(wordBookService.toResponse(wordBookService.changeStatus(id, WordBookStatus.OFFLINE)));
    }

    @DeleteMapping("/word-books/{id}")
    public ResponseEntity<?> deleteWordBook(@PathVariable Long id) {
        wordBookService.softDelete(id);
        return ResponseEntity.ok(Map.of("message", "单词本已删除"));
    }

    @GetMapping("/word-books/{id}/words")
    public ResponseEntity<?> listWords(@PathVariable Long id,
                                       @RequestParam(required = false) WordDifficulty difficulty,
                                       @RequestParam(required = false) WordStatus status,
                                       @RequestParam(required = false) Long sourceTopicId,
                                       @RequestParam(required = false) String keyword,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(wordService.search(id, difficulty, status, sourceTopicId, keyword, pageable).map(wordService::toResponse));
    }

    @PostMapping("/word-books/{id}/words")
    public ResponseEntity<?> createWord(@PathVariable Long id,
                                        @RequestParam(required = false) Long ttsModelId,
                                        @Valid @RequestBody Word word) {
        return ResponseEntity.ok(wordService.toResponse(wordService.create(id, word, ttsModelId)));
    }

    @PutMapping("/words/{wordId}")
    public ResponseEntity<?> updateWord(@PathVariable Long wordId, @Valid @RequestBody Word word) {
        return ResponseEntity.ok(wordService.toResponse(wordService.update(wordId, word)));
    }

    @DeleteMapping("/words/{wordId}")
    public ResponseEntity<?> deleteWord(@PathVariable Long wordId) {
        wordService.softDelete(wordId);
        return ResponseEntity.ok(Map.of("message", "单词已删除"));
    }

    @PostMapping("/word-books/{id}/generate-by-scene")
    public ResponseEntity<?> generateByScene(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(wordGenerationService.generateByScene(id, body));
    }

    @PostMapping("/word-books/{id}/generate-by-topics")
    public ResponseEntity<?> generateByTopics(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(wordGenerationService.generateByTopics(id, body));
    }

    @PostMapping("/word-books/generation-tasks/scene")
    public ResponseEntity<?> createSceneGenerationTask(@RequestBody Map<String, Object> body, Authentication auth) {
        WordBook book = new WordBook();
        book.setName(String.valueOf(body.get("name")));
        book.setDescription(body.get("description") == null ? null : String.valueOf(body.get("description")));
        book.setScene(body.get("scene") == null ? null : String.valueOf(body.get("scene")));
        book.setLevel(parseLevel(body.get("level")));
        book.setStatus(WordBookStatus.DRAFT);
        WordBook savedBook = wordBookService.create(book, currentUserId(auth));

        WordGenerationTask task = wordGenerationTaskService.createTask(savedBook, WordGenerationTaskType.SCENE, currentUserId(auth));
        wordGenerationTaskService.runSceneTask(task.getId(), savedBook.getId(), body);
        return ResponseEntity.accepted().body(wordGenerationTaskService.toResponse(task));
    }

    @PostMapping("/word-books/generation-tasks/topics")
    public ResponseEntity<?> createTopicGenerationTask(@RequestBody Map<String, Object> body, Authentication auth) {
        WordBook book = new WordBook();
        book.setName(String.valueOf(body.get("name")));
        book.setDescription(body.get("description") == null ? null : String.valueOf(body.get("description")));
        book.setScene(body.get("scene") == null ? null : String.valueOf(body.get("scene")));
        book.setLevel(parseLevel(body.get("level")));
        book.setStatus(WordBookStatus.DRAFT);
        WordBook savedBook = wordBookService.create(book, currentUserId(auth));

        WordGenerationTask task = wordGenerationTaskService.createTask(savedBook, WordGenerationTaskType.TOPICS, currentUserId(auth));
        wordGenerationTaskService.runTopicsTask(task.getId(), savedBook.getId(), body);
        return ResponseEntity.accepted().body(wordGenerationTaskService.toResponse(task));
    }

    @GetMapping("/word-books/generation-tasks")
    public ResponseEntity<?> listGenerationTasks() {
        return ResponseEntity.ok(wordGenerationTaskService.listRecent());
    }

    @GetMapping("/word-books/generation-tasks/{taskId}")
    public ResponseEntity<?> getGenerationTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(wordGenerationTaskService.getResponse(taskId));
    }

    @PostMapping("/words/batch-publish")
    public ResponseEntity<?> batchPublish(@RequestBody Map<String, List<Long>> body) {
        return ResponseEntity.ok(Map.of("updated", wordService.batchStatus(body.getOrDefault("ids", List.of()), WordStatus.PUBLISHED)));
    }

    @PostMapping("/words/batch-offline")
    public ResponseEntity<?> batchOffline(@RequestBody Map<String, List<Long>> body) {
        return ResponseEntity.ok(Map.of("updated", wordService.batchStatus(body.getOrDefault("ids", List.of()), WordStatus.OFFLINE)));
    }

    @PostMapping("/words/batch-delete")
    public ResponseEntity<?> batchDelete(@RequestBody Map<String, List<Long>> body) {
        return ResponseEntity.ok(Map.of("updated", wordService.batchDelete(body.getOrDefault("ids", List.of()))));
    }

    @PostMapping("/words/batch-sort")
    public ResponseEntity<?> batchSort(@RequestBody Map<String, List<Map<String, Object>>> body) {
        return ResponseEntity.ok(Map.of("updated", wordService.batchSort(body.getOrDefault("items", List.of()))));
    }

    @PostMapping("/words/batch-regenerate-audio")
    public ResponseEntity<?> batchRegenerateAudio(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<Long> ids = (List<Long>) body.getOrDefault("ids", List.of());
        Long ttsModelId = body.get("ttsModelId") == null ? null : ((Number) body.get("ttsModelId")).longValue();
        return ResponseEntity.ok(Map.of("updated", wordService.regenerateAudio(ids, ttsModelId)));
    }

    private Long currentUserId(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }
        return userRepository.findByUsername((String) auth.getPrincipal()).map(User::getId).orElse(null);
    }

    private WordBookLevel parseLevel(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return WordBookLevel.BEGINNER;
        }
        return "ADVANCED".equalsIgnoreCase(String.valueOf(value)) ? WordBookLevel.ADVANCED : WordBookLevel.BEGINNER;
    }
}
