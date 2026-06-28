package com.xiaoyouyingyu.dto.membership;

import com.xiaoyouyingyu.entity.MembershipPlan;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MembershipPlanResponse {
    private Long id;
    private String name;
    private String description;
    private Integer originalPriceCents;
    private Integer salePriceCents;
    private Integer effectivePriceCents;
    private Integer durationDays;
    private boolean permanent;
    private LocalDateTime discountStartAt;
    private LocalDateTime discountEndAt;
    private boolean discountActive;
    private String status;
    private Integer sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MembershipPlanResponse from(MembershipPlan plan, int effectivePriceCents, boolean discountActive) {
        return MembershipPlanResponse.builder()
                .id(plan.getId())
                .name(plan.getName())
                .description(plan.getDescription())
                .originalPriceCents(plan.getOriginalPriceCents())
                .salePriceCents(plan.getSalePriceCents())
                .effectivePriceCents(effectivePriceCents)
                .durationDays(plan.getDurationDays())
                .permanent(plan.isPermanent())
                .discountStartAt(plan.getDiscountStartAt())
                .discountEndAt(plan.getDiscountEndAt())
                .discountActive(discountActive)
                .status(plan.getStatus().name())
                .sortOrder(plan.getSortOrder())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }
}
