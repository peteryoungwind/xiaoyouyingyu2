package com.xiaoyouyingyu.dto.membership;

import com.xiaoyouyingyu.entity.MembershipOrder;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MembershipOrderResponse {
    private Long id;
    private String orderNo;
    private Long userId;
    private String username;
    private Long planId;
    private String planSnapshotJson;
    private Integer amountCents;
    private String status;
    private String wechatPrepayId;
    private String wechatTransactionId;
    private String wechatTradeState;
    private LocalDateTime paidAt;
    private LocalDateTime expiresAt;
    private LocalDateTime membershipGrantedAt;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MembershipOrderResponse from(MembershipOrder order, String username) {
        return MembershipOrderResponse.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .userId(order.getUserId())
                .username(username)
                .planId(order.getPlanId())
                .planSnapshotJson(order.getPlanSnapshotJson())
                .amountCents(order.getAmountCents())
                .status(order.getStatus().name())
                .wechatPrepayId(order.getWechatPrepayId())
                .wechatTransactionId(order.getWechatTransactionId())
                .wechatTradeState(order.getWechatTradeState())
                .paidAt(order.getPaidAt())
                .expiresAt(order.getExpiresAt())
                .membershipGrantedAt(order.getMembershipGrantedAt())
                .failureReason(order.getFailureReason())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
