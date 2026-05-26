package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "word_book_topics",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_word_book_topic", columnNames = {"word_book_id", "topic_id"})
        }
)
public class WordBookTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "word_book_id", nullable = false)
    private WordBook wordBook;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
