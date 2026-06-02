package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.AiDialogConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AiDialogConfigRepository extends JpaRepository<AiDialogConfig, Long> {
    Optional<AiDialogConfig> findTopByOrderByIdAsc();
}
