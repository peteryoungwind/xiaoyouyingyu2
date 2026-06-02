package com.xiaoyouyingyu.dto.dailyarticle;

import lombok.Data;

@Data
public class DailyArticleParagraphRequest {
    private Integer sortOrder;
    private String contentEn;
    private String contentZh;
}
