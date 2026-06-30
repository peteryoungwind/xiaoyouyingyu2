package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.aidialog.AiDialogMessageRequest;
import com.xiaoyouyingyu.dto.aidialog.AiDialogSpeechToTextRequest;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.AiDialogService;
import com.xiaoyouyingyu.service.SpeechToTextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-dialog")
@RequiredArgsConstructor
public class AiDialogController {
    private final AiDialogService aiDialogService;
    private final SpeechToTextService speechToTextService;
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

    @PostMapping(value = "/speech-to-text", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> speechToText(@RequestParam("audioFile") MultipartFile audioFile) {
        return ResponseEntity.ok(Map.of("text", speechToTextService.transcribe(audioFile)));
    }

    @PostMapping("/speech-to-text-base64")
    public ResponseEntity<?> speechToTextBase64(@Valid @RequestBody AiDialogSpeechToTextRequest request) {
        byte[] audioBytes;
        try {
            audioBytes = Base64.getDecoder().decode(stripDataUrlPrefix(request.getAudioBase64()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "录音内容格式错误，请重录");
        }
        return ResponseEntity.ok(Map.of("text", speechToTextService.transcribe(
                audioBytes,
                request.getFilename(),
                request.getContentType()
        )));
    }

    private String stripDataUrlPrefix(String value) {
        int commaIndex = value.indexOf(',');
        if (value.startsWith("data:") && commaIndex >= 0) {
            return value.substring(commaIndex + 1);
        }
        return value;
    }

    private User currentUser(Authentication auth) {
        String username = (String) auth.getPrincipal();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
}
