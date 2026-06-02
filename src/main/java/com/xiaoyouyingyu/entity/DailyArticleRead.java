package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "daily_article_reads", uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_article_read_user_article", columnNames = {"article_id", "user_id"})
}, indexes = {
        @Index(name = "idx_daily_article_read_user", columnList = "user_id")
})
public class DailyArticleRead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "article_id", nullable = false)
    private Long articleId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "read_at", nullable = false, updatable = false)
    private LocalDateTime readAt = LocalDateTime.now();
}
