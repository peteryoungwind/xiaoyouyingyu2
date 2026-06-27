package com.xiaoyouyingyu.dto.shadowing;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ShadowingLessonDetailResponse {
    private Long id;
    private String title;
    private String titleZh;
    private String description;
    private String episodeNo;
    private String category;
    private String topic;
    private String sourceName;
    private String sourceUrl;
    private String thumbnailUrl;
    private String videoUrl;
    private String audioUrl;
    private LocalDate publishedDate;
    private Integer sentenceCount;
    private Integer expressionCount;
    private Boolean previewOnly;
    private Boolean learned;
    private JsonNode content;
}
