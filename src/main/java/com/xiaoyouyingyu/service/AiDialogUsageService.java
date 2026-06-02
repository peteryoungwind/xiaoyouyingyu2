package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.AiDialogUsage;
import com.xiaoyouyingyu.repository.AiDialogUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class AiDialogUsageService {
    private static final ZoneId CHINA_ZONE = ZoneId.of("Asia/Shanghai");

    private final AiDialogUsageRepository repository;

    public int getTodayCount(Long userId) {
        return repository.findByUserIdAndUsageDate(userId, today())
                .map(AiDialogUsage::getMessageCount)
                .orElse(0);
    }

    public int remainingToday(Long userId, int dailyLimit) {
        return Math.max(0, dailyLimit - getTodayCount(userId));
    }

    public void ensureQuota(Long userId, int dailyLimit) {
        if (remainingToday(userId, dailyLimit) <= 0) {
            throw new AiDialogQuotaExceededException("今日 AI 对话额度已用尽");
        }
    }

    @Transactional
    public int incrementAfterSuccess(Long userId, int dailyLimit) {
        LocalDate usageDate = today();
        AiDialogUsage usage = repository.findWithLockByUserIdAndUsageDate(userId, usageDate)
                .orElseGet(() -> {
                    AiDialogUsage created = new AiDialogUsage();
                    created.setUserId(userId);
                    created.setUsageDate(usageDate);
                    created.setMessageCount(0);
                    return created;
                });
        if (usage.getMessageCount() >= dailyLimit) {
            throw new AiDialogQuotaExceededException("今日 AI 对话额度已用尽");
        }
        usage.setMessageCount(usage.getMessageCount() + 1);
        repository.save(usage);
        return Math.max(0, dailyLimit - usage.getMessageCount());
    }

    private static LocalDate today() {
        return LocalDate.now(CHINA_ZONE);
    }

    public static class AiDialogQuotaExceededException extends RuntimeException {
        public AiDialogQuotaExceededException(String message) {
            super(message);
        }
    }
}
