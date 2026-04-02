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
        user.setMembershipSource("REGISTER_GIFT");
        user.setMembershipUpdatedAt(now);
        userRepository.save(user);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(user.getId());
        record.setChangeType("REGISTER_GIFT");
        record.setDays(3);
        record.setBeforeExpireAt(null);
        record.setAfterExpireAt(user.getMembershipExpireAt());
        record.setRemark("新用户注册赠送3天会员");
        membershipRecordRepository.save(record);
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
        LocalDateTime beforeExpire = user.getMembershipExpireAt();
        LocalDateTime base = (beforeExpire != null && beforeExpire.isAfter(now)) ? beforeExpire : now;
        LocalDateTime newExpire = base.plusDays(redeemCode.getDays());

        user.setMembershipExpireAt(newExpire);
        user.setMembershipSource("REDEEM_CODE");
        user.setMembershipUpdatedAt(now);
        userRepository.save(user);

        redeemCode.setStatus("USED");
        redeemCode.setUsedBy(user.getId());
        redeemCode.setUsedAt(now);
        redeemCodeRepository.save(redeemCode);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(user.getId());
        record.setChangeType("REDEEM_CODE");
        record.setDays(redeemCode.getDays());
        record.setBeforeExpireAt(beforeExpire);
        record.setAfterExpireAt(newExpire);
        record.setRelatedCodeId(redeemCode.getId());
        record.setRemark("兑换卡密: " + redeemCode.getName());
        membershipRecordRepository.save(record);

        return Map.of(
                "success", true,
                "message", "兑换成功",
                "daysAdded", redeemCode.getDays(),
                "membershipExpireAt", newExpire.toString(),
                "membershipActive", true
        );
    }

    @Transactional
    public void setMembershipExpireAt(Long userId, LocalDateTime expireAt, String remark, Long operatorId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        LocalDateTime before = user.getMembershipExpireAt();
        user.setMembershipExpireAt(expireAt);
        user.setMembershipSource("ADMIN_GRANT");
        user.setMembershipUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(userId);
        record.setChangeType("ADMIN_SET");
        record.setBeforeExpireAt(before);
        record.setAfterExpireAt(expireAt);
        record.setOperatorId(operatorId);
        record.setRemark(remark);
        membershipRecordRepository.save(record);
    }

    @Transactional
    public void addMembershipDays(Long userId, int days, String remark, Long operatorId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("用户不存在"));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime before = user.getMembershipExpireAt();
        LocalDateTime base = (before != null && before.isAfter(now)) ? before : now;
        LocalDateTime newExpire = base.plusDays(days);

        user.setMembershipExpireAt(newExpire);
        user.setMembershipSource("ADMIN_GRANT");
        user.setMembershipUpdatedAt(now);
        userRepository.save(user);

        MembershipRecord record = new MembershipRecord();
        record.setUserId(userId);
        record.setChangeType("ADMIN_ADD");
        record.setDays(days);
        record.setBeforeExpireAt(before);
        record.setAfterExpireAt(newExpire);
        record.setOperatorId(operatorId);
        record.setRemark(remark);
        membershipRecordRepository.save(record);
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
