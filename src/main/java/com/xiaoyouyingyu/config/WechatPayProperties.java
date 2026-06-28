package com.xiaoyouyingyu.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "app.wechat-pay")
public class WechatPayProperties {
    private boolean enabled = false;
    private boolean mockEnabled = false;
    private String appId = "";
    private String mchId = "";
    private String apiV3Key = "";
    private String merchantSerialNo = "";
    private String merchantPrivateKeyPath = "";
    private String platformCertificatePath = "";
    private String notifyUrl = "";
    private int orderExpireMinutes = 15;
}
