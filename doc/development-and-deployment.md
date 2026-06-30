# 开发与部署说明

> 最后更新：2026-06-01

## 本地开发环境

建议版本：

- JDK 21
- Maven 3.9+
- Node.js 20+
- npm 10+
- MySQL 8+
- 微信开发者工具

## 后端本地启动

在仓库根目录执行：

```bash
mvn spring-boot:run
```

默认端口：

- 后端：`http://localhost:8080`
- API 前缀：`http://localhost:8080/api`

## PC 前端本地启动

```bash
cd frontend
npm install
npm run dev
```

默认地址：

- `http://localhost:3000`

`frontend/next.config.js` 会将 `/api/:path*` 代理到：

- 开发环境：`http://localhost:8080/api/:path*`
- 生产环境：`https://xiaoyou-ky.top/api/:path*`

## 小程序本地开发

1. 使用微信开发者工具打开 `xiaochengxu` 目录。
2. 确认 `project.config.json` 中的 AppID 与实际小程序一致。
3. `miniprogram/app.js` 中 `develop` 指向 `http://localhost:8080/api`，用于本地后端联调；`trial` 和 `release` 保持线上 API。
4. 真机调试时，`localhost` 通常指手机自身；如需访问电脑本机后端，需改成手机可访问的局域网地址或测试域名。

## 本地话题生成上下文脚本

项目本地 Codex skill `$xiaoyou-speaking-topics` 使用：

```bash
python3 .codex/skills/xiaoyou-speaking-topics/scripts/export_topic_context.py
```

该脚本会读取 `TopicCategoryConstants` 分类，并请求本地后端 `http://localhost:8080/api/topics` 与 `/api/topics/{id}` 导出近期话题样本。

注意：

- 运行前需先启动后端服务。
- 如后端不在默认地址，可设置 `XIAOYOU_API_BASE` 或使用 `--base-url`。
- 在 Codex 沙箱网络禁用环境中，脚本可能无法从 Python 进程访问 `localhost`。此时脚本会返回 `error_type: "sandbox_network_disabled"`，需要在外部终端运行，或在 Codex 中批准该脚本的提权运行。

## 数据库初始化

当前项目使用 JPA `ddl-auto: update` 自动同步实体字段。

注意：

- `src/main/resources/schema.sql` 是早期初始化脚本，仅可作为参考。
- 当前真实结构包含会员、卡密、AI 模型、微信 openid 等字段，应以 JPA 实体为准。
- 生产数据库变更建议引入 Flyway 或 Liquibase 管理。

## 后端配置建议

当前 `application.yml` 中包含数据库、微信、JWT、AI 配置。生产环境建议改成环境变量。

示例：

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

wechat:
  appid: ${WECHAT_APPID}
  secret: ${WECHAT_SECRET}

app:
  wechat-pay:
    enabled: ${WECHAT_PAY_ENABLED:false}
    mock-enabled: ${WECHAT_PAY_MOCK_ENABLED:false}
    app-id: ${WECHAT_PAY_APP_ID:}
    mch-id: ${WECHAT_PAY_MCH_ID:}
    api-v3-key: ${WECHAT_PAY_API_V3_KEY:}
    merchant-serial-no: ${WECHAT_PAY_MERCHANT_SERIAL_NO:}
    merchant-private-key-path: ${WECHAT_PAY_MERCHANT_PRIVATE_KEY_PATH:}
    platform-certificate-path: ${WECHAT_PAY_PLATFORM_CERTIFICATE_PATH:}
    notify-url: ${WECHAT_PAY_NOTIFY_URL:}
    order-expire-minutes: ${WECHAT_PAY_ORDER_EXPIRE_MINUTES:15}
  jwt:
    secret: ${APP_JWT_SECRET}
    expiration-ms: ${APP_JWT_EXPIRATION_MS:86400000}
  ai:
    api-key: ${APP_AI_API_KEY}
    api-url: ${APP_AI_API_URL}
    model: ${APP_AI_MODEL:gpt-4o}
