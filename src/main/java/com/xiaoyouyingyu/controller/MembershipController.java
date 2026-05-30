package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MembershipController {
    private final UserRepository userRepository;
    private final MembershipService membershipService;

    @GetMapping("/user/membership")
    public ResponseEntity<?> getMembership(Authentication auth) {
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> {
                    boolean isAdmin = user.getRole() == User.Role.ADMIN;
                    boolean active = user.isMembershipActive();
                    long remainingDays = 0;
                    if (user.getMembershipExpireAt() != null && user.getMembershipExpireAt().isAfter(LocalDateTime.now())) {
                        remainingDays = ChronoUnit.DAYS.between(LocalDateTime.now(), user.getMembershipExpireAt());
                    }
                    return ResponseEntity.ok(Map.of(
                            "role", user.getRole().name(),
                            "membershipActive", active,
                            "membershipExpireAt", user.getMembershipExpireAt() != null ? user.getMembershipExpireAt().toString() : "",
                            "remainingDays", remainingDays,
                            "membershipSource", user.getMembershipSource() != null ? user.getMembershipSource() : "",
                            "isAdmin", isAdmin
                    ));
                })
                .orElse(ResponseEntity.badRequest().body(null));
    }

    @GetMapping("/user/membership-contact")
    public ResponseEntity<?> getMembershipContact() {
        return ResponseEntity.ok(Map.of(
                "message", "请联系管理员开通高级功能",
                "contactName", "管理员",
                "wechat", "915981048",
                "phone", "",
                "qrCodeUrl", ""
        ));
    }

    @PostMapping("/redeem-codes/redeem")
    public ResponseEntity<?> redeemCode(@RequestBody Map<String, String> body, Authentication auth) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "请输入卡密"));
        }
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> {
                    try {
                        return ResponseEntity.ok(membershipService.redeemCode(user, code.trim()));
                    } catch (RuntimeException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
                    }
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "用户不存在")));
    }
}
