package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.DailyArticle;
import com.xiaoyouyingyu.entity.DailyArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface DailyArticleRepository extends JpaRepository<DailyArticle, Long> {
    boolean existsByPublishedDate(LocalDate publishedDate);

    @Query("""
            select a from DailyArticle a
            where a.publishedDate is not null
              and (:read is null
                or (:read = true and exists (
                    select r.id from DailyArticleRead r
                    where r.articleId = a.id and r.userId = :userId
                ))
                or (:read = false and not exists (
                    select r.id from DailyArticleRead r
                    where r.articleId = a.id and r.userId = :userId
                ))
              )
            order by a.publishedDate desc, a.id desc
            """)
    Page<DailyArticle> findPublishedByReadStatus(@Param("userId") Long userId,
                                                 @Param("read") Boolean read,
                                                 Pageable pageable);

    List<DailyArticle> findByStatusAndPublishedDateIsNull(DailyArticleStatus status);

    @Query("""
            select a from DailyArticle a
            where (:status is null or a.status = :status)
              and (:published is null
                or (:published = true and a.publishedDate is not null)
                or (:published = false and a.publishedDate is null))
            order by a.updatedAt desc, a.id desc
            """)
    Page<DailyArticle> searchAdmin(@Param("status") DailyArticleStatus status,
                                   @Param("published") Boolean published,
                                   Pageable pageable);
}
