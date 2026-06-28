package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.xiaoyouyingyu.dto.membership.MembershipPlanRequest;
import com.xiaoyouyingyu.dto.membership.MembershipPlanResponse;
import com.xiaoyouyingyu.entity.MembershipPlan;
import com.xiaoyouyingyu.entity.MembershipPlanStatus;
import com.xiaoyouyingyu.repository.MembershipPlanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MembershipPlanService {
    private final MembershipPlanRepository membershipPlanRepository;
    private final ObjectMapper objectMapper;

    public List<MembershipPlanResponse> listAdminPlans() {
        return membershipPlanRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<MembershipPlanResponse> listActivePlans() {
        return membershipPlanRepository.findByStatusOrderBySortOrderAscIdAsc(MembershipPlanStatus.ACTIVE).stream()
                .map(this::toResponse)
                .toList();
    }

    public MembershipPlan createPlan(MembershipPlanRequest request) {
        MembershipPlan plan = new MembershipPlan();
        applyRequest(plan, request);
        return membershipPlanRepository.save(plan);
    }

    public MembershipPlan updatePlan(Long id, MembershipPlanRequest request) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("套餐不存在"));
        applyRequest(plan, request);
        return membershipPlanRepository.save(plan);
    }

    public MembershipPlan updateStatus(Long id, String status) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("套餐不存在"));
        plan.setStatus(parseStatus(status));
        return membershipPlanRepository.save(plan);
    }

    public MembershipPlan getPurchasablePlan(Long id) {
        MembershipPlan plan = membershipPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("套餐不存在"));
        if (plan.getStatus() != MembershipPlanStatus.ACTIVE) {
            throw new RuntimeException("套餐已下架");
        }
        return plan;
    }

    public MembershipPlanResponse toResponse(MembershipPlan plan) {
        return MembershipPlanResponse.from(plan, calculateEffectivePriceCents(plan), isDiscountActive(plan));
    }

    public int calculateEffectivePriceCents(MembershipPlan plan) {
        return plan.getSalePriceCents() != null ? plan.getSalePriceCents() : 0;
    }

    public boolean isDiscountActive(MembershipPlan plan) {
        LocalDateTime now = LocalDateTime.now();
        return plan.getDiscountStartAt() != null
                && plan.getDiscountEndAt() != null
                && !now.isBefore(plan.getDiscountStartAt())
                && now.isBefore(plan.getDiscountEndAt());
    }

    public String buildSnapshotJson(MembershipPlan plan, int effectivePriceCents) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("id", plan.getId());
        snapshot.put("name", plan.getName());
        snapshot.put("description", plan.getDescription());
        snapshot.put("originalPriceCents", plan.getOriginalPriceCents());
        snapshot.put("salePriceCents", plan.getSalePriceCents());
        snapshot.put("effectivePriceCents", effectivePriceCents);
        snapshot.put("durationDays", plan.getDurationDays());
        snapshot.put("permanent", plan.isPermanent());
        snapshot.put("discountStartAt", plan.getDiscountStartAt());
        snapshot.put("discountEndAt", plan.getDiscountEndAt());
        try {
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("套餐快照生成失败");
        }
    }

    private void applyRequest(MembershipPlan plan, MembershipPlanRequest request) {
        validate(request);
        plan.setName(request.getName().trim());
        plan.setDescription(request.getDescription());
        plan.setOriginalPriceCents(request.getOriginalPriceCents());
        plan.setSalePriceCents(request.getSalePriceCents());
        plan.setPermanent(request.isPermanent());
        plan.setDurationDays(request.isPermanent() ? null : request.getDurationDays());
        plan.setDiscountStartAt(request.getDiscountStartAt());
        plan.setDiscountEndAt(request.getDiscountEndAt());
        plan.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        plan.setStatus(parseStatus(request.getStatus()));
    }

    private void validate(MembershipPlanRequest request) {
        if (request.getName() == null || request.getName().isBlank()) {
            throw new RuntimeException("套餐名称不能为空");
        }
        if (request.getOriginalPriceCents() == null || request.getOriginalPriceCents() < 0) {
            throw new RuntimeException("原价不能小于0");
        }
        if (request.getSalePriceCents() == null || request.getSalePriceCents() < 0) {
            throw new RuntimeException("现价不能小于0");
        }
        if (request.getOriginalPriceCents() < request.getSalePriceCents()) {
            throw new RuntimeException("原价不能小于现价");
        }
        if (!request.isPermanent() && (request.getDurationDays() == null || request.getDurationDays() <= 0)) {
            throw new RuntimeException("普通套餐会员天数必须大于0");
        }
        if (request.getDiscountStartAt() != null && request.getDiscountEndAt() != null
                && !request.getDiscountEndAt().isAfter(request.getDiscountStartAt())) {
            throw new RuntimeException("折扣结束时间必须晚于开始时间");
        }
    }

    private MembershipPlanStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return MembershipPlanStatus.INACTIVE;
        }
        try {
            return MembershipPlanStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("无效的套餐状态");
        }
    }
}
