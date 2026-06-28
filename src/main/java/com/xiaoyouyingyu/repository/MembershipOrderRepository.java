package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.MembershipOrder;
import com.xiaoyouyingyu.entity.MembershipOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MembershipOrderRepository extends JpaRepository<MembershipOrder, Long>, JpaSpecificationExecutor<MembershipOrder> {
    Optional<MembershipOrder> findByOrderNo(String orderNo);
    Optional<MembershipOrder> findByWechatTransactionId(String wechatTransactionId);
    Page<MembershipOrder> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    List<MembershipOrder> findByStatusAndExpiresAtBefore(MembershipOrderStatus status, LocalDateTime time);
}
