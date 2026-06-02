package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.DailyArticleParagraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DailyArticleParagraphRepository extends JpaRepository<DailyArticleParagraph, Long> {
    List<DailyArticleParagraph> findByArticleIdOrderBySortOrderAscIdAsc(Long articleId);
    long countByArticleId(Long articleId);
    void deleteByArticleId(Long articleId);
}
