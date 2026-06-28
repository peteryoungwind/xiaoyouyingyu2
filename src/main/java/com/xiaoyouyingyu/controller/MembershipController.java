package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.membership.CreateMembershipOrderRequest;
import com.xiaoyouyingyu.dto.membership.MembershipStatusResponse;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.MembershipOrderService;
import com.xiaoyouyingyu.service.MembershipPlanService;
import com.xiaoyouyingyu.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MembershipController {
    private final UserRepository userRepository;
    private final MembershipService membershipService;
    private final MembershipPlanService membershipPlanService;
    private final MembershipOrderService membershipOrderService;

    @GetMapping("/user/membership")
    public ResponseEntity<?> getMembership(Authentication auth) {
        return userRepository.findByUsername((String) auth.getPrincipal())
                .map(user -> ResponseEntity.ok(MembershipStatusResponse.from(user)))
                .orElse(ResponseEntity.badRequest().body(null));
    }

    @GetMapping("/membership/status")
    public ResponseEntity<?> getMembershipStatus(Authentication auth) {
        return getMembership(auth);
    }

    @GetMapping("/membership/plans")
    public ResponseEntity<?> getMembershipPlans() {
        return ResponseEntity.ok(membershipPlanService.listActivePlans());
    }

    @PostMapping("/membership/orders")
    public ResponseEntity<?> createMembershipOrder(@RequestBody CreateMembershipOrderRequest request, Authentication auth) {
        if (request.getPlanId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "请选择会员套餐"));
        }
        try {
            return ResponseEntity.ok(membershipOrderService.createOrder((String) auth.getPrincipal(), request.getPlanId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/membership/orders/{orderNo}")
    public ResponseEntity<?> getMembershipOrder(@PathVariable String orderNo, Authentication auth) {
        try {
            return ResponseEntity.ok(membershipOrderService.getUserOrder((String) auth.getPrincipal(), orderNo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
