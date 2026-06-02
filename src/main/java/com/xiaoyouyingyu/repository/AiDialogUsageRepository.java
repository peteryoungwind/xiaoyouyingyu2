package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.AiDialogUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.Optional;

public interface AiDialogUsageRepository extends JpaRepository<AiDialogUsage, Long> {
    Optional<AiDialogUsage> findByUserIdAndUsageDate(Long userId, LocalDate usageDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM AiDialogUsage u WHERE u.userId = :userId AND u.usageDate = :usageDate")
    Optional<AiDialogUsage> findWithLockByUserIdAndUsageDate(@Param("userId") Long userId, @Param("usageDate") LocalDate usageDate);
}