```

## 微信支付配置

会员套餐购买使用微信小程序支付。生产环境需要准备：

- 小程序 AppID。
- 微信支付商户号。
- API v3 密钥。
- 商户 API 证书序列号。
- 商户私钥文件 `apiclient_key.pem`。
- 微信支付平台证书文件，用于回调验签。
- HTTPS 支付回调地址。

生产环境变量示例：

```bash
export WECHAT_PAY_ENABLED=true
export WECHAT_PAY_APP_ID=wx_xxx
export WECHAT_PAY_MCH_ID=1900000001
export WECHAT_PAY_API_V3_KEY=your_api_v3_key
export WECHAT_PAY_MERCHANT_SERIAL_NO=your_certificate_serial_no
export WECHAT_PAY_MERCHANT_PRIVATE_KEY_PATH=/secure/wechat-pay/apiclient_key.pem
export WECHAT_PAY_PLATFORM_CERTIFICATE_PATH=/secure/wechat-pay/wechatpay_platform.pem
export WECHAT_PAY_NOTIFY_URL=https://xiaoyou-ky.top/api/payment/wechat/notify
export WECHAT_PAY_ORDER_EXPIRE_MINUTES=15
```

本地开发可使用：

```bash
export WECHAT_PAY_ENABLED=false
export WECHAT_PAY_MOCK_ENABLED=true
```

mock 模式下，后端创建订单会返回 `mockPayment=true` 和 `prepay_id=mock_...`。小程序会员页会调用 `/api/dev/membership/orders/{orderNo}/mock-paid` 模拟支付成功，不会把 mock 参数交给 `wx.requestPayment`。

注意：

- 商户私钥文件不要提交到仓库。
- 当前代码已提供微信支付 API v3 JSAPI 下单、RSA 签名、小程序支付参数签名、平台证书验签和回调 AES-GCM 解密。生产上线前必须配置平台证书路径并完成真实低金额支付验收。
- 小程序端只调用后端返回的 `wx.requestPayment` 参数，不保存任何商户密钥。
- 若真实微信支付下单失败，订单会标记为 `FAILED` 并记录 `failureReason`；小程序真实支付失败时会展示微信 SDK 返回的失败原因，便于定位 AppID、商户号、签名、域名或用户取消等问题。

## 构建命令

### 后端

```bash
mvn clean package
```

### PC 前端

```bash
cd frontend
npm run build
```

## 推荐生产部署结构

可参考既有文档 `doc/deploy.md`。推荐结构：

```text
Nginx 80/443
├── /api -> Spring Boot 8080
└── /    -> Next.js 3000
```

服务器目录示例：

```text
/opt/xiaoyouyingyu/
├── backend/
│   ├── app.jar
│   └── logs/
├── frontend/
│   ├── .next/
│   ├── package.json
│   └── logs/
├── upload/
├── scripts/
└── backups/
```

## 小程序发布

小程序按微信官方流程：

1. 微信开发者工具上传代码。
2. 在小程序后台提交审核。
3. 审核通过后发布。

发布前检查：

- `app.js` 中 release API 地址正确。
- 后端已配置对应小程序 AppID/Secret。
- 业务域名已在微信公众平台配置并通过 HTTPS。
- 需要访问的后端接口已经允许小程序域名/来源。

## 常用账号与权限

后端启动时 `DataInit` 会创建或重置默认管理员：

- 用户名：`admin`
- 密码：`admin123`
- 角色：`ADMIN`

生产环境建议：

- 首次登录后立即修改默认密码。
- 移除或调整 `DataInit` 的重置行为，避免每次重启覆盖管理员密码。

## 开发注意事项

### 敏感信息

不要在仓库中提交：

- 数据库密码。
- JWT 密钥。
- 微信 AppSecret。
- AI API Key。
- 生产服务器连接信息。

### AI 返回格式

后端提示词要求 AI 返回严格 JSON，但外部模型仍可能返回 Markdown 代码块或非 JSON 内容。

前端和小程序需要：

- 去掉 ```json 代码块包裹。
- 捕获 `JSON.parse` 异常。
- 提供重试提示。

### 会员权限

学习中心权限由两部分组成：

- 静态角色：`ADMIN`。
- 动态角色：用户为永久会员，或 `membershipExpireAt` 未过期时，`JwtFilter` 添加 `ROLE_MEMBER`。

当用户兑换卡密后：

- 客户端应刷新会员状态。
- 如果旧 token 中 role 仍是 `USER`，动态会员判断会在每次请求时查库并添加 `ROLE_MEMBER`。
- `PREMIUM_USER` 角色仅为兼容旧数据保留，不再单独代表有效会员。

### PC 扫码登录

PC 扫码登录 ticket 目前存在后端内存中。

部署限制：

- 单实例可用。
- 多实例或滚动发布可能导致 ticket 丢失。
- 如要扩容，建议迁移到 Redis。

### 小程序云函数

`cloudfunctions/api` 中包含历史重复业务实现，且有硬编码配置。当前小程序主链路不依赖它。

建议后续二选一：

- 保留 REST API 主链路，移除或归档云函数重复代码。
- 改为云函数主链路，并移除小程序直连 REST API。

## 质量检查建议

后端：

```bash
mvn test
```

前端：

```bash
cd frontend
npm run build
```

小程序：

- 使用微信开发者工具编译。
- 检查登录、主题列表、学习中心、卡密兑换、PC 登录确认。
