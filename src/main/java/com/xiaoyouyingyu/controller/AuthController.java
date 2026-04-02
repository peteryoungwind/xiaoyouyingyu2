package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.AuthRequest;
import com.xiaoyouyingyu.dto.AuthResponse;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.security.JwtUtils;
import com.xiaoyouyingyu.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final MembershipService membershipService;

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name());
        String expireAt = user.getMembershipExpireAt() != null ? user.getMembershipExpireAt().toString() : "";
        return new AuthResponse(token, user.getUsername(), user.getRole().name(), expireAt, user.isMembershipActive());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名已存在"));
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        userRepository.save(user);
        membershipService.grantRegistrationGift(user);
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest req) {
        return userRepository.findByUsername(req.getUsername())
                .filter(u -> passwordEncoder.matches(req.getPassword(), u.getPassword()))
                .map(u -> ResponseEntity.ok(buildAuthResponse(u)))
                .orElse(ResponseEntity.badRequest().body(null));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                            @RequestAttribute(required = false) User currentUser) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> {
                    if (!passwordEncoder.matches(body.get("oldPassword"), user.getPassword())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "原密码错误"));
                    }
                    user.setPassword(passwordEncoder.encode(body.get("newPassword")));
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "密码修改成功"));
                })
                .orElse(ResponseEntity.badRequest().body(null));
    }
}
