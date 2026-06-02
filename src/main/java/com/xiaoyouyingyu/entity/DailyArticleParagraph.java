package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "daily_article_paragraphs", indexes = {
        @Index(name = "idx_daily_article_paragraph_article_sort", columnList = "article_id,sort_order")
})
public class DailyArticleParagraph {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "article_id", nullable = false)
    private Long articleId;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 1;

    @Lob
    @Column(name = "content_en", columnDefinition = "TEXT")
    private String contentEn;

    @Lob
    @Column(name = "content_zh", columnDefinition = "TEXT")
    private String contentZh;
}
