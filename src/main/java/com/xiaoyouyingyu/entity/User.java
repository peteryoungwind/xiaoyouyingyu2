package com.xiaoyouyingyu.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 50)
    private String username;

    private String password;

    @Column(name = "has_password", nullable = false)
    private boolean hasPassword = true;

    @Column(name = "wechat_openid", unique = true)
    private String wechatOpenid;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'USER'")
    private Role role = Role.USER;

    @Column(name = "membership_expire_at")
    private LocalDateTime membershipExpireAt;

    @Column(name = "membership_source", length = 30)
    private String membershipSource;

    @Column(name = "membership_updated_at")
    private LocalDateTime membershipUpdatedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Role { ADMIN, PREMIUM_USER, USER }

    public boolean isMembershipActive() {
        if (role == Role.ADMIN) return true;
        if (role == Role.PREMIUM_USER) return true;
        return membershipExpireAt != null && membershipExpireAt.isAfter(LocalDateTime.now());
    }
}
