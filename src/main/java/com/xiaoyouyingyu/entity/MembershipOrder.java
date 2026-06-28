package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "membership_orders", indexes = {
        @Index(name = "idx_membership_orders_user_created", columnList = "user_id,created_at"),
        @Index(name = "idx_membership_orders_status_expires", columnList = "status,expires_at")
})
public class MembershipOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_no", nullable = false, unique = true, length = 64)
    private String orderNo;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "plan_id", nullable = false)
    private Long planId;

    @Lob
    @Column(name = "plan_snapshot_json", nullable = false, columnDefinition = "TEXT")
    private String planSnapshotJson;

    @Column(name = "amount_cents", nullable = false)
    private Integer amountCents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipOrderStatus status = MembershipOrderStatus.PENDING;

    @Column(name = "wechat_prepay_id", length = 128)
    private String wechatPrepayId;

    @Column(name = "wechat_transaction_id", unique = true, length = 128)
    private String wechatTransactionId;

    @Column(name = "wechat_trade_state", length = 50)
    private String wechatTradeState;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "membership_granted_at")
    private LocalDateTime membershipGrantedAt;

    @Column(name = "failure_reason", length = 1000)
    private String failureReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
