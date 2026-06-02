package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.aidialog.AiDialogMessageRequest;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.AiDialogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-dialog")
@RequiredArgsConstructor
public class AiDialogController {
    private final AiDialogService aiDialogService;
    private final UserRepository userRepository;

    @GetMapping("/config")
    public ResponseEntity<?> getConfig(Authentication auth) {
        User user = currentUser(auth);
        return ResponseEntity.ok(aiDialogService.getSummary(user.getId()));
    }

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(@Valid @RequestBody AiDialogMessageRequest request, Authentication auth) {
        User user = currentUser(auth);
        return ResponseEntity.ok(aiDialogService.sendMessage(user.getId(), request));
    }

    @PostMapping("/speech-to-text")
    public ResponseEntity<?> speechToText() {
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of("error", "语音识别兜底接口暂未启用，请先使用小程序端识别或文字输入"));
    }

    private User currentUser(Authentication auth) {
        String username = (String) auth.getPrincipal();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
}
