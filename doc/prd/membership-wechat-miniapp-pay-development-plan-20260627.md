# 会员套餐与微信小程序支付开发计划

> 日期：2026-06-27
> 依据文档：
> - `doc/prd/membership-wechat-miniapp-pay-requirements-20260627.md`
> 目标读者：后续负责实现的 AI 编码代理或开发者

---

## 1. 实施原则

- 在改代码前先阅读：
  - `doc/README.md`
  - `doc/repository-overview.md`
  - `doc/backend.md`
  - `doc/frontend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`
  - `doc/prd/addMembershipFeature-20260402.md`
  - `doc/prd/membership-wechat-miniapp-pay-requirements-20260627.md`
- 本计划是在现有会员/卡密体系上增量实现，不重写卡密模块。
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- PC 后台沿用 Next.js、React Query、Tailwind CSS、`frontend/src/lib/api.ts`。
- 小程序沿用原生 WXML/WXSS/JS，通过 `xiaochengxu/miniprogram/utils/api.js` 和 `utils/request.js` 调用 Spring Boot REST API。
- 会员支付只支持微信小程序内支付；不做 PC 支付、H5 支付、公众号支付、Native 扫码支付。
- 微信支付后端采用微信支付 API v3 JSAPI/小程序支付；小程序端只调用 `wx.requestPayment`，不生成签名、不保存密钥。
- 支付金额全链路使用整数分，前端只负责元/分展示转换。
- 会员权益只通过动态权限判断生效：`ADMIN` 永远有效，普通用户仅当永久会员或有效期未过期时有效。
- 不通过定时任务降级 `users.role`；过期会员访问会员接口时由动态判断拦截。
- 支付回调必须幂等、验签、校验金额，会员开通与订单更新必须在事务中完成。
- 实现完成后同步更新：
  - `doc/backend.md`
  - `doc/frontend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`
  - `doc/development-and-deployment.md`

---

## 2. 当前代码现状

### 2.1 已存在能力

后端已存在：

- `src/main/java/com/xiaoyouyingyu/service/MembershipService.java`
- `src/main/java/com/xiaoyouyingyu/controller/MembershipController.java`
- `src/main/java/com/xiaoyouyingyu/entity/User.java`
- `src/main/java/com/xiaoyouyingyu/entity/MembershipRecord.java`
- `src/main/java/com/xiaoyouyingyu/entity/RedeemCode.java`
- `src/main/java/com/xiaoyouyingyu/repository/MembershipRecordRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/RedeemCodeRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/UserRepository.java`
- `src/main/java/com/xiaoyouyingyu/controller/AdminController.java` 中的卡密管理和会员手动设置接口。

PC 后台已存在：

- `frontend/src/app/users/page.tsx`：用户管理、会员到期时间展示、追加天数、设置到期时间。
- `frontend/src/app/redeem-codes/page.tsx`：卡密管理。
- `frontend/src/lib/api.ts`：会员、卡密、用户管理相关 API 封装。
- `frontend/src/components/sidebar.tsx`：后台导航。

小程序已存在：

- `xiaochengxu/miniprogram/pages/profile/*`：我的页展示会员状态和兑换入口。
- `xiaochengxu/miniprogram/pages/redeem/*`：卡密兑换页。
- `xiaochengxu/miniprogram/components/membership-modal/*`：会员拦截弹窗，目前引导联系管理员和兑换卡密。
- `xiaochengxu/miniprogram/utils/api.js`：`getMembership()`、`getMembershipContact()`、`redeemCode()`。
- `xiaochengxu/miniprogram/app.js`：保存 `membershipActive`、`membershipExpireAt`，并通过 `isMember()` 判断会员。

### 2.2 必须修正的现状冲突

- `User.isMembershipActive()` 当前把 `role == PREMIUM_USER` 永久视为会员，这与新方案冲突。
- `SecurityConfig` 当前对 `/api/learning/**` 使用 `hasAnyRole("PREMIUM_USER", "ADMIN", "MEMBER")`，仍依赖角色，不能准确处理会员过期。
- 现有用户表缺少永久会员字段，需要新增 `membership_permanent`。
- 现有 `MembershipRecord` 只能记录天数、到期时间和卡密 ID，需要扩展或兼容记录支付订单、永久会员、操作前后永久状态。
- 现有会员弹窗只支持联系管理员/兑换卡密，需要新增“购买会员套餐”入口。

---

## 3. 交付目标

### V1 完成标志

