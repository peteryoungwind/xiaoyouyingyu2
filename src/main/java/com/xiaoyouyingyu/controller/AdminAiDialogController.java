package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.aidialog.AdminAiDialogConfigRequest;
import com.xiaoyouyingyu.service.AiDialogConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/ai-dialog")
@RequiredArgsConstructor
public class AdminAiDialogController {
    private final AiDialogConfigService configService;

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(configService.getAdminResponse());
    }

    @PutMapping("/config")
    public ResponseEntity<?> updateConfig(@RequestBody AdminAiDialogConfigRequest request) {
        return ResponseEntity.ok(configService.save(request));
    }

    @PostMapping("/config/reset-prompts")
    public ResponseEntity<?> resetPrompts() {
        return ResponseEntity.ok(configService.resetPrompts());
    }
}
