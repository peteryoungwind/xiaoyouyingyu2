package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.ShadowingLesson;
import com.xiaoyouyingyu.entity.ShadowingLessonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ShadowingLessonRepository extends JpaRepository<ShadowingLesson, Long> {
    Optional<ShadowingLesson> findByIdAndStatus(Long id, ShadowingLessonStatus status);

    Optional<ShadowingLesson> findBySourceUrl(String sourceUrl);

    Optional<ShadowingLesson> findByEpisodeNoAndCategory(String episodeNo, String category);

    @Query("""
            select l from ShadowingLesson l
            where l.status = com.xiaoyouyingyu.entity.ShadowingLessonStatus.PUBLISHED
              and (:userId is null
                or :learned is null
                or (:learned = true and exists (
                    select r.id from UserShadowingLessonRecord r
                    where r.lessonId = l.id and r.userId = :userId
                ))
                or (:learned = false and not exists (
                    select r.id from UserShadowingLessonRecord r
                    where r.lessonId = l.id and r.userId = :userId
                ))
              )
            order by l.publishedDate desc, l.id desc
            """)
    Page<ShadowingLesson> findPublishedForUser(@Param("userId") Long userId,
                                               @Param("learned") Boolean learned,
                                               Pageable pageable);
}
