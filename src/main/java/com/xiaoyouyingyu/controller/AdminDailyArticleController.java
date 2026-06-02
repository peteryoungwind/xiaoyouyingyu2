package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.dailyarticle.DailyArticleSaveRequest;
import com.xiaoyouyingyu.dto.dailyarticle.DailyArticleStatusRequest;
import com.xiaoyouyingyu.entity.DailyArticleStatus;
import com.xiaoyouyingyu.service.DailyArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/daily-articles")
@RequiredArgsConstructor
public class AdminDailyArticleController {
    private final DailyArticleService dailyArticleService;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) DailyArticleStatus status,
                                  @RequestParam(required = false) Boolean published,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(dailyArticleService.listForAdmin(status, published, PageRequest.of(page, size)));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody DailyArticleSaveRequest request) {
        return ResponseEntity.ok(dailyArticleService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        return ResponseEntity.ok(dailyArticleService.getAdminDetail(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody DailyArticleSaveRequest request) {
        return ResponseEntity.ok(dailyArticleService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @Valid @RequestBody DailyArticleStatusRequest request) {
        return ResponseEntity.ok(dailyArticleService.changeStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/enable")
    public ResponseEntity<?> enable(@PathVariable Long id) {
        return ResponseEntity.ok(dailyArticleService.changeStatus(id, DailyArticleStatus.ENABLED));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<?> disable(@PathVariable Long id) {
        return ResponseEntity.ok(dailyArticleService.changeStatus(id, DailyArticleStatus.DISABLED));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        dailyArticleService.delete(id);
        return ResponseEntity.ok(Map.of("message", "外刊已删除"));
    }

    @PostMapping("/publish-today")
    public ResponseEntity<?> publishToday() {
        return ResponseEntity.ok(dailyArticleService.publishToday());
    }

    @PostMapping(value = "/upload-audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAudio(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(dailyArticleService.uploadAudio(file));
    }

    @PostMapping(value = "/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAudioAlias(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(dailyArticleService.uploadAudio(file));
    }
}