1. 数据库支持会员套餐、会员订单、永久会员字段和支付来源会员记录。
2. 后端统一会员判断不再把 `PREMIUM_USER` 当作永久有效会员。
3. 学习中心等会员接口使用动态会员权限判断。
4. 卡密兑换仍可正常使用，并复用统一会员授予逻辑。
5. 管理员可在 PC 后台创建、编辑、上架、下架会员套餐。
6. 管理员可在 PC 后台查看会员订单列表和订单详情。
7. 管理员可在用户管理中查看会员状态、到期时间、永久会员状态。
8. 管理员可手动延长、设置到期时间、设置永久会员、取消永久会员。
9. 小程序可展示上架会员套餐。
10. 小程序可创建会员订单并调起 `wx.requestPayment`。
11. 后端可调用微信支付 API v3 JSAPI/小程序下单并返回支付参数。
12. 微信支付回调可验签、解密、校验金额、更新订单、开通会员。
13. 支付回调重复通知不会重复延长会员。
14. 15 分钟未支付订单自动关闭。
15. 支付成功后已有会员按原到期时间顺延。
16. 支付永久会员套餐后用户永久有效。
17. 小程序支付完成后可刷新会员状态或展示“支付确认中”并轮询。
18. 开发/测试环境支持关闭真实微信支付或使用模拟支付。
19. 微信支付密钥、私钥路径、回调地址通过环境变量配置，不提交仓库。
20. 文档、接口说明、部署配置说明同步更新。

---

## 4. 任务总览

### Phase 0：现状确认与范围冻结

### Phase 1：数据库模型与实体扩展

### Phase 2：统一会员权限与授予逻辑

### Phase 3：套餐管理后端接口

### Phase 4：订单与微信支付后端链路

### Phase 5：支付回调、订单关闭与补偿能力

### Phase 6：PC 后台套餐管理、订单管理、用户会员增强

### Phase 7：小程序会员购买页与支付交互

### Phase 8：配置、安全与部署准备

### Phase 9：测试、联调与验收

### Phase 10：文档同步与上线步骤

---

## 5. Phase 0：现状确认与范围冻结

### 5.1 阅读后端会员与权限实现

任务：

- 阅读：
  - `src/main/java/com/xiaoyouyingyu/entity/User.java`
  - `src/main/java/com/xiaoyouyingyu/entity/MembershipRecord.java`
  - `src/main/java/com/xiaoyouyingyu/entity/RedeemCode.java`
  - `src/main/java/com/xiaoyouyingyu/service/MembershipService.java`
  - `src/main/java/com/xiaoyouyingyu/controller/MembershipController.java`
  - `src/main/java/com/xiaoyouyingyu/controller/AdminController.java`
  - `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
  - `src/main/java/com/xiaoyouyingyu/security/JwtFilter.java`
  - `src/main/java/com/xiaoyouyingyu/dto/AuthResponse.java`
  - `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- 找出所有使用 `hasRole("PREMIUM_USER")`、`hasAnyRole`、`isMembershipActive()`、`membershipActive` 的位置。
- 确认是否有历史数据库中 `role = PREMIUM_USER` 的用户需要迁移到 `membership_expire_at` 或 `membership_permanent`。

产出：

- 一份实现前检查记录，明确：
  - 哪些接口要改为动态会员判断。
  - 旧 `PREMIUM_USER` 用户的处理策略。
  - 是否需要一次性 SQL 数据修正。

验收：

- 不开始支付开发前，先确认会员权限判断改造路径。
- 明确卡密流程不移除、不改 URL，避免小程序兑换页回归。

### 5.2 阅读 PC 后台和小程序现有入口

任务：

