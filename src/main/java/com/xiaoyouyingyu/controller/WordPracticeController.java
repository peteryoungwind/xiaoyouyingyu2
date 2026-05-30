package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.WordDifficulty;
import com.xiaoyouyingyu.entity.WordPracticeResult;
import com.xiaoyouyingyu.service.WordPracticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
@RequestMapping("/api/word-practice")
@RequiredArgsConstructor
public class WordPracticeController {
    private final WordPracticeService wordPracticeService;

    private String requireUsername(Authentication auth) {
        if (auth == null
                || !auth.isAuthenticated()
                || auth instanceof AnonymousAuthenticationToken
                || !(auth.getPrincipal() instanceof String username)
                || "anonymousUser".equals(username)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
        return username;
    }

    @GetMapping("/books")
    public ResponseEntity<?> books(Authentication auth) {
        String username = requireUsername(auth);
        return ResponseEntity.ok(wordPracticeService.listPublishedBooks(username));
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<?> book(@PathVariable Long bookId,
                                  @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                  Authentication auth) {
        String username = requireUsername(auth);
        return ResponseEntity.ok(wordPracticeService.getBook(bookId, username, difficulty));
    }

    @GetMapping("/books/{bookId}/next")
    public ResponseEntity<?> next(@PathVariable Long bookId,
                                  @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                  @RequestParam(defaultValue = "1") int limit,
                                  Authentication auth) {
        String username = requireUsername(auth);
        return ResponseEntity.ok(wordPracticeService.next(bookId, username, difficulty, Math.max(1, Math.min(limit, 20))));
    }

    @GetMapping("/words/{wordId}")
    public ResponseEntity<?> word(@PathVariable Long wordId, Authentication auth) {
        String username = requireUsername(auth);
        return ResponseEntity.ok(wordPracticeService.wordDetail(wordId, username));
    }

    @PostMapping("/words/{wordId}/answer")
    public ResponseEntity<?> answer(@PathVariable Long wordId, @RequestBody Map<String, String> body, Authentication auth) {
        String username = requireUsername(auth);
        WordPracticeResult result = WordPracticeResult.valueOf(body.getOrDefault("result", "UNKNOWN").toUpperCase());
        return ResponseEntity.ok(wordPracticeService.answer(wordId, username, result));
    }

    @GetMapping("/books/{bookId}/progress")
    public ResponseEntity<?> progress(@PathVariable Long bookId,
                                      @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                      Authentication auth) {
        String username = requireUsername(auth);
        return ResponseEntity.ok(wordPracticeService.progress(bookId, username, difficulty));
    }

    @GetMapping("/books/{bookId}/words")
    public ResponseEntity<?> learnedWords(@PathVariable Long bookId,
                                          @RequestParam(defaultValue = "BEGINNER") WordDifficulty difficulty,
                                          Authentication auth) {
        String username = requireUsername(auth);
        return ResponseEntity.ok(wordPracticeService.learnedWords(bookId, username, difficulty));
    }
}
