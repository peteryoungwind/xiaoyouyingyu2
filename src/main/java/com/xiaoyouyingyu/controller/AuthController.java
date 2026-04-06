package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.AuthRequest;
import com.xiaoyouyingyu.dto.AuthResponse;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.security.JwtUtils;
import com.xiaoyouyingyu.service.MembershipService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final MembershipService membershipService;

    @Value("${wechat.appid}")
    private String wechatAppid;

    @Value("${wechat.secret}")
    private String wechatSecret;

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

    @PostMapping("/wechat-login")
    public ResponseEntity<?> wechatLogin(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "code不能为空"));
        }

        try {
            // Exchange code for openid via WeChat API
            String url = "https://api.weixin.qq.com/sns/jscode2session?appid=" + wechatAppid
                    + "&secret=" + wechatSecret + "&js_code=" + code + "&grant_type=authorization_code";

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).GET().build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(response.body());

            if (json.has("errcode") && json.get("errcode").asInt() != 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "微信登录失败: " + json.get("errmsg").asText()));
            }

            String openid = json.get("openid").asText();

            // Find or create user
            User user = userRepository.findByWechatOpenid(openid).orElseGet(() -> {
                User newUser = new User();
                newUser.setWechatOpenid(openid);
                newUser.setUsername("wx_" + UUID.randomUUID().toString().substring(0, 8));
                newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                userRepository.save(newUser);
                membershipService.grantRegistrationGift(newUser);
                return newUser;
            });

            return ResponseEntity.ok(buildAuthResponse(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "微信登录失败: " + e.getMessage()));
        }
    }
}
