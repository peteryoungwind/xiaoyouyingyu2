package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.MembershipPlan;
import com.xiaoyouyingyu.entity.MembershipPlanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MembershipPlanRepository extends JpaRepository<MembershipPlan, Long> {
    List<MembershipPlan> findByStatusOrderBySortOrderAscIdAsc(MembershipPlanStatus status);
    List<MembershipPlan> findAllByOrderBySortOrderAscIdAsc();
}
