package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.DailyArticleRead;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyArticleReadRepository extends JpaRepository<DailyArticleRead, Long> {
    boolean existsByArticleIdAndUserId(Long articleId, Long userId);
    void deleteByArticleId(Long articleId);
}
