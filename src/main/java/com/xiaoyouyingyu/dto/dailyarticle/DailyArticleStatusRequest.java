package com.xiaoyouyingyu.dto.dailyarticle;

import com.xiaoyouyingyu.entity.DailyArticleStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DailyArticleStatusRequest {
    @NotNull(message = "状态不能为空")
    private DailyArticleStatus status;
}
