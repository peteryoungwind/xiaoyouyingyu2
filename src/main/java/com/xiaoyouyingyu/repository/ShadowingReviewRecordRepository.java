package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.ShadowingReviewRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShadowingReviewRecordRepository extends JpaRepository<ShadowingReviewRecord, Long> {
    Optional<ShadowingReviewRecord> findFirstByUserIdAndLessonIdAndSentenceIndexOrderByCreatedAtDesc(Long userId, Long lessonId, Integer sentenceIndex);
}
