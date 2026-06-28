package com.xiaoyouyingyu.service;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MembershipGrantResult {
    private Long userId;
    private boolean membershipActive;
    private boolean membershipPermanent;
    private LocalDateTime beforeExpireAt;
    private LocalDateTime afterExpireAt;
    private boolean beforePermanent;
    private boolean afterPermanent;
    private Integer daysAdded;
}
