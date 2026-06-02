package com.xiaoyouyingyu.dto.dailyarticle;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DailyArticleParagraphResponse {
    private Long id;
    private Integer sortOrder;
    private String contentEn;
    private String contentZh;
}
