package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.AuthRequest;
import com.xiaoyouyingyu.dto.AuthResponse;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.security.JwtUtils;
import com.xiaoyouyingyu.service.MembershipService;
import com.xiaoyouyingyu.service.PcWechatLoginService;
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
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final MembershipService membershipService;
    private final PcWechatLoginService pcWechatLoginService;

    @Value("${wechat.appid}")
    private String wechatAppid;

    @Value("${wechat.secret}")
    private String wechatSecret;

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name());
        String expireAt = user.getMembershipExpireAt() != null ? user.getMembershipExpireAt().toString() : "";
        return new AuthResponse(token, user.getUsername(), user.getRole().name(), expireAt, user.isMembershipActive(), user.isHasPassword());
    }

    private boolean hasStoredPassword(User user) {
        return user.getPassword() != null && !user.getPassword().isBlank();
    }

    private boolean shouldTreatAsPasswordUnset(User user) {
        if (user.isHasPassword()) {
            return false;
        }
        if (!hasStoredPassword(user)) {
            return true;
        }
        return user.getWechatOpenid() != null
                && user.getUsername() != null
                && user.getUsername().startsWith("wx_");
    }

    private String buildDeviceInfo(String userAgent, String clientIp) {
        String agent = (userAgent == null || userAgent.isBlank()) ? "未知设备" : userAgent;
        if (agent.length() > 80) {
            agent = agent.substring(0, 80) + "...";
        }
        String ip = (clientIp == null || clientIp.isBlank()) ? "未知IP" : clientIp;
        return agent + " / " + ip;
    }

    private Optional<User> getCurrentUser() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Optional.empty();
        }
        if (auth.getDetails() instanceof User user) {
            return Optional.of(user);
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof String username) {
            return userRepository.findByUsername(username);
        }
        return Optional.empty();
    }

    private ResponseEntity<?> requireWechatBoundUser(java.util.function.Function<User, ResponseEntity<?>> action) {
        return getCurrentUser()
                .map(user -> {
                    if (user.getWechatOpenid() == null || user.getWechatOpenid().isBlank()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "当前账号未绑定微信，无法确认电脑端登录"));
                    }
                    return action.apply(user);
                })
                .orElse(ResponseEntity.status(401).body(Map.of("error", "请先登录小程序账号")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名已存在"));
        }
        User user = new User();
        user.setUsername(req.getUsername());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setHasPassword(true);
        userRepository.save(user);
        membershipService.grantRegistrationGift(user);
        return ResponseEntity.ok(buildAuthResponse(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest req) {
        return userRepository.findByUsername(req.getUsername())
                .map(user -> {
                    if (shouldTreatAsPasswordUnset(user)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "该账号尚未设置密码，请先在小程序中设置密码"));
                    }
                    if (!hasStoredPassword(user)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "该账号未配置可用密码，请联系管理员处理"));
                    }
                    if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "密码错误"));
                    }

                    if (!user.isHasPassword()) {
                        user.setHasPassword(true);
                        userRepository.save(user);
                    }

                    return ResponseEntity.ok(buildAuthResponse(user));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "用户名不存在")));
    }

    @PutMapping("/username")
    public ResponseEntity<?> changeUsername(@RequestBody Map<String, String> body) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String newUsername = body.get("username");
        if (newUsername == null || newUsername.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名不能为空"));
        }
        if (newUsername.length() < 3 || newUsername.length() > 50) {
            return ResponseEntity.badRequest().body(Map.of("error", "用户名长度需为3到50位"));
        }
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> {
                    if (newUsername.equals(user.getUsername())) {
                        return ResponseEntity.ok(buildAuthResponse(user));
                    }
                    if (userRepository.existsByUsername(newUsername)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "用户名已存在"));
                    }
                    user.setUsername(newUsername);
                    userRepository.save(user);
                    return ResponseEntity.ok(buildAuthResponse(user));
                })
                .orElse(ResponseEntity.badRequest().body(null));
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                            @RequestAttribute(required = false) User currentUser) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> {
                    if (shouldTreatAsPasswordUnset(user)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "该账号尚未设置密码，请先完成首次设置密码"));
                    }
                    if (!hasStoredPassword(user)) {
                        return ResponseEntity.badRequest().body(Map.of("error", "该账号未配置可用密码，请联系管理员处理"));
                    }
                    String oldPassword = body.get("oldPassword");
                    String newPassword = body.get("newPassword");
                    if (newPassword == null || newPassword.length() < 6) {
                        return ResponseEntity.badRequest().body(Map.of("error", "新密码至少6位"));
                    }
                    if (oldPassword == null || !passwordEncoder.matches(oldPassword, user.getPassword())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "原密码错误"));
                    }
                    user.setPassword(passwordEncoder.encode(newPassword));
                    user.setHasPassword(true);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "密码修改成功", "hasPassword", true));
                })
                .orElse(ResponseEntity.badRequest().body(null));
    }

    @PutMapping("/password/setup")
    public ResponseEntity<?> setupPassword(@RequestBody Map<String, String> body) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> {
                    if (user.isHasPassword()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "该账号已设置密码，请使用修改密码功能"));
                    }
                    String newPassword = body.get("newPassword");
                    if (newPassword == null || newPassword.length() < 6) {
                        return ResponseEntity.badRequest().body(Map.of("error", "新密码至少6位"));
                    }
                    user.setPassword(passwordEncoder.encode(newPassword));
                    user.setHasPassword(true);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of("message", "密码设置成功", "hasPassword", true));
                })
                .orElse(ResponseEntity.badRequest().body(null));
    }

    @PostMapping("/wechat-pc-login/session")
    public ResponseEntity<?> createWechatPcLoginSession(@RequestHeader(value = "User-Agent", required = false) String userAgent,
                                                        jakarta.servlet.http.HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        var session = pcWechatLoginService.createSession(userAgent, clientIp);
        return ResponseEntity.ok(Map.of(
                "ticketId", session.getTicketId(),
                "pollToken", session.getPollToken(),
                "expiresAt", session.getExpiresAt(),
                "qrContent", session.getQrContent()
        ));
    }

    @GetMapping("/wechat-pc-login/session/{ticketId}")
    public ResponseEntity<?> pollWechatPcLoginSession(@PathVariable String ticketId,
                                                      @RequestParam String pollToken) {
        var result = pcWechatLoginService.poll(ticketId, pollToken);
        return switch (result.getStatus()) {
            case PENDING -> ResponseEntity.ok(Map.of("status", "PENDING"));
            case CONFIRMED -> {
                AuthResponse authResponse = buildAuthResponse(result.getUser());
                Map<String, Object> response = new HashMap<>();
                response.put("status", "CONFIRMED");
                response.put("token", authResponse.getToken());
                response.put("username", authResponse.getUsername());
                response.put("role", authResponse.getRole());
                response.put("membershipExpireAt", authResponse.getMembershipExpireAt());
                response.put("membershipActive", authResponse.isMembershipActive());
                response.put("hasPassword", authResponse.isHasPassword());
                response.put("isAdmin", authResponse.isAdmin());
                response.put("isPremium", authResponse.isPremium());
                yield ResponseEntity.ok(response);
            }
            case CANCELLED -> ResponseEntity.badRequest().body(Map.of("status", "CANCELLED", "error", "本次登录已取消"));
            case EXPIRED -> ResponseEntity.badRequest().body(Map.of("status", "EXPIRED", "error", "二维码已过期，请刷新后重试"));
            case CONSUMED -> ResponseEntity.badRequest().body(Map.of("status", "CONSUMED", "error", "本次登录已完成，请重新扫码"));
            case INVALID -> ResponseEntity.badRequest().body(Map.of("status", "INVALID", "error", "无效的登录请求"));
        };
    }

    @GetMapping("/wechat-pc-login/scene/{ticketId}")
    public ResponseEntity<?> getWechatPcLoginScene(@PathVariable String ticketId) {
        return requireWechatBoundUser(currentUser -> pcWechatLoginService.getScene(ticketId)
                .map(ticket -> {
                    if (ticket.isExpired() || ticket.getStatus() == PcWechatLoginService.TicketStatus.EXPIRED) {
                        return ResponseEntity.badRequest().body(Map.of("status", "EXPIRED", "error", "二维码已过期，请在电脑端刷新后重试"));
                    }
                    if (ticket.getStatus() == PcWechatLoginService.TicketStatus.CANCELLED) {
                        return ResponseEntity.badRequest().body(Map.of("status", "CANCELLED", "error", "本次登录已取消"));
                    }
                    if (ticket.getStatus() == PcWechatLoginService.TicketStatus.CONSUMED) {
                        return ResponseEntity.badRequest().body(Map.of("status", "CONSUMED", "error", "本次登录已完成，请重新扫码"));
                    }
                    return ResponseEntity.ok(Map.of(
                            "status", ticket.getStatus().name(),
                            "expiresAt", ticket.getExpiresAt(),
                            "deviceInfo", buildDeviceInfo(ticket.getUserAgent(), ticket.getClientIp())
                    ));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("status", "INVALID", "error", "无效的登录二维码"))));
    }

    @PostMapping("/wechat-pc-login/confirm")
    public ResponseEntity<?> confirmWechatPcLogin(@RequestBody Map<String, String> body) {
        String ticketId = body.get("ticketId");
        if (ticketId == null || ticketId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ticketId不能为空"));
        }
        return requireWechatBoundUser(currentUser -> {
            var result = pcWechatLoginService.confirm(ticketId, currentUser);
            if (result.isSuccess()) {
                return ResponseEntity.ok(Map.of("message", "已确认电脑端登录"));
            }
            return switch (result.getCode()) {
                case "EXPIRED" -> ResponseEntity.badRequest().body(Map.of("error", "二维码已过期，请在电脑端刷新后重试"));
                case "CANCELLED" -> ResponseEntity.badRequest().body(Map.of("error", "本次登录已取消"));
                case "CONSUMED" -> ResponseEntity.badRequest().body(Map.of("error", "本次登录已完成，请重新扫码"));
                default -> ResponseEntity.badRequest().body(Map.of("error", "无效的登录请求"));
            };
        });
    }

    @PostMapping("/wechat-pc-login/cancel")
    public ResponseEntity<?> cancelWechatPcLogin(@RequestBody Map<String, String> body) {
        String ticketId = body.get("ticketId");
        if (ticketId == null || ticketId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "ticketId不能为空"));
        }
        return requireWechatBoundUser(currentUser -> {
            var result = pcWechatLoginService.cancel(ticketId);
            if (result.isSuccess()) {
                return ResponseEntity.ok(Map.of("message", "已取消电脑端登录"));
            }
            return switch (result.getCode()) {
                case "EXPIRED" -> ResponseEntity.badRequest().body(Map.of("error", "二维码已过期"));
                case "CONSUMED" -> ResponseEntity.badRequest().body(Map.of("error", "本次登录已完成，请重新扫码"));
                case "CONFIRMED" -> ResponseEntity.badRequest().body(Map.of("error", "本次登录已确认，请返回电脑端完成登录"));
                default -> ResponseEntity.badRequest().body(Map.of("error", "无效的登录请求"));
            };
        });
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
                newUser.setHasPassword(false);
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
