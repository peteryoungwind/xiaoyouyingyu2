package com.xiaoyouyingyu.dto.membership;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AdminMembershipGrantRequest {
    private String operation;
    private Integer days;
    private LocalDateTime expireAt;
    private Boolean permanent;
    private String reason;
}
