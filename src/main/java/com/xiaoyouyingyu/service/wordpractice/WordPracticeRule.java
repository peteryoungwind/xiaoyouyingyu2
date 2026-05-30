package com.xiaoyouyingyu.service.wordpractice;

import com.xiaoyouyingyu.entity.UserWordProgress;
import com.xiaoyouyingyu.entity.UserWordStatus;
import com.xiaoyouyingyu.entity.WordPracticeResult;
import java.time.LocalDateTime;

public final class WordPracticeRule {
    private WordPracticeRule() {}

    public static void apply(UserWordProgress progress, WordPracticeResult result, LocalDateTime now) {
        progress.setStudyCount(progress.getStudyCount() + 1);
        if (progress.getFirstStudiedAt() == null) {
            progress.setFirstStudiedAt(now);
        }
        progress.setLastPracticedAt(now);

        if (result == WordPracticeResult.KNOWN) {
            int consecutive = progress.getConsecutiveKnownCount() + 1;
            progress.setKnownCount(progress.getKnownCount() + 1);
            progress.setConsecutiveKnownCount(consecutive);
            if (consecutive >= 4) {
                progress.setStatus(UserWordStatus.MASTERED);
                progress.setMasteredAt(now);
                progress.setNextReviewAt(null);
            } else {
                progress.setStatus(UserWordStatus.REVIEWING);
                progress.setNextReviewAt(now.plusDays(intervalDays(consecutive)));
            }
            return;
        }

        progress.setUnknownCount(progress.getUnknownCount() + 1);
        progress.setConsecutiveKnownCount(0);
        progress.setStatus(UserWordStatus.REVIEWING);
        progress.setNextReviewAt(now.plusDays(1));
    }

    private static int intervalDays(int consecutiveKnownCount) {
        return switch (consecutiveKnownCount) {
            case 1 -> 1;
            case 2 -> 3;
            case 3 -> 7;
            default -> 15;
        };
    }
}
