package com.xiaoyouyingyu.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.xiaoyouyingyu.config.WechatPayProperties;
import com.xiaoyouyingyu.entity.MembershipOrder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayInputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WechatPayService {
    private final WechatPayProperties properties;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public Map<String, String> createPaymentParams(MembershipOrder order, String openid, String description) {
        if (!properties.isEnabled()) {
            if (!properties.isMockEnabled()) {
                throw new RuntimeException("微信支付未启用");
            }
            return mockPaymentParams(order);
        }

        validateRealPayConfig();
        try {
            String path = "/v3/pay/transactions/jsapi";
            String body = buildJsapiOrderBody(order, openid, description);
            String authorization = buildAuthorization("POST", path, body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.mch.weixin.qq.com" + path))
                    .header("Authorization", authorization)
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("微信支付下单失败: " + response.body());
            }
            String prepayId = objectMapper.readTree(response.body()).path("prepay_id").asText();
            if (prepayId == null || prepayId.isBlank()) {
                throw new RuntimeException("微信支付未返回 prepay_id");
            }
            return buildMiniProgramPaymentParams(prepayId);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("微信支付下单失败: " + e.getMessage());
        }
    }

    public PaymentNotification parseNotification(String body,
                                                 String signature,
                                                 String serial,
                                                 String nonce,
                                                 String timestamp) {
        if (!properties.isEnabled() && properties.isMockEnabled()) {
            return parseMockNotification(body);
        }
        validateRealPayConfig();
        verifyNotificationSignature(body, signature, serial, nonce, timestamp);
        return decryptNotification(body);
    }

    public boolean isMockEnabled() {
        return properties.isMockEnabled();
    }

    private Map<String, String> mockPaymentParams(MembershipOrder order) {
        Map<String, String> params = new HashMap<>();
        params.put("timeStamp", String.valueOf(Instant.now().getEpochSecond()));
        params.put("nonceStr", randomToken(16));
        params.put("package", "prepay_id=mock_" + order.getOrderNo());
        params.put("signType", "RSA");
        params.put("paySign", "MOCK_PAY_SIGN_" + randomToken(8));
        params.put("mockPayment", "true");
        return params;
    }

    private void validateRealPayConfig() {
        if (isBlank(properties.getAppId())
                || isBlank(properties.getMchId())
                || isBlank(properties.getApiV3Key())
                || isBlank(properties.getMerchantSerialNo())
                || isBlank(properties.getMerchantPrivateKeyPath())
                || isBlank(properties.getNotifyUrl())) {
            throw new RuntimeException("微信支付配置不完整");
        }
    }

    private String buildJsapiOrderBody(MembershipOrder order, String openid, String description) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("appid", properties.getAppId());
        root.put("mchid", properties.getMchId());
        root.put("description", description);
        root.put("out_trade_no", order.getOrderNo());
        root.put("notify_url", properties.getNotifyUrl());
        root.put("time_expire", order.getExpiresAt().atOffset(ZoneOffset.ofHours(8)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        ObjectNode amount = root.putObject("amount");
        amount.put("total", order.getAmountCents());
        amount.put("currency", "CNY");
        ObjectNode payer = root.putObject("payer");
        payer.put("openid", openid);
        return objectMapper.writeValueAsString(root);
    }

    private String buildAuthorization(String method, String pathWithQuery, String body) throws Exception {
        String timestamp = String.valueOf(Instant.now().getEpochSecond());
        String nonce = randomToken(24);
        String message = method + "\n" + pathWithQuery + "\n" + timestamp + "\n" + nonce + "\n" + body + "\n";
        String signature = sign(message);
        return "WECHATPAY2-SHA256-RSA2048 "
                + "mchid=\"" + properties.getMchId() + "\","
                + "nonce_str=\"" + nonce + "\","
                + "timestamp=\"" + timestamp + "\","
                + "serial_no=\"" + properties.getMerchantSerialNo() + "\","
                + "signature=\"" + signature + "\"";
    }

    private Map<String, String> buildMiniProgramPaymentParams(String prepayId) throws Exception {
        String timeStamp = String.valueOf(Instant.now().getEpochSecond());
        String nonceStr = randomToken(24);
        String packageValue = "prepay_id=" + prepayId;
        String message = properties.getAppId() + "\n" + timeStamp + "\n" + nonceStr + "\n" + packageValue + "\n";
        Map<String, String> params = new HashMap<>();
        params.put("timeStamp", timeStamp);
        params.put("nonceStr", nonceStr);
        params.put("package", packageValue);
        params.put("signType", "RSA");
        params.put("paySign", sign(message));
        return params;
    }

    private String sign(String message) throws Exception {
        Signature signer = Signature.getInstance("SHA256withRSA");
        signer.initSign(loadMerchantPrivateKey());
        signer.update(message.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(signer.sign());
    }

    private PrivateKey loadMerchantPrivateKey() throws Exception {
        String pem = Files.readString(Path.of(properties.getMerchantPrivateKeyPath()), StandardCharsets.UTF_8);
        String base64 = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] keyBytes = Base64.getDecoder().decode(base64);
        return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(keyBytes));
    }

    private void verifyNotificationSignature(String body, String signature, String serial, String nonce, String timestamp) {
        if (isBlank(signature) || isBlank(serial) || isBlank(nonce) || isBlank(timestamp)) {
            throw new RuntimeException("微信支付回调签名头缺失");
        }
        if (isBlank(properties.getPlatformCertificatePath())) {
            throw new RuntimeException("微信支付平台证书未配置，无法验签");
        }
        try {
            X509Certificate certificate = loadPlatformCertificate();
            if (certificate.getSerialNumber() != null
                    && !certificate.getSerialNumber().toString(16).equalsIgnoreCase(serial)
                    && !certificate.getSerialNumber().toString().equals(serial)) {
                throw new RuntimeException("微信支付平台证书序列号不匹配");
            }
            Signature verifier = Signature.getInstance("SHA256withRSA");
            verifier.initVerify(certificate.getPublicKey());
            String message = timestamp + "\n" + nonce + "\n" + body + "\n";
            verifier.update(message.getBytes(StandardCharsets.UTF_8));
            if (!verifier.verify(Base64.getDecoder().decode(signature))) {
                throw new RuntimeException("微信支付回调验签失败");
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("微信支付回调验签失败: " + e.getMessage());
        }
    }

    private X509Certificate loadPlatformCertificate() throws Exception {
        byte[] bytes = Files.readAllBytes(Path.of(properties.getPlatformCertificatePath()));
        return (X509Certificate) CertificateFactory.getInstance("X.509")
                .generateCertificate(new ByteArrayInputStream(bytes));
    }

    private PaymentNotification decryptNotification(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode resource = root.path("resource");
            String associatedData = resource.path("associated_data").asText("");
            String nonce = resource.path("nonce").asText();
            String ciphertext = resource.path("ciphertext").asText();
            byte[] decoded = Base64.getDecoder().decode(ciphertext);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            SecretKeySpec key = new SecretKeySpec(properties.getApiV3Key().getBytes(StandardCharsets.UTF_8), "AES");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, nonce.getBytes(StandardCharsets.UTF_8)));
            if (!associatedData.isEmpty()) {
                cipher.updateAAD(associatedData.getBytes(StandardCharsets.UTF_8));
            }
            byte[] plain = cipher.doFinal(decoded);
            JsonNode transaction = objectMapper.readTree(new String(plain, StandardCharsets.UTF_8));
            String tradeState = transaction.path("trade_state").asText();
            String successTime = transaction.path("success_time").asText("");
            Instant paidAt = successTime.isBlank() ? Instant.now() : OffsetDateTime.parse(successTime).toInstant();
            return PaymentNotification.builder()
                    .orderNo(transaction.path("out_trade_no").asText())
                    .transactionId(transaction.path("transaction_id").asText())
                    .tradeState(tradeState)
                    .amountCents(transaction.path("amount").path("total").asInt())
                    .successTime(paidAt)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("微信支付回调解密失败: " + e.getMessage());
        }
    }

    private String randomToken(int length) {
        byte[] bytes = new byte[length];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private PaymentNotification parseMockNotification(String body) {
        try {
            JsonNode node = objectMapper.readTree(body);
            return PaymentNotification.builder()
                    .orderNo(node.path("orderNo").asText())
                    .transactionId(node.path("transactionId").asText("mock_txn_" + randomToken(8)))
                    .tradeState(node.path("tradeState").asText("SUCCESS"))
                    .amountCents(node.path("amountCents").asInt())
                    .successTime(Instant.now())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("模拟支付通知解析失败");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @lombok.Data
    @lombok.Builder
    public static class PaymentNotification {
        private String orderNo;
        private String transactionId;
        private String tradeState;
        private Integer amountCents;
        private Instant successTime;
    }
}
