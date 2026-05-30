package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.RedeemCode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RedeemCodeRepository extends JpaRepository<RedeemCode, Long> {
    Optional<RedeemCode> findByCode(String code);
    Page<RedeemCode> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<RedeemCode> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
