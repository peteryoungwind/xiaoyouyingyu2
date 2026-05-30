package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.TtsModel;
import com.xiaoyouyingyu.service.TtsModelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tts-models")
@RequiredArgsConstructor
public class AdminTtsModelController {
    private final TtsModelService ttsModelService;

    @GetMapping
    public ResponseEntity<?> listTtsModels() {
        return ResponseEntity.ok(ttsModelService.list());
    }

    @PostMapping
    public ResponseEntity<?> createTtsModel(@Valid @RequestBody TtsModel model) {
        return ResponseEntity.ok(ttsModelService.toResponse(ttsModelService.create(model)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTtsModel(@PathVariable Long id, @Valid @RequestBody TtsModel model) {
        return ResponseEntity.ok(ttsModelService.toResponse(ttsModelService.update(id, model)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTtsModel(@PathVariable Long id) {
        ttsModelService.delete(id);
        return ResponseEntity.ok(Map.of("message", "TTS 模型已删除"));
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<?> setDefaultTtsModel(@PathVariable Long id) {
        return ResponseEntity.ok(ttsModelService.toResponse(ttsModelService.setDefault(id)));
    }
}
