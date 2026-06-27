package com.xiaoyouyingyu.dto.shadowing;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ShadowingLessonListItemResponse {
    private Long id;
    private String title;
    private String titleZh;
    private String description;
    private String episodeNo;
    private String category;
    private String topic;
    private String sourceName;
    private String thumbnailUrl;
    private LocalDate publishedDate;
    private Integer sentenceCount;
    private Integer expressionCount;
    private Boolean learned;
}
