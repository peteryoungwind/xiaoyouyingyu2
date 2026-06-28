package com.xiaoyouyingyu.controller;

import com.xiaoyouyingyu.service.MembershipOrderService;
import com.xiaoyouyingyu.service.WechatPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WechatPayController {
    private final WechatPayService wechatPayService;
    private final MembershipOrderService membershipOrderService;

    @PostMapping("/payment/wechat/notify")
    public ResponseEntity<?> notify(@RequestBody String body,
                                    @RequestHeader(value = "Wechatpay-Signature", required = false) String signature,
                                    @RequestHeader(value = "Wechatpay-Serial", required = false) String serial,
                                    @RequestHeader(value = "Wechatpay-Nonce", required = false) String nonce,
                                    @RequestHeader(value = "Wechatpay-Timestamp", required = false) String timestamp) {
        try {
            var notification = wechatPayService.parseNotification(body, signature, serial, nonce, timestamp);
            membershipOrderService.markPaid(
                    notification.getOrderNo(),
                    notification.getTransactionId(),
                    notification.getTradeState(),
                    notification.getAmountCents(),
                    notification.getSuccessTime()
            );
            return ResponseEntity.ok(Map.of("code", "SUCCESS", "message", "成功"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("code", "FAIL", "message", e.getMessage()));
        }
    }

    @PostMapping("/dev/membership/orders/{orderNo}/mock-paid")
    public ResponseEntity<?> mockPaid(@PathVariable String orderNo) {
        try {
            return ResponseEntity.ok(membershipOrderService.mockPaid(orderNo));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
