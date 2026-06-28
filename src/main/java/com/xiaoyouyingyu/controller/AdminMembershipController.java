package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.dto.membership.AdminMembershipGrantRequest;
import com.xiaoyouyingyu.dto.membership.MembershipPlanRequest;
import com.xiaoyouyingyu.dto.membership.MembershipPlanResponse;
import com.xiaoyouyingyu.repository.UserRepository;
import com.xiaoyouyingyu.service.MembershipOrderService;
import com.xiaoyouyingyu.service.MembershipPlanService;
import com.xiaoyouyingyu.service.MembershipService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/membership")
@RequiredArgsConstructor
public class AdminMembershipController {
    private final MembershipPlanService membershipPlanService;
    private final MembershipOrderService membershipOrderService;
    private final MembershipService membershipService;
    private final UserRepository userRepository;

    @GetMapping("/plans")
    public ResponseEntity<?> listPlans() {
        return ResponseEntity.ok(membershipPlanService.listAdminPlans());
    }

    @PostMapping("/plans")
    public ResponseEntity<?> createPlan(@RequestBody MembershipPlanRequest request) {
        try {
            return ResponseEntity.ok(membershipPlanService.toResponse(membershipPlanService.createPlan(request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/plans/{id}")
    public ResponseEntity<?> updatePlan(@PathVariable Long id, @RequestBody MembershipPlanRequest request) {
        try {
            return ResponseEntity.ok(membershipPlanService.toResponse(membershipPlanService.updatePlan(id, request)));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/plans/{id}/status")
    public ResponseEntity<?> updatePlanStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(membershipPlanService.toResponse(membershipPlanService.updateStatus(id, body.get("status"))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<?> listOrders(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) Long userId,
                                        @RequestParam(required = false) String orderNo) {
        return ResponseEntity.ok(membershipOrderService.listAdminOrders(
                status,
                userId,
                orderNo,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
        ));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrder(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(membershipOrderService.getAdminOrder(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/grant")
    public ResponseEntity<?> grantMembership(@PathVariable Long id,
                                             @RequestBody AdminMembershipGrantRequest request,
                                             Authentication auth) {
        try {
            Long operatorId = userRepository.findByUsername((String) auth.getPrincipal()).map(user -> user.getId()).orElse(null);
            String reason = request.getReason() != null ? request.getReason() : "";
            if (reason.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "操作原因不能为空"));
            }
            String operation = request.getOperation() != null ? request.getOperation() : "";
            switch (operation) {
                case "EXTEND_DAYS" -> membershipService.addMembershipDays(id, request.getDays(), reason, operatorId);
                case "SET_EXPIRE_AT" -> membershipService.setMembershipExpireAt(id, request.getExpireAt(), reason, operatorId);
                case "PERMANENT" -> membershipService.setMembershipPermanent(id, reason, operatorId);
                default -> {
                    return ResponseEntity.badRequest().body(Map.of("error", "无效的会员操作"));
                }
            }
            return ResponseEntity.ok(Map.of("message", "会员状态已更新"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
