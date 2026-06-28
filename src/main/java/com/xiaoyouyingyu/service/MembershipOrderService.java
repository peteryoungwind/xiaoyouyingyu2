package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.config.WechatPayProperties;
import com.xiaoyouyingyu.dto.membership.CreateMembershipOrderResponse;
import com.xiaoyouyingyu.dto.membership.MembershipOrderResponse;
import com.xiaoyouyingyu.entity.*;
import com.xiaoyouyingyu.repository.MembershipOrderRepository;
import com.xiaoyouyingyu.repository.MembershipPlanRepository;
import com.xiaoyouyingyu.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MembershipOrderService {
    private final MembershipOrderRepository membershipOrderRepository;
    private final UserRepository userRepository;
    private final MembershipPlanService membershipPlanService;
    private final MembershipPlanRepository membershipPlanRepository;
    private final MembershipService membershipService;
    private final WechatPayService wechatPayService;
    private final WechatPayProperties wechatPayProperties;

    @Transactional
    public CreateMembershipOrderResponse createOrder(String username, Long planId) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("用户不存在"));
        if (user.getWechatOpenid() == null || user.getWechatOpenid().isBlank()) {
            throw new RuntimeException("当前账号未绑定微信，请重新使用微信登录");
        }
        MembershipPlan plan = membershipPlanService.getPurchasablePlan(planId);
        int amountCents = membershipPlanService.calculateEffectivePriceCents(plan);
        String orderNo = buildOrderNo();

        MembershipOrder order = new MembershipOrder();
        order.setOrderNo(orderNo);
        order.setUserId(user.getId());
        order.setPlanId(plan.getId());
        order.setAmountCents(amountCents);
        order.setPlanSnapshotJson(membershipPlanService.buildSnapshotJson(plan, amountCents));
        order.setExpiresAt(LocalDateTime.now().plusMinutes(wechatPayProperties.getOrderExpireMinutes()));
        membershipOrderRepository.save(order);

        Map<String, String> paymentParams = wechatPayService.createPaymentParams(order, user.getWechatOpenid(), "小柚英语会员-" + plan.getName());
        String pkg = paymentParams.getOrDefault("package", "");
        if (pkg.startsWith("prepay_id=")) {
            order.setWechatPrepayId(pkg.substring("prepay_id=".length()));
        }
        membershipOrderRepository.save(order);

        return CreateMembershipOrderResponse.builder()
                .orderNo(order.getOrderNo())
                .expiresAt(order.getExpiresAt())
                .paymentParams(paymentParams)
                .build();
    }

    public MembershipOrderResponse getUserOrder(String username, String orderNo) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("用户不存在"));
        MembershipOrder order = membershipOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        if (!order.getUserId().equals(user.getId())) {
            throw new RuntimeException("无权查看该订单");
        }
        closeIfExpired(order);
        return MembershipOrderResponse.from(order, user.getUsername());
    }

    public Page<MembershipOrderResponse> listAdminOrders(String status, Long userId, String orderNo, Pageable pageable) {
        Specification<MembershipOrder> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), MembershipOrderStatus.valueOf(status)));
            }
            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), userId));
            }
            if (orderNo != null && !orderNo.isBlank()) {
                predicates.add(cb.like(root.get("orderNo"), "%" + orderNo.trim() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return membershipOrderRepository.findAll(spec, pageable)
                .map(order -> MembershipOrderResponse.from(order, usernameFor(order.getUserId())));
    }

    public MembershipOrderResponse getAdminOrder(Long id) {
        MembershipOrder order = membershipOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("订单不存在"));
        return MembershipOrderResponse.from(order, usernameFor(order.getUserId()));
    }

    @Transactional
    public MembershipOrder markPaid(String orderNo, String transactionId, String tradeState, Integer amountCents, Instant paidAt) {
        MembershipOrder order = membershipOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        if (order.getStatus() == MembershipOrderStatus.PAID) {
            return order;
        }
        if (order.getAmountCents() == null || !order.getAmountCents().equals(amountCents)) {
            order.setFailureReason("支付金额不一致");
            order.setStatus(MembershipOrderStatus.FAILED);
            return membershipOrderRepository.save(order);
        }
        if (!"SUCCESS".equalsIgnoreCase(tradeState) && !"PAID".equalsIgnoreCase(tradeState)) {
            order.setWechatTradeState(tradeState);
            order.setFailureReason("支付状态不是成功");
            order.setStatus(MembershipOrderStatus.FAILED);
            return membershipOrderRepository.save(order);
        }

        MembershipPlan plan = membershipPlanRepository.findById(order.getPlanId())
                .orElseThrow(() -> new RuntimeException("订单套餐不存在"));
        order.setStatus(MembershipOrderStatus.PAID);
        order.setWechatTransactionId(transactionId);
        order.setWechatTradeState(tradeState);
        order.setPaidAt(LocalDateTime.ofInstant(paidAt != null ? paidAt : Instant.now(), ZoneId.systemDefault()));

        membershipService.grantMembership(
                order.getUserId(),
                plan.getDurationDays(),
                plan.isPermanent(),
                "WECHAT_PAY",
                order.getOrderNo(),
                plan.isPermanent() ? "WECHAT_PAY_PERMANENT" : "WECHAT_PAY_EXTEND",
                "微信支付购买套餐: " + plan.getName(),
                null
        );
        order.setMembershipGrantedAt(LocalDateTime.now());
        return membershipOrderRepository.save(order);
    }

    @Transactional
    public void closeExpiredOrders() {
        var expired = membershipOrderRepository.findByStatusAndExpiresAtBefore(MembershipOrderStatus.PENDING, LocalDateTime.now());
        expired.forEach(order -> {
            order.setStatus(MembershipOrderStatus.CLOSED);
            membershipOrderRepository.save(order);
        });
    }

    @Transactional
    public MembershipOrder mockPaid(String orderNo) {
        if (!wechatPayService.isMockEnabled()) {
            throw new RuntimeException("模拟支付未启用");
        }
        MembershipOrder order = membershipOrderRepository.findByOrderNo(orderNo)
                .orElseThrow(() -> new RuntimeException("订单不存在"));
        return markPaid(orderNo, "mock_txn_" + UUID.randomUUID().toString().replace("-", ""), "SUCCESS", order.getAmountCents(), Instant.now());
    }

    private void closeIfExpired(MembershipOrder order) {
        if (order.getStatus() == MembershipOrderStatus.PENDING && order.getExpiresAt().isBefore(LocalDateTime.now())) {
            order.setStatus(MembershipOrderStatus.CLOSED);
            membershipOrderRepository.save(order);
        }
    }

    private String buildOrderNo() {
        return "M" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss").format(LocalDateTime.now())
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private String usernameFor(Long userId) {
        return userRepository.findById(userId).map(User::getUsername).orElse("-");
    }
}
