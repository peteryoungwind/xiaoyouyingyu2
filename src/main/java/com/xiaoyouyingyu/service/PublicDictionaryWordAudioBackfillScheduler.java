package com.xiaoyouyingyu.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublicDictionaryWordAudioBackfillScheduler {
    private final PublicDictionaryWordAudioService publicDictionaryWordAudioService;

    @Value("${app.word-audio.public-source.enabled:true}")
    private boolean enabled;

    @Scheduled(
            initialDelayString = "${app.word-audio.public-source.initial-delay-ms:30000}",
            fixedDelayString = "${app.word-audio.public-source.delay-ms:5000}"
    )
    public void backfillOneWordAudio() {
        if (!enabled) {
            return;
        }

        PublicDictionaryWordAudioService.BackfillResult result = publicDictionaryWordAudioService.backfillOneMissingWord();
        switch (result.getStatus()) {
            case "UPDATED" -> log.info("Public dictionary audio backfilled: wordId={}, word={}, us={}, uk={}",
                    result.getWordId(), result.getWord(), result.getAudioUsUrl(), result.getAudioUkUrl());
            case "RATE_LIMITED" -> log.warn("Public dictionary audio backfill rate limited: wordId={}, word={}, blockedUntil={}",
                    result.getWordId(), result.getWord(), result.getBlockedUntil());
            case "FAILED" -> log.warn("Public dictionary audio backfill failed: wordId={}, word={}, error={}",
                    result.getWordId(), result.getWord(), result.getError());
            default -> {
            }
        }
    }
}
