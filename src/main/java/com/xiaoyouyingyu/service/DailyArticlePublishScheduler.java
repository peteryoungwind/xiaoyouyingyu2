package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.dto.dailyarticle.DailyArticlePublishResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DailyArticlePublishScheduler {
    private final DailyArticleService dailyArticleService;

    @Scheduled(cron = "0 0 6 * * *", zone = "Asia/Shanghai")
    public void publishDailyArticle() {
        DailyArticlePublishResponse response = dailyArticleService.publishToday();
        log.info("Daily article publish task finished: message={}, articleId={}, publishedDate={}",
                response.getMessage(), response.getArticleId(), response.getPublishedDate());
    }
}
