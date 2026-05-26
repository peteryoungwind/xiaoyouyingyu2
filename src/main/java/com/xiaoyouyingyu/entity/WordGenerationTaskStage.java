package com.xiaoyouyingyu.entity;

public enum WordGenerationTaskStage {
    PENDING,
    GENERATING_WORDS,
    SAVING_WORDS,
    GENERATING_AUDIO,
    COMPLETED,
    FAILED
}
