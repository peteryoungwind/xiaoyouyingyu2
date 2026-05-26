package com.xiaoyouyingyu.service.wordpractice;

import com.xiaoyouyingyu.entity.UserWordProgress;
import com.xiaoyouyingyu.entity.UserWordStatus;
import com.xiaoyouyingyu.entity.WordPracticeResult;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class WordPracticeRuleTest {
    @Test
    void knownAnswerSchedulesReviewAndMastersAfterFourConsecutiveKnownAnswers() {
        UserWordProgress progress = new UserWordProgress();
        LocalDateTime now = LocalDateTime.of(2026, 5, 25, 10, 0);

        WordPracticeRule.apply(progress, WordPracticeResult.KNOWN, now);
        assertEquals(UserWordStatus.REVIEWING, progress.getStatus());
        assertEquals(1, progress.getConsecutiveKnownCount());
        assertEquals(now.plusDays(1), progress.getNextReviewAt());

        WordPracticeRule.apply(progress, WordPracticeResult.KNOWN, now.plusDays(1));
        assertEquals(now.plusDays(4), progress.getNextReviewAt());

        WordPracticeRule.apply(progress, WordPracticeResult.KNOWN, now.plusDays(4));
        assertEquals(now.plusDays(11), progress.getNextReviewAt());

        WordPracticeRule.apply(progress, WordPracticeResult.KNOWN, now.plusDays(11));
        assertEquals(UserWordStatus.MASTERED, progress.getStatus());
        assertNull(progress.getNextReviewAt());
        assertEquals(now.plusDays(11), progress.getMasteredAt());
    }

    @Test
    void unknownAnswerResetsConsecutiveKnownCountAndSchedulesTomorrow() {
        UserWordProgress progress = new UserWordProgress();
        progress.setConsecutiveKnownCount(2);
        LocalDateTime now = LocalDateTime.of(2026, 5, 25, 10, 0);

        WordPracticeRule.apply(progress, WordPracticeResult.UNKNOWN, now);

        assertEquals(UserWordStatus.REVIEWING, progress.getStatus());
        assertEquals(0, progress.getConsecutiveKnownCount());
        assertEquals(1, progress.getUnknownCount());
        assertEquals(now.plusDays(1), progress.getNextReviewAt());
    }
}
