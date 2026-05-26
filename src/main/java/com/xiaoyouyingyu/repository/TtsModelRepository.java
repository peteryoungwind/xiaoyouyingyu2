package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.TtsModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TtsModelRepository extends JpaRepository<TtsModel, Long> {
    Optional<TtsModel> findByIsDefaultTrueAndEnabledTrue();
    List<TtsModel> findByEnabledTrueOrderByCreatedAtDesc();

    @Modifying
    @Query("UPDATE TtsModel t SET t.isDefault = false")
    void clearDefault();
}
