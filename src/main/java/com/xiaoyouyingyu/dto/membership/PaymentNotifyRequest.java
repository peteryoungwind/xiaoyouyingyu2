package com.xiaoyouyingyu.dto.membership;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentNotifyRequest {
    private String orderNo;
    private String transactionId;
    private String tradeState;
    private Integer amountCents;
    private LocalDateTime paidAt;
}
