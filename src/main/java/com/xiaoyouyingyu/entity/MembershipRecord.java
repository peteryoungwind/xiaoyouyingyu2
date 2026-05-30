package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "membership_records")
public class MembershipRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "change_type", nullable = false, length = 30)
    private String changeType;

    private Integer days;

    @Column(name = "before_expire_at")
    private LocalDateTime beforeExpireAt;

    @Column(name = "after_expire_at")
    private LocalDateTime afterExpireAt;

    @Column(name = "related_code_id")
    private Long relatedCodeId;

    @Column(name = "operator_id")
    private Long operatorId;

    @Column(length = 255)
    private String remark;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
