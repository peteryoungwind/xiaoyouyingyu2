package com.xiaoyouyingyu.dto.dailyarticle;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class DailyArticleDetailResponse {
    private Long id;
    private String title;
    private String titleZh;
    private String audioUrl;
    private String summary;
    private String vocabulary;
    private String expressions;
    private LocalDate publishedDate;
    private Boolean read;
    private List<DailyArticleParagraphResponse> paragraphs;
}
