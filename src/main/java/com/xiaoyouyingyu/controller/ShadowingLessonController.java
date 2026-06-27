package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.dto.shadowing.ShadowingTranslationReviewRequest;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.ShadowingLessonService;
import com.xiaoyouyingyu.service.SpeechToTextService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/shadowing-lessons")
@RequiredArgsConstructor
public class ShadowingLessonController {
    private final ShadowingLessonService shadowingLessonService;
    private final SpeechToTextService speechToTextService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) Boolean learned,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size,
                                  Authentication auth) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
        return ResponseEntity.ok(shadowingLessonService.list(currentUserOrNull(auth), learned, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(shadowingLessonService.detail(id, currentUserOrNull(auth)));
    }

    @PostMapping(value = "/{id}/sentences/{sentenceIndex}/review", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> reviewSentence(@PathVariable Long id,
                                            @PathVariable Integer sentenceIndex,
                                            @RequestParam("audioFile") MultipartFile audioFile,
                                            @RequestParam(required = false) String referenceText,
                                            @RequestParam(required = false) Long durationMs,
                                            Authentication auth) {
        return ResponseEntity.ok(shadowingLessonService.reviewSentence(id, sentenceIndex, referenceText, durationMs, audioFile, currentUser(auth)));
    }

    @PostMapping("/{id}/translation-review")
    public ResponseEntity<?> reviewTranslation(@PathVariable Long id,
                                               @RequestBody ShadowingTranslationReviewRequest request,
                                               Authentication auth) {
        return ResponseEntity.ok(shadowingLessonService.reviewTranslation(id, request, currentUser(auth)));
    }

    @PostMapping(value = "/speech-to-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> speechToText(@RequestParam("audioFile") MultipartFile audioFile,
                                          Authentication auth) {
        currentUser(auth);
        return ResponseEntity.ok(Map.of("text", speechToTextService.transcribe(audioFile)));
    }

    private User currentUserOrNull(Authentication auth) {
        if (auth == null || auth instanceof AnonymousAuthenticationToken || auth.getPrincipal() == null) {
            return null;
        }
        return currentUser(auth);
    }

    private User currentUser(Authentication auth) {
        String username = (String) auth.getPrincipal();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
}
