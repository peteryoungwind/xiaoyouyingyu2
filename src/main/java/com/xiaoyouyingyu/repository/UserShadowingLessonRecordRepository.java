package com.xiaoyouyingyu.repository;

import com.xiaoyouyingyu.entity.UserShadowingLessonRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserShadowingLessonRecordRepository extends JpaRepository<UserShadowingLessonRecord, Long> {
    Optional<UserShadowingLessonRecord> findByUserIdAndLessonId(Long userId, Long lessonId);

    boolean existsByUserIdAndLessonId(Long userId, Long lessonId);
}
