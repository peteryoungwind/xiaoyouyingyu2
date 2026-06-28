package com.xiaoyouyingyu.dto.membership;

import com.xiaoyouyingyu.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@Builder
public class MembershipStatusResponse {
    private String role;
    private boolean membershipActive;
    private LocalDateTime membershipExpireAt;
    private boolean membershipPermanent;
    private long remainingDays;
    private String membershipSource;
    private boolean isAdmin;

    public static MembershipStatusResponse from(User user) {
        LocalDateTime now = LocalDateTime.now();
        long remainingDays = 0;
        if (user.getMembershipExpireAt() != null && user.getMembershipExpireAt().isAfter(now)) {
            remainingDays = ChronoUnit.DAYS.between(now, user.getMembershipExpireAt());
        }
        return MembershipStatusResponse.builder()
                .role(user.getRole().name())
                .membershipActive(user.isMembershipActive())
                .membershipExpireAt(user.getMembershipExpireAt())
                .membershipPermanent(user.isMembershipPermanent())
                .remainingDays(remainingDays)
                .membershipSource(user.getMembershipSource() != null ? user.getMembershipSource() : "")
                .isAdmin(user.getRole() == User.Role.ADMIN)
                .build();
    }
}
