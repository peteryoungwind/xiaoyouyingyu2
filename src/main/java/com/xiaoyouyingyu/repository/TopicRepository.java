package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.Topic;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {

    @Query("SELECT MIN(t.eventDate) FROM Topic t")
    Optional<LocalDate> findEarliestEventDate();

    @Query("SELECT t FROM Topic t WHERE t.eventDate BETWEEN :start AND :end ORDER BY t.eventDate")
    List<Topic> findByEventDateBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT t FROM Topic t WHERE " +
           "(:keyword IS NULL OR t.title LIKE %:keyword% OR t.titleZh LIKE %:keyword% OR t.questions LIKE %:keyword%) " +
           "AND (:tag IS NULL OR t.tags LIKE %:tag%) " +
           "AND (:startDate IS NULL OR t.eventDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.eventDate <= :endDate)")
    Page<Topic> search(@Param("keyword") String keyword,
                       @Param("tag") String tag,
                       @Param("startDate") LocalDate startDate,
                       @Param("endDate") LocalDate endDate,
                       Pageable pageable);
}
