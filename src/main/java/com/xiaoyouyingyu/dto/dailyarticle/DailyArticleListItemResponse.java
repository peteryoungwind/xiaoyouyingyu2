package com.xiaoyouyingyu.dto.dailyarticle;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class DailyArticleListItemResponse {
    private Long id;
    private String title;
    private String titleZh;
    private LocalDate publishedDate;
    private Boolean read;
}
