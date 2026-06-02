package com.xiaoyouyingyu.dto.dailyarticle;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DailyArticlePublishResponse {
    private String message;
    private Long articleId;
    private LocalDate publishedDate;
}
