package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "word_topics",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_word_topic", columnNames = {"word_id", "topic_id"})
        },
        indexes = {
                @Index(name = "idx_word_topics_topic", columnList = "topic_id")
        }
)
public class WordTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "topic_title_en", length = 200)
    private String topicTitleEn;

    @Column(name = "topic_title_zh", length = 200)
    private String topicTitleZh;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
