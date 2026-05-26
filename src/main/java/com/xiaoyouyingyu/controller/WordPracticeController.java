package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.WordDifficulty;
import com.xiaoyouyingyu.entity.WordPracticeResult;
import com.xiaoyouyingyu.service.WordPracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/word-practice")
@RequiredArgsConstructor
public class WordPracticeController {
    private final WordPracticeService wordPracticeService;

    @GetMapping("/books")
    public ResponseEntity<?> books(Authentication auth) {
        return ResponseEntity.ok(wordPracticeService.listPublishedBooks((String) auth.getPrincipal()));
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<?> book(@PathVariable Long bookId,
                                  @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                  Authentication auth) {
        return ResponseEntity.ok(wordPracticeService.getBook(bookId, (String) auth.getPrincipal(), difficulty));
    }

    @GetMapping("/books/{bookId}/next")
    public ResponseEntity<?> next(@PathVariable Long bookId,
                                  @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                  @RequestParam(defaultValue = "1") int limit,
                                  Authentication auth) {
        return ResponseEntity.ok(wordPracticeService.next(bookId, (String) auth.getPrincipal(), difficulty, Math.max(1, Math.min(limit, 20))));
    }

    @GetMapping("/words/{wordId}")
    public ResponseEntity<?> word(@PathVariable Long wordId, Authentication auth) {
        return ResponseEntity.ok(wordPracticeService.wordDetail(wordId, (String) auth.getPrincipal()));
    }

    @PostMapping("/words/{wordId}/answer")
    public ResponseEntity<?> answer(@PathVariable Long wordId, @RequestBody Map<String, String> body, Authentication auth) {
        WordPracticeResult result = WordPracticeResult.valueOf(body.getOrDefault("result", "UNKNOWN").toUpperCase());
        return ResponseEntity.ok(wordPracticeService.answer(wordId, (String) auth.getPrincipal(), result));
    }

    @GetMapping("/books/{bookId}/progress")
    public ResponseEntity<?> progress(@PathVariable Long bookId,
                                      @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                      Authentication auth) {
        return ResponseEntity.ok(wordPracticeService.progress(bookId, (String) auth.getPrincipal(), difficulty));
    }

    @GetMapping("/books/{bookId}/words")
    public ResponseEntity<?> learnedWords(@PathVariable Long bookId,
                                          @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                          Authentication auth) {
        return ResponseEntity.ok(wordPracticeService.learnedWords(bookId, (String) auth.getPrincipal(), difficulty));
    }
}
