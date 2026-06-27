package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_shadowing_lesson_records",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_shadowing_lesson", columnNames = {"user_id", "lesson_id"}),
        indexes = {
                @Index(name = "idx_user_shadowing_user", columnList = "user_id"),
                @Index(name = "idx_user_shadowing_lesson", columnList = "lesson_id")
        })
public class UserShadowingLessonRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "first_opened_at", nullable = false, updatable = false)
    private LocalDateTime firstOpenedAt = LocalDateTime.now();

    @Column(name = "last_opened_at", nullable = false)
    private LocalDateTime lastOpenedAt = LocalDateTime.now();
}
