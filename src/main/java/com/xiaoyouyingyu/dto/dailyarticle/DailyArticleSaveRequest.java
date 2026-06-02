package com.xiaoyouyingyu.dto.dailyarticle;

import com.xiaoyouyingyu.entity.DailyArticleStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class DailyArticleSaveRequest {
    @NotBlank(message = "英文标题不能为空")
    private String title;
    private String titleZh;
    private String audioUrl;
    private String summary;
    private String vocabulary;
    private String expressions;
    private DailyArticleStatus status = DailyArticleStatus.DRAFT;
    @Valid
    private List<DailyArticleParagraphRequest> paragraphs = new ArrayList<>();
}
