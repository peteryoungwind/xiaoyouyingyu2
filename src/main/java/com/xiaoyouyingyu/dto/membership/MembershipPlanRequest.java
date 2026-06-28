package com.xiaoyouyingyu.dto.membership;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MembershipPlanRequest {
    private String name;
    private String description;
    private Integer originalPriceCents;
    private Integer salePriceCents;
    private Integer durationDays;
    private boolean permanent;
    private LocalDateTime discountStartAt;
    private LocalDateTime discountEndAt;
    private String status;
    private Integer sortOrder;
}
