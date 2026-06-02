package com.xiaoyouyingyu.dto.dailyarticle;

import com.xiaoyouyingyu.entity.DailyArticleStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminDailyArticleListItemResponse {
    private Long id;
    private String title;
    private String titleZh;
    private String audioUrl;
    private DailyArticleStatus status;
    private LocalDate publishedDate;
    private Boolean published;
    private Integer paragraphCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
