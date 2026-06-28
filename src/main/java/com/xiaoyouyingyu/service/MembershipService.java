package com.xiaoyouyingyu.service;

import com.xiaoyouyingyu.entity.MembershipRecord;
import com.xiaoyouyingyu.entity.RedeemCode;
import com.xiaoyouyingyu.entity.User;
import com.xiaoyouyingyu.repository.MembershipRecordRepository;
import com.xiaoyouyingyu.repository.RedeemCodeRepository;
import com.xiaoyouyingyu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MembershipService {
    private final UserRepository userRepository;
    private final RedeemCodeRepository redeemCodeRepository;
    private final MembershipRecordRepository membershipRecordRepository;

    public void grantRegistrationGift(User user) {
        LocalDateTime now = LocalDateTime.now();
        user.setMembershipExpireAt(now.plusDays(3));
        user.setMembershipPermanent(false);
        user.setMembershipSource("REGISTER_GIFT");
        user.setMembershipUpdatedAt(now);
        userRepository.save(user);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(user.getId());
        record.setChangeType("REGISTER_GIFT");
        record.setSource("REGISTER_GIFT");
        record.setDays(3);
        record.setBeforeExpireAt(null);
        record.setAfterExpireAt(user.getMembershipExpireAt());
        record.setBeforePermanent(false);
        record.setAfterPermanent(false);
        record.setRemark("新用户注册赠送3天会员");
        membershipRecordRepository.save(record);
    }

    public boolean isActiveMember(User user) {
        return user != null && user.isMembershipActive();
    }

    @Transactional
    public MembershipGrantResult grantMembership(Long userId,
                                                 Integer durationDays,
                                                 boolean permanent,
                                                 String source,
                                                 String sourceId,
                                                 String changeType,
                                                 String remark,
                                                 Long operatorId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime beforeExpire = user.getMembershipExpireAt();
        boolean beforePermanent = user.isMembershipPermanent();
        LocalDateTime afterExpire = beforeExpire;
        boolean afterPermanent = beforePermanent;

        if (permanent) {
            user.setMembershipPermanent(true);
            afterPermanent = true;
        } else if (!beforePermanent) {
            int days = durationDays != null ? durationDays : 0;
            if (days <= 0) {
                throw new RuntimeException("会员天数必须大于0");
            }
            LocalDateTime base = (beforeExpire != null && beforeExpire.isAfter(now)) ? beforeExpire : now;
            afterExpire = base.plusDays(days);
            user.setMembershipExpireAt(afterExpire);
            user.setMembershipPermanent(false);
            afterPermanent = false;
        }

        user.setMembershipSource(source);
        user.setMembershipUpdatedAt(now);
        userRepository.save(user);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(userId);
        record.setChangeType(changeType);
        record.setSource(source);
        record.setSourceId(sourceId);
        record.setDays(durationDays);
        record.setBeforeExpireAt(beforeExpire);
        record.setAfterExpireAt(user.getMembershipExpireAt());
        record.setBeforePermanent(beforePermanent);
        record.setAfterPermanent(afterPermanent);
        record.setOperatorId(operatorId);
        record.setRemark(remark);
        membershipRecordRepository.save(record);

        return MembershipGrantResult.builder()
                .userId(userId)
                .membershipActive(user.isMembershipActive())
                .membershipPermanent(user.isMembershipPermanent())
                .beforeExpireAt(beforeExpire)
                .afterExpireAt(user.getMembershipExpireAt())
                .beforePermanent(beforePermanent)
                .afterPermanent(afterPermanent)
                .daysAdded(durationDays)
                .build();
    }

    @Transactional
    public Map<String, Object> redeemCode(User user, String code) {
        RedeemCode redeemCode = redeemCodeRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("卡密不存在"));

        if ("USED".equals(redeemCode.getStatus())) throw new RuntimeException("卡密已被使用");
        if ("DISABLED".equals(redeemCode.getStatus())) throw new RuntimeException("卡密已禁用");
        if (redeemCode.getExpireAt() != null && redeemCode.getExpireAt().isBefore(LocalDateTime.now()))
            throw new RuntimeException("卡密已过期");

        LocalDateTime now = LocalDateTime.now();
        MembershipGrantResult result = grantMembership(
                user.getId(),
                redeemCode.getDays(),
                false,
                "REDEEM_CODE",
                String.valueOf(redeemCode.getId()),
                "REDEEM_CODE",
                "兑换卡密: " + redeemCode.getName(),
                null
        );

        redeemCode.setStatus("USED");
        redeemCode.setUsedBy(user.getId());
        redeemCode.setUsedAt(now);
        redeemCodeRepository.save(redeemCode);

        return Map.of(
                "success", true,
                "message", "兑换成功",
                "daysAdded", redeemCode.getDays(),
                "membershipExpireAt", result.getAfterExpireAt() != null ? result.getAfterExpireAt().toString() : "",
                "membershipPermanent", result.isMembershipPermanent(),
                "membershipActive", result.isMembershipActive()
        );
    }

    @Transactional
    public void setMembershipExpireAt(Long userId, LocalDateTime expireAt, String remark, Long operatorId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        LocalDateTime before = user.getMembershipExpireAt();
        boolean beforePermanent = user.isMembershipPermanent();
        user.setMembershipExpireAt(expireAt);
        user.setMembershipPermanent(false);
        user.setMembershipSource("ADMIN_GRANT");
        user.setMembershipUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(userId);
        record.setChangeType("ADMIN_SET");
        record.setSource("ADMIN_MANUAL");
        record.setBeforeExpireAt(before);
        record.setAfterExpireAt(expireAt);
        record.setBeforePermanent(beforePermanent);
        record.setAfterPermanent(false);
        record.setOperatorId(operatorId);
        record.setRemark(remark);
        membershipRecordRepository.save(record);
    }

    @Transactional
    public void addMembershipDays(Long userId, int days, String remark, Long operatorId) {
        grantMembership(userId, days, false, "ADMIN_MANUAL", null, "ADMIN_ADD", remark, operatorId);
    }

    @Transactional
    public void setMembershipPermanent(Long userId, String remark, Long operatorId) {
        grantMembership(userId, null, true, "ADMIN_MANUAL", null, "ADMIN_PERMANENT", remark, operatorId);
    }

    public List<RedeemCode> generateCodes(String name, int count, int days, LocalDateTime expireAt, String remark, Long creatorId) {
        List<RedeemCode> codes = new java.util.ArrayList<>();
        for (int i = 0; i < count; i++) {
            RedeemCode rc = new RedeemCode();
            rc.setCode(UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase());
            rc.setName(name);
            rc.setDays(days);
            rc.setExpireAt(expireAt);
            rc.setRemark(remark);
            rc.setCreatedBy(creatorId);
            codes.add(rc);
        }
        return redeemCodeRepository.saveAll(codes);
    }

    public List<MembershipRecord> getUserRecords(Long userId) {
        return membershipRecordRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
