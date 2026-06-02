package com.xiaoyouyingyu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import com.xiaoyouyingyu.service.AiDialogUsageService;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null ? "参数不正确" : error.getDefaultMessage())
                .orElse("参数不正确");
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    @ExceptionHandler(AiDialogUsageService.AiDialogQuotaExceededException.class)
    public ResponseEntity<?> handleQuotaExceeded(AiDialogUsageService.AiDialogQuotaExceededException e) {
        return ResponseEntity.status(429).body(Map.of("error", e.getMessage(), "remainingToday", 0));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> handleResponseStatus(ResponseStatusException e) {
        HttpStatus status = HttpStatus.resolve(e.getStatusCode().value());
        String message = e.getReason() == null ? "请求失败" : e.getReason();
        return ResponseEntity.status(status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status)
                .body(Map.of("error", message));
    }
}
