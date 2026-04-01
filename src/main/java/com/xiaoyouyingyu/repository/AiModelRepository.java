package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface AiModelRepository extends JpaRepository<AiModel, Long> {

    Optional<AiModel> findByIsDefaultTrue();

    @Modifying
    @Query("UPDATE AiModel m SET m.isDefault = false WHERE m.isDefault = true")
    void clearDefault();
}
