package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.MembershipRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MembershipRecordRepository extends JpaRepository<MembershipRecord, Long> {
    List<MembershipRecord> findByUserIdOrderByCreatedAtDesc(Long userId);
}
