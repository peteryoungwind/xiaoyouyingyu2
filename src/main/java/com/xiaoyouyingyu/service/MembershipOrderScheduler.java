package com.xiaoyouyingyu.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MembershipOrderScheduler {
    private final MembershipOrderService membershipOrderService;

    @Scheduled(fixedDelay = 60_000)
    public void closeExpiredOrders() {
        membershipOrderService.closeExpiredOrders();
    }
}
