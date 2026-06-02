package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.DailyArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/daily-articles")
@RequiredArgsConstructor
public class DailyArticleController {
    private final DailyArticleService dailyArticleService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false, defaultValue = "false") Boolean read,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size,
                                  Authentication auth) {
        User user = currentUser(auth);
        return ResponseEntity.ok(dailyArticleService.listForUser(user.getId(), read, PageRequest.of(page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(dailyArticleService.getUserDetail(id, currentUser(auth)));
    }

    private User currentUser(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录");
        }
        return userRepository.findByUsername((String) auth.getPrincipal())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "请先登录"));
    }
}
