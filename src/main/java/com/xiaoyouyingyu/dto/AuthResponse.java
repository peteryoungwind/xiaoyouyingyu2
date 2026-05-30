package com.xiaoyouyingyu.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String membershipExpireAt;
    private boolean membershipActive;
    private boolean hasPassword;
    @JsonProperty("isAdmin")
    private boolean admin;
    @JsonProperty("isPremium")
    private boolean premium;

    public AuthResponse(String token, String username, String role, String membershipExpireAt, boolean membershipActive, boolean hasPassword) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.membershipExpireAt = membershipExpireAt;
        this.membershipActive = membershipActive;
        this.hasPassword = hasPassword;
        this.admin = "ADMIN".equals(role);
        this.premium = this.admin || membershipActive;
    }
}
