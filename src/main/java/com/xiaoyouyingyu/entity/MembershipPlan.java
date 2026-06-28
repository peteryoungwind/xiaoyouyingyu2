package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "membership_plans")
public class MembershipPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "original_price_cents", nullable = false)
    private Integer originalPriceCents = 0;

    @Column(name = "sale_price_cents", nullable = false)
    private Integer salePriceCents = 0;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "is_permanent", nullable = false)
    private boolean permanent = false;

    @Column(name = "discount_start_at")
    private LocalDateTime discountStartAt;

    @Column(name = "discount_end_at")
    private LocalDateTime discountEndAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipPlanStatus status = MembershipPlanStatus.INACTIVE;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
