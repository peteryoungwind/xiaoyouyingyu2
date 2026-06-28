package com.xiaoyouyingyu.dto.membership;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class CreateMembershipOrderResponse {
    private String orderNo;
    private LocalDateTime expiresAt;
    private Map<String, String> paymentParams;
}