- 阅读：
  - `frontend/src/lib/api.ts`
  - `frontend/src/components/sidebar.tsx`
  - `frontend/src/app/users/page.tsx`
  - `frontend/src/app/redeem-codes/page.tsx`
  - `xiaochengxu/miniprogram/app.json`
  - `xiaochengxu/miniprogram/app.js`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/request.js`
  - `xiaochengxu/miniprogram/pages/profile/*`
  - `xiaochengxu/miniprogram/pages/redeem/*`
  - `xiaochengxu/miniprogram/components/membership-modal/*`
- 确认新增小程序页面命名，推荐：
  - `pages/membership/index`：会员套餐购买页。
- 确认 PC 新增页面命名，推荐：
  - `frontend/src/app/admin/membership-plans/page.tsx`
  - `frontend/src/app/admin/membership-orders/page.tsx`

产出：

- 最终文件清单。
- 明确是否在侧边栏新增两个入口，或在现有用户管理页中加入 tab。

验收：

- 不改变现有卡密管理页主流程。
- 小程序“兑换卡密”入口继续可达。

---

## 6. Phase 1：数据库模型与实体扩展

### 6.1 扩展 User

修改文件：

- `src/main/java/com/xiaoyouyingyu/entity/User.java`

新增字段：

```java
@Column(name = "membership_permanent", nullable = false)
private boolean membershipPermanent = false;
```

修改 `isMembershipActive()`：

```java
public boolean isMembershipActive() {
    if (role == Role.ADMIN) return true;
    if (membershipPermanent) return true;
    return membershipExpireAt != null && membershipExpireAt.isAfter(LocalDateTime.now());
}
```

注意：

- 不再因为 `role == PREMIUM_USER` 直接返回 true。
- 如果保留 `PREMIUM_USER` 作为展示兼容，必须在文档中说明它不代表会员有效。

验收：

- `PREMIUM_USER` 但无有效期、非永久的用户不再被判定为会员。
- `ADMIN` 仍始终为会员。

### 6.2 新增实体 MembershipPlan

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/MembershipPlan.java`
- `src/main/java/com/xiaoyouyingyu/entity/MembershipPlanStatus.java`

字段：

- `id: Long`
- `name: String`
- `description: String`
- `originalPriceCents: Integer`
- `salePriceCents: Integer`
- `durationDays: Integer`
- `permanent: boolean`
- `discountStartAt: LocalDateTime`
- `discountEndAt: LocalDateTime`
- `status: MembershipPlanStatus`
- `sortOrder: Integer`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

枚举：

- `ACTIVE`
- `INACTIVE`

验证规则：

- 名称必填。
- 原价、现价不能小于 0。
- 原价默认应大于等于现价。
- 普通时长套餐 `durationDays > 0`。
- 永久套餐 `durationDays` 可空。
- 折扣结束时间必须晚于开始时间。

### 6.3 新增实体 MembershipOrder

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/MembershipOrder.java`
- `src/main/java/com/xiaoyouyingyu/entity/MembershipOrderStatus.java`

字段：

- `id: Long`
- `orderNo: String`
- `userId: Long`
- `planId: Long`
- `planSnapshotJson: String`
- `amountCents: Integer`
- `status: MembershipOrderStatus`
- `wechatPrepayId: String`
- `wechatTransactionId: String`
- `wechatTradeState: String`
- `paidAt: LocalDateTime`
- `expiresAt: LocalDateTime`
- `membershipGrantedAt: LocalDateTime`
- `failureReason: String`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

索引建议：

- `order_no` 唯一索引。
- `wechat_transaction_id` 唯一索引，可空。
- `user_id + created_at` 普通索引。
- `status + expires_at` 普通索引，用于超时关闭任务。

### 6.4 扩展 MembershipRecord

修改文件：

- `src/main/java/com/xiaoyouyingyu/entity/MembershipRecord.java`

建议新增字段：

- `source: String`，取值 `WECHAT_PAY` / `REDEEM_CODE` / `ADMIN_MANUAL` / `REGISTER_GIFT`。
- `sourceId: String`，订单号、卡密 ID 或其他来源 ID。
- `beforePermanent: Boolean`
- `afterPermanent: Boolean`

兼容方案：

- 保留现有 `changeType`、`days`、`relatedCodeId`、`remark` 字段。
- 新代码写入 `source` 和 `sourceId`。
- 旧记录字段为空时前端按旧字段兜底展示。

### 6.5 Repository

新增文件：

- `src/main/java/com/xiaoyouyingyu/repository/MembershipPlanRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/MembershipOrderRepository.java`

建议方法：

```java
List<MembershipPlan> findByStatusOrderBySortOrderAscIdAsc(MembershipPlanStatus status);
Page<MembershipOrder> findByStatusOrderByCreatedAtDesc(MembershipOrderStatus status, Pageable pageable);
Optional<MembershipOrder> findByOrderNo(String orderNo);
Optional<MembershipOrder> findByWechatTransactionId(String transactionId);
List<MembershipOrder> findByStatusAndExpiresAtBefore(MembershipOrderStatus status, LocalDateTime time);
```

验收：

- 应用启动后 Hibernate 可创建/更新表结构。
- Repository 编译通过。

---

## 7. Phase 2：统一会员权限与授予逻辑

### 7.1 重构 MembershipService

修改文件：

- `src/main/java/com/xiaoyouyingyu/service/MembershipService.java`

新增统一方法：

```java
public boolean isActiveMember(User user);

@Transactional
public MembershipGrantResult grantMembership(
    Long userId,
    Integer durationDays,
    boolean permanent,
    String source,
    String sourceId,
    String changeType,
    String remark,
    Long operatorId
);

@Transactional
public MembershipGrantResult setPermanent(Long userId, String remark, Long operatorId);

@Transactional
public MembershipGrantResult setExpireAt(Long userId, LocalDateTime expireAt, String remark, Long operatorId);
```

授予规则：

- `permanent = true` 时设置 `membershipPermanent = true`。
- 普通时长授予：
  - 当前非永久且未过期：从原到期时间顺延。
  - 当前非永久且已过期或无到期时间：从 now 顺延。
  - 当前永久：不缩短、不覆盖永久状态，仅记录会员记录。
- `setExpireAt` 设置指定到期时间时：
  - 若要取消永久，需要显式参数或单独接口，避免误操作。

验收：

- 卡密兑换、微信支付、管理员手动操作都复用该方法。
- 会员记录能保存变更前后到期时间和永久状态。

### 7.2 改造卡密兑换

修改文件：

- `src/main/java/com/xiaoyouyingyu/service/MembershipService.java`
- `src/main/java/com/xiaoyouyingyu/controller/MembershipController.java`

任务：

- `redeemCode()` 在校验卡密后调用 `grantMembership()`。
- 卡密兑换记录 `source = REDEEM_CODE`，`sourceId = redeemCode.id`。
- 返回中补充 `membershipPermanent`。

验收：

- 原有 `/api/redeem-codes/redeem` 请求和小程序兑换页不需要改 URL。
- 已使用、禁用、过期卡密仍按原错误提示返回。

### 7.3 改造动态权限判断

修改文件：

- `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
- 可新增：
  - `src/main/java/com/xiaoyouyingyu/security/MembershipAccessService.java`
  - 或在 Controller/Service 层显式检查。

推荐方案：

- 对会员业务接口使用 Spring Security 表达式：

```java
.requestMatchers("/api/learning/**").access(membershipAuthorizationManager)
```

或短期方案：

- 将 `/api/learning/**` 改为 `.authenticated()`。
- 在 `LearningController` 每个入口前调用统一 `requireMember(auth)`。
- 后续再抽成注解或 AuthorizationManager。

要求：

- 不再依赖 `hasAnyRole("PREMIUM_USER", "ADMIN", "MEMBER")` 判断会员。
- 需要检查其它会员接口，如 AI 对话、口语热身、跟读精听完整内容等，按实际业务决定是否纳入会员门槛。

验收：

- 会员过期后访问会员接口返回 403。
- 管理员仍可访问。
- `role = PREMIUM_USER` 但有效期已过/为空时不能访问会员接口。

### 7.4 登录和会员状态响应

修改文件：

- `src/main/java/com/xiaoyouyingyu/dto/AuthResponse.java`
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- `src/main/java/com/xiaoyouyingyu/controller/MembershipController.java`

任务：

- 登录、注册、微信登录、PC 登录确认响应中返回：
  - `membershipActive`
  - `membershipExpireAt`
  - `membershipPermanent`
- `/api/user/membership` 返回同样字段。

验收：

- 小程序 `app.globalData` 可保存 `membershipPermanent`。
- PC `localStorage` 可兼容新增字段。

---

## 8. Phase 3：套餐管理后端接口

### 8.1 新增 DTO

建议目录：

- `src/main/java/com/xiaoyouyingyu/dto/membership`

建议文件：

- `MembershipPlanRequest.java`
- `MembershipPlanResponse.java`
- `MembershipPlanStatusRequest.java`

字段：

- `id`
- `name`
- `description`
- `originalPriceCents`
- `salePriceCents`
- `durationDays`
- `permanent`
- `discountStartAt`
- `discountEndAt`
- `status`
- `sortOrder`
- `effectivePriceCents`
- `discountActive`

说明：

- 管理端可看到所有字段。
- 小程序端只返回上架套餐和可展示字段。

### 8.2 新增 MembershipPlanService

建议文件：

- `src/main/java/com/xiaoyouyingyu/service/MembershipPlanService.java`

方法：

- `listAdminPlans()`
- `listActivePlansForMiniapp()`
- `createPlan(request)`
- `updatePlan(id, request)`
- `updateStatus(id, status)`
- `calculateEffectivePrice(plan, now)`
- `toSnapshot(plan, effectivePriceCents)`

验收：

- 下架套餐不出现在小程序列表。
- 计划快照包含下单所需名称、价格、时长、永久状态。

### 8.3 新增管理端 Controller

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/AdminMembershipController.java`

接口：

- `GET /api/admin/membership/plans`
- `POST /api/admin/membership/plans`
- `PUT /api/admin/membership/plans/{id}`
- `PUT /api/admin/membership/plans/{id}/status`

验收：

- 管理员可增改查和上下架。
- 普通用户访问返回 403。

---

## 9. Phase 4：订单与微信支付后端链路

### 9.1 微信支付配置类

新增文件：

- `src/main/java/com/xiaoyouyingyu/config/WechatPayProperties.java`

配置项：

- `enabled`
- `appId`
- `mchId`
- `apiV3Key`
- `merchantSerialNo`
- `merchantPrivateKeyPath`
- `notifyUrl`
- `orderExpireMinutes`
- `mockEnabled`

`application.yml` 增加环境变量占位：

```yaml
app:
  wechat-pay:
    enabled: ${WECHAT_PAY_ENABLED:false}
    app-id: ${WECHAT_PAY_APP_ID:}
    mch-id: ${WECHAT_PAY_MCH_ID:}
    api-v3-key: ${WECHAT_PAY_API_V3_KEY:}
    merchant-serial-no: ${WECHAT_PAY_MERCHANT_SERIAL_NO:}
    merchant-private-key-path: ${WECHAT_PAY_MERCHANT_PRIVATE_KEY_PATH:}
    platform-certificate-path: ${WECHAT_PAY_PLATFORM_CERTIFICATE_PATH:}
    notify-url: ${WECHAT_PAY_NOTIFY_URL:}
    order-expire-minutes: ${WECHAT_PAY_ORDER_EXPIRE_MINUTES:15}
    mock-enabled: ${WECHAT_PAY_MOCK_ENABLED:false}
```

验收：

- 本地默认不调用真实微信支付。
- 未配置生产密钥时，创建支付订单给出明确错误。

### 9.2 微信支付客户端服务

新增文件：

- `src/main/java/com/xiaoyouyingyu/service/WechatPayService.java`

职责：

- 读取商户私钥。
- 构造 JSAPI/小程序下单请求。
- 调用微信支付 `/v3/pay/transactions/jsapi`。
- 生成小程序 `wx.requestPayment` 参数：
  - `timeStamp`
  - `nonceStr`
  - `package = prepay_id=...`
  - `signType = RSA`
  - `paySign`
- 验证回调签名。
- 解密回调资源数据。
- 必要时查询订单状态、关闭订单。

实现建议：

- 优先使用微信支付官方 Java SDK 或项目可接受的成熟 SDK。
- 若手写 HTTP 调用，必须封装签名、验签、解密逻辑，不散落在 Controller 中。

验收：

- 单元测试覆盖支付参数签名生成的输入输出结构。
- 回调验签失败时不会进入业务处理。

### 9.3 订单 Service

新增文件：

- `src/main/java/com/xiaoyouyingyu/service/MembershipOrderService.java`

核心方法：

- `createOrder(username, planId)`
- `getUserOrder(username, orderNo)`
- `listAdminOrders(filters, pageable)`
- `getAdminOrder(id)`
- `markPaidFromWechatNotify(notifyData)`
- `closeExpiredOrders()`
- `handlePaymentFailure(orderNo, reason)`

创建订单流程：

1. 查询用户。
2. 校验用户存在且有 `wechatOpenid`。
3. 查询套餐且状态为 `ACTIVE`。
4. 计算当前有效价格。
5. 生成订单号。
6. 写入 `PENDING` 订单，过期时间 `now + 15 minutes`。
7. 调用微信支付下单。
8. 保存 `wechatPrepayId`。
9. 返回小程序支付参数。

验收：

- 下架套餐不能创建订单。
- 没有 openid 的用户返回“请重新微信登录”。
- 订单金额与套餐快照一致。

### 9.4 用户端 Controller

新增或扩展：

- `src/main/java/com/xiaoyouyingyu/controller/MembershipController.java`

接口：

- `GET /api/membership/status`
- `GET /api/membership/plans`
- `POST /api/membership/orders`
- `GET /api/membership/orders/{orderNo}`

兼容：

- 保留现有 `/api/user/membership`。
- 可让 `/api/user/membership` 内部复用新状态 DTO。

验收：

- 小程序端可直接调用新接口。
- 用户不能查询他人的订单。

---

## 10. Phase 5：支付回调、订单关闭与补偿能力

### 10.1 支付回调 Controller

新增文件：

- `src/main/java/com/xiaoyouyingyu/controller/WechatPayController.java`

接口：

- `POST /api/payment/wechat/notify`

Security 配置：

- 在 `SecurityConfig` 中对该路径 `permitAll()`。
- Controller 内必须执行微信支付签名校验。

处理流程：

1. 读取请求体和微信支付签名头。
2. 调用 `WechatPayService` 验签。
3. 解密通知资源。
4. 提取 `out_trade_no`、`transaction_id`、`trade_state`、`amount`、`success_time`。
5. 查询本地订单。
6. 校验金额、状态和商户信息。
7. 若订单已 `PAID`，直接返回成功。
8. 若支付成功，事务内更新订单并调用 `MembershipService.grantMembership()`。
9. 写入 `membershipGrantedAt`。
10. 返回微信支付要求的成功响应。

验收：

- 重复回调不重复开通。
- 金额不一致不更新会员。
- 验签失败不更新订单。

### 10.2 订单超时关闭任务

新增文件：

- `src/main/java/com/xiaoyouyingyu/service/MembershipOrderScheduler.java`

任务：

- 每分钟扫描 `PENDING` 且 `expiresAt <= now()` 的订单。
- 有条件时先调用微信支付查询订单。
- 未支付则改为 `CLOSED`。
- 已支付但本地未更新时，走支付成功补偿逻辑。

验收：

- 15 分钟未支付订单关闭。
- 已支付订单不会被关闭。

### 10.3 开发环境模拟支付

建议新增：

- 仅 `WECHAT_PAY_MOCK_ENABLED=true` 且非生产环境可用的接口：
  - `POST /api/dev/membership/orders/{orderNo}/mock-paid`

用途：

- 小程序联调 UI。
- 后端集成测试。

要求：

- 生产环境必须禁用。
- 该接口不得出现在正式小程序调用路径中。

验收：

- 本地可不配置微信商户密钥也能验证会员开通链路。

---

## 11. Phase 6：PC 后台实现

### 11.1 API 封装

修改文件：

- `frontend/src/lib/api.ts`

新增方法：

- `getMembershipPlans()`
- `createMembershipPlan(data)`
- `updateMembershipPlan(id, data)`
- `updateMembershipPlanStatus(id, status)`
- `getMembershipOrders(params)`
- `getMembershipOrder(id)`
- `grantUserMembership(userId, data)`

兼容：

- 保留现有 `addMembershipDays()`、`setMembershipExpireAt()`，但可逐步改为统一 `grantUserMembership()`。

### 11.2 侧边栏入口

修改文件：

- `frontend/src/components/sidebar.tsx`

新增管理员入口：

- 会员套餐：`/admin/membership-plans`
- 会员订单：`/admin/membership-orders`

图标建议：

- 套餐：`BadgeDollarSign` 或 `CreditCard`。
- 订单：`ReceiptText`。

### 11.3 套餐管理页面

新增文件：

- `frontend/src/app/admin/membership-plans/page.tsx`

页面结构：

- 顶部标题和“新增套餐”按钮。
- 套餐表格：
  - 名称。
  - 原价。
  - 现价。
  - 时长。
  - 是否永久。
  - 折扣时间。
  - 状态。
  - 排序。
  - 操作。
- 新增/编辑弹窗或表单：
  - 套餐名称。
  - 描述。
  - 原价。
  - 现价。
  - 类型：普通时长 / 永久会员。
  - 天数。
  - 折扣开始/结束。
  - 排序。
  - 状态。

交互要求：

- 普通时长套餐必须填天数。
- 永久会员禁用天数字段。
- 金额输入以元展示，提交前转分。
- 保存成功后刷新列表。

验收：

- 能创建月卡、年卡、永久会员。
- 下架套餐后小程序不展示。

### 11.4 订单管理页面

新增文件：

- `frontend/src/app/admin/membership-orders/page.tsx`

页面结构：

- 筛选区：
  - 状态。
  - 用户名或用户 ID。
  - 订单号。
  - 创建时间范围。
- 订单表格：
  - 订单号。
  - 用户。
  - 套餐。
  - 金额。
  - 状态。
  - 微信交易号。
  - 创建时间。
  - 支付时间。
  - 开通状态。
- 订单详情弹窗：
  - 套餐快照。
  - 回调信息。
  - 失败原因。
  - 关联会员记录。

验收：

- 能按状态筛选 `PENDING`、`PAID`、`CLOSED`、`FAILED`。
- 订单详情能定位支付异常原因。

### 11.5 用户管理增强

修改文件：

- `frontend/src/app/users/page.tsx`

任务：

- 展示 `membershipPermanent`。
- 会员设置弹窗增加：
  - 延长天数。
  - 设置指定到期时间。
  - 设置永久会员。
  - 取消永久会员并设置到期时间。
  - 操作原因必填。
- 调用统一 `grantUserMembership()`。

验收：

- 永久会员用户显示“永久会员”。
- 操作原因为空时不能提交。

---

## 12. Phase 7：小程序实现

### 12.1 API 封装

修改文件：

- `xiaochengxu/miniprogram/utils/api.js`

新增方法：

- `getMembershipStatus()`
- `getMembershipPlans()`
- `createMembershipOrder(planId)`
- `getMembershipOrder(orderNo)`

导出到 `module.exports`。

### 12.2 全局会员字段

修改文件：

- `xiaochengxu/miniprogram/app.js`

任务：

- 增加 `membershipPermanent`。
- `setLogin()` 保存 `membershipPermanent`。
- `logout()` 清除 `membershipPermanent`。
- `isMember()` 使用：
  - `isAdmin()`。
  - `membershipPermanent === true`。
  - `membershipActive === true`。

注意：

- 小程序本地判断只用于展示；后端仍是最终权限来源。

### 12.3 新增会员购买页

新增文件：

- `xiaochengxu/miniprogram/pages/membership/index.js`
- `xiaochengxu/miniprogram/pages/membership/index.wxml`
- `xiaochengxu/miniprogram/pages/membership/index.wxss`
- `xiaochengxu/miniprogram/pages/membership/index.json`

修改：

- `xiaochengxu/miniprogram/app.json` 注册页面。

页面数据：

- `membershipStatus`
- `membershipExpireAt`
- `membershipPermanent`
- `plans`
- `loading`
- `error`
- `payingPlanId`
- `confirmingOrderNo`

页面逻辑：

1. `onLoad` 加载会员状态和套餐列表。
2. 用户点击套餐：
   - 未登录跳登录。
   - 调用 `createMembershipOrder(planId)`。
   - 调用 `wx.requestPayment(paymentParams)`。
3. 支付成功：
   - 查询订单状态。
   - 若已支付，刷新会员状态。
   - 若未确认，展示“支付确认中”并轮询 3-5 次。
4. 支付取消：
   - toast “未完成支付”。
5. 支付失败：
   - toast “支付失败，请稍后重试”。

验收：

- 上架套餐正常展示。
- 支付按钮在请求中禁用。
- 支付成功后会员状态刷新。

### 12.4 改造会员弹窗和个人中心入口

修改文件：

- `xiaochengxu/miniprogram/components/membership-modal/index.js`
- `xiaochengxu/miniprogram/components/membership-modal/index.wxml`
- `xiaochengxu/miniprogram/components/membership-modal/index.wxss`
- `xiaochengxu/miniprogram/pages/profile/index.js`
- `xiaochengxu/miniprogram/pages/profile/index.wxml`

任务：

- 会员弹窗增加“购买会员”按钮，跳转 `/pages/membership/index`。
- 保留“兑换卡密”按钮。
- 个人中心会员状态区域增加“开通/续费会员”入口。
- 不移除当前联系客服文案，但购买入口优先级高于联系管理员。

验收：

- 用户仍可进入兑换页。
- 受限功能弹窗可直接进入购买页。

### 12.5 兑换页兼容

修改文件：

- `xiaochengxu/miniprogram/pages/redeem/index.js`

任务：

- 兼容 `membershipPermanent` 字段。
- 兑换成功后刷新 `/api/membership/status` 或 `/api/user/membership`，不要只在本地强行设置 active。

验收：

- 兑换永久会员或普通会员后展示正确。

---

## 13. Phase 8：配置、安全与部署准备

### 13.1 环境变量

生产环境必须配置：

```bash
WECHAT_PAY_ENABLED=true
WECHAT_PAY_APP_ID=wx_xxx
WECHAT_PAY_MCH_ID=1900000001
WECHAT_PAY_API_V3_KEY=your_api_v3_key
WECHAT_PAY_MERCHANT_SERIAL_NO=your_certificate_serial_no
WECHAT_PAY_MERCHANT_PRIVATE_KEY_PATH=/secure/wechat-pay/apiclient_key.pem
WECHAT_PAY_PLATFORM_CERTIFICATE_PATH=/secure/wechat-pay/wechatpay_platform.pem
WECHAT_PAY_NOTIFY_URL=https://xiaoyou-ky.top/api/payment/wechat/notify
WECHAT_PAY_ORDER_EXPIRE_MINUTES=15
```

本地开发建议：

```bash
WECHAT_PAY_ENABLED=false
WECHAT_PAY_MOCK_ENABLED=true
```

安全要求：

- `apiclient_key.pem` 不提交 Git。
- 私钥文件权限仅应用运行用户可读。
- 日志不得打印 API v3 密钥、私钥、完整回调密文、完整 openid。

### 13.2 微信平台配置

上线前检查：

- 小程序 AppID 已与商户号关联。
- 商户号已开通小程序支付/JSAPI 支付。
- API v3 密钥已设置。
- 商户 API 证书和序列号已准备。
- 小程序后台 request 合法域名包含生产 API 域名。
- 支付通知地址使用 HTTPS：
  - `https://xiaoyou-ky.top/api/payment/wechat/notify`

### 13.3 SecurityConfig

修改文件：

- `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`

任务：

- 放行：
  - `POST /api/payment/wechat/notify`
- 会员接口：
  - `/api/membership/**` 需要登录，回调除外。
  - `/api/admin/membership/**` 需要管理员。
- 会员权限：
  - 不再用 `PREMIUM_USER` 角色判定有效会员。

验收：

- 微信回调不因 JWT 缺失返回 401。
- 伪造回调因验签失败不进入业务。

---

## 14. Phase 9：测试、联调与验收

### 14.1 后端单元测试

建议新增目录：

- `src/test/java/com/xiaoyouyingyu/service`

测试：

- `MembershipServiceTest`
  - 无会员购买 30 天，从 now 计算。
  - 未过期会员购买 30 天，从原到期时间顺延。
  - 已过期会员购买 30 天，从 now 计算。
  - 永久会员购买普通套餐，不取消永久。
  - 设置永久会员。
  - `PREMIUM_USER` 但无有效期不算会员。
- `MembershipPlanServiceTest`
  - 普通套餐校验。
  - 永久套餐校验。
  - 折扣价格计算。
- `MembershipOrderServiceTest`
  - 下架套餐不能下单。
  - 没有 openid 不能下单。
  - 订单过期时间为 15 分钟。

### 14.2 后端集成测试

建议测试：

- 创建会员订单。
- 模拟支付成功。
- 重复支付回调。
- 金额不一致。
- 订单不存在。
- 超时关闭。
- 管理员套餐 CRUD。
- 管理员订单列表。
- 管理员手动开通会员。

### 14.3 PC 后台人工验收

步骤：

1. 登录管理员账号。
2. 创建 30 天套餐、365 天套餐、永久会员套餐。
3. 下架其中一个套餐。
4. 确认小程序只展示上架套餐。
5. 查看订单列表。
6. 手动给测试用户追加 7 天。
7. 设置测试用户为永久会员。
8. 取消永久并设置指定到期时间。

### 14.4 小程序人工验收

步骤：

1. 未登录进入会员购买页，确认跳登录。
2. 登录后进入会员购买页。
3. 查看当前会员状态。
4. 选择 30 天套餐。
5. 调起微信支付。
6. 取消支付，确认订单不立即开通会员。
7. 使用模拟支付或真实低金额支付成功。
8. 返回页面后会员状态刷新。
9. 再购买一次，确认到期时间顺延。
10. 购买永久会员，确认展示永久会员。
11. 兑换卡密，确认卡密流程不回归。

### 14.5 支付专项验收

必须覆盖：

- 回调验签失败。
- 回调重复发送。
- 回调金额不一致。
- 支付成功但本地订单仍 `PENDING`。
- 订单已关闭后收到支付成功回调。
- 微信回调延迟，小程序轮询订单。

---

## 15. Phase 10：文档同步与上线步骤

### 15.1 文档同步

实现完成后更新：

- `doc/backend.md`
  - 新增会员套餐、订单、微信支付服务说明。
  - 更新动态会员权限判断。
- `doc/frontend.md`
  - 新增 PC 套餐管理、订单管理页面。
- `doc/miniapp.md`
  - 新增会员购买页、小程序支付流程。
  - 更新会员弹窗说明。
- `doc/api-and-data-model.md`
  - 新增套餐、订单、支付回调、管理员会员接口。
  - 更新 `users` 和 `membership_records` 字段。
- `doc/development-and-deployment.md`
  - 新增微信支付环境变量、私钥文件部署说明。

### 15.2 上线前检查

Checklist：

- [ ] 生产微信支付配置完整。
- [ ] 回调地址公网 HTTPS 可访问。
- [ ] 商户私钥文件权限正确。
- [ ] 数据库已备份。
- [ ] 套餐默认先下架。
- [ ] 低金额测试套餐可用。
- [ ] 小程序体验版支付成功。
- [ ] 支付回调日志正常。
- [ ] 订单和会员记录一致。
- [ ] 卡密兑换回归通过。

### 15.3 推荐上线顺序

1. 发布后端数据库和接口。
2. 发布 PC 后台。
3. 管理员创建测试套餐，保持下架。
4. 配置微信支付生产环境变量和证书。
5. 发布小程序体验版。
6. 上架低金额测试套餐。
7. 体验版完成真实支付测试。
8. 提审并发布小程序正式版。
9. 上架正式套餐。
10. 观察首日订单、回调、会员开通日志。

---

## 16. 风险与处理

### 风险 1：旧 `PREMIUM_USER` 语义冲突

- 风险：旧角色被当作永久会员，导致过期用户仍可访问会员功能。
- 处理：第一阶段先改动态权限判断；如需保留历史高级用户权益，迁移到 `membership_permanent` 或补充到期时间。

### 风险 2：支付成功但回调延迟

- 风险：用户已付款但页面仍显示未开通。
- 处理：小程序支付成功后轮询订单；后端提供订单查询；必要时后台可通过微信订单查询补偿。

### 风险 3：重复回调导致重复顺延

- 风险：会员天数被重复增加。
- 处理：以订单状态 `PAID` 和 `membershipGrantedAt` 做幂等锁；同一订单只授予一次。

### 风险 4：金额配置错误

- 风险：套餐价格或折扣配置错误造成损失。
- 处理：后台保存时校验；上线前套餐默认下架；先用低金额套餐测试。

### 风险 5：密钥泄露

- 风险：微信支付密钥、私钥进入日志或 Git。
- 处理：只使用环境变量和服务器私钥路径；日志脱敏；提交前检查 `application.yml` 和仓库文件。

---

## 17. 建议实现顺序

1. 改造 `User.isMembershipActive()` 和动态权限判断。
2. 扩展 `MembershipService`，统一会员授予逻辑。
3. 兼容卡密兑换，确保旧流程先通过。
4. 新增套餐、订单实体和 Repository。
5. 新增套餐管理接口。
6. 新增订单创建接口，先用 mock 支付跑通。
7. 新增 PC 后台套餐管理和订单管理。
8. 新增小程序会员购买页，先接 mock 支付。
9. 接入真实微信支付下单。
10. 接入微信支付回调验签和会员开通。
11. 补订单超时关闭、重复回调、金额校验。
12. 完成测试、文档、上线清单。
