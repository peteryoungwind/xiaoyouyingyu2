# Context

第二阶段目标是在 **PC 端支持微信登录**，并且与现有 **小程序微信登录后的同一个后端账号** 打通。当前后端已经通过 `wechatOpenid` 把小程序微信身份映射到 `users` 表中的用户，并用统一的 JWT/`AuthResponse` 返回登录态；但 PC 端只有用户名密码登录，没有微信登录入口，也没有跨端确认流程。

本阶段不走微信开放平台网页 OAuth，而采用用户已确认的方案：**PC 展示登录二维码，小程序已登录用户扫码后在小程序内确认，PC 轮询拿到同一用户的登录结果**。这样可以直接复用现有小程序微信身份与后端账号体系，避免引入 `unionid` / 绑定表 / 账号合并等更大改造。

# Recommended approach

## 一、后端：新增短期 PC 微信登录票据机制

修改：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
- 新增一个登录票据服务类，例如 `src/main/java/com/xiaoyouyingyu/service/PcWechatLoginService.java`
- 如实现上更清晰，可新增 DTO 文件放在 `src/main/java/com/xiaoyouyingyu/dto/`

方案：
- 在后端新增一套 **短时票据（ticket）** 机制，用于承载一次 PC 端待确认的微信登录请求
- 票据字段至少包括：
  - `ticketId`：高熵随机串
  - `pollToken`：PC 轮询用的第二个随机串
  - `status`：`PENDING / CONFIRMED / CANCELLED / EXPIRED / CONSUMED`
  - `userId`：确认后写入
  - `expiresAt`
  - 可选：`userAgent` / `clientIp` 用于在小程序确认页展示设备提示
- 本阶段采用 **内存存储**（如 `ConcurrentHashMap`）实现，保持最小改动；清理过期票据由服务内部统一处理

原因：
- 当前项目是单体服务、单机部署风格，第二阶段不必为票据先上数据库/Redis
- 只要把票据逻辑封装在 service 内，后续要切换存储实现也不影响接口层

## 二、后端：提供 PC 创建二维码、轮询结果、小程序确认/取消接口

修改：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`

新增接口建议全部放在 `/api/auth` 下：

### 1. PC 创建登录会话
- `POST /api/auth/wechat-pc-login/session`
- 公开接口
- 返回：
  - `ticketId`
  - `pollToken`
  - `expiresAt`
  - `qrContent`

`qrContent` 建议为可扫描字符串，例如：
- `xiaoyouyingyu://pc-login?ticket=...`

如果小程序扫码对自定义 scheme 支持不稳定，也可以返回一个项目自定义 URL 文本，由小程序解析其中的 `ticket` 参数。

### 2. PC 轮询登录结果
- `GET /api/auth/wechat-pc-login/session/{ticketId}?pollToken=...`
- 公开接口
- `PENDING` 时只返回状态
- `CONFIRMED` 时返回完整 `AuthResponse`
- 成功返回一次后立即置为 `CONSUMED`
- 过期/取消返回明确错误文案

### 3. 小程序查看待确认会话信息
- `GET /api/auth/wechat-pc-login/scene/{ticketId}`
- 登录态接口
- 返回：
  - `status`
  - `expiresAt`
  - 可选 `deviceInfo`

用途：
- 小程序扫码后先校验二维码是否合法、是否过期、是否仍待确认
- 为确认页展示“是否登录这台电脑”提供上下文

### 4. 小程序确认 PC 登录
- `POST /api/auth/wechat-pc-login/confirm`
- 登录态接口
- 请求体只需 `ticketId`
- 后端通过当前 JWT 识别已登录小程序用户，写入票据 `userId` 并置为 `CONFIRMED`

### 5. 小程序取消 PC 登录
- `POST /api/auth/wechat-pc-login/cancel`
- 登录态接口
- 请求体只需 `ticketId`
- 后端将票据置为 `CANCELLED`

权限配置：
- `/api/auth/wechat-pc-login/session` 与轮询接口允许匿名
- `scene / confirm / cancel` 保持必须登录
- 因为当前 `SecurityConfig.java:42` 已把 `/api/auth/**` 全放开，推荐在本次顺手把 `auth` 下路由精细化，而不是继续全部公开

## 三、后端：复用现有账号体系，不新增账号绑定逻辑

复用：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java:40` 的 `buildAuthResponse(User user)`
- `src/main/java/com/xiaoyouyingyu/entity/User.java:23` 的 `wechatOpenid`
- `src/main/java/com/xiaoyouyingyu/repository/UserRepository.java:11` 的 `findByWechatOpenid`
- `src/main/java/com/xiaoyouyingyu/security/JwtFilter.java` 现有 JWT 登录态解析

方案：
- 小程序端必须先完成现有微信登录，拿到系统 JWT
- 扫码确认时，不再重新调用微信接口，也不新增任何跨端身份映射
- 直接把“当前已登录小程序用户”确认给该 PC 登录票据
- PC 轮询成功后，仍返回标准 `AuthResponse`，由 PC 端像普通登录一样落本地登录态

原因：
- 这正是当前项目最稳妥、改动最小的“同账号连通”方式
- 避免走 PC 网页微信 OAuth 后出现 openid 不同、账号重复的问题

## 四、PC 前端：在现有登录弹窗中加入“微信扫码登录”模式

修改：
- `frontend/src/components/auth-modal.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.tsx`

方案：
- 继续复用现有 `AuthModal`，不要新做独立登录页
- 在弹窗中增加第二种登录方式：`微信扫码登录`
- PC 流程：
  1. 用户打开登录弹窗并切到微信登录
  2. 调用 `POST /api/auth/wechat-pc-login/session`
  3. 将返回的 `qrContent` 渲染为二维码
  4. 前端以 2~3 秒间隔轮询登录状态
  5. 轮询拿到完整 `AuthResponse` 后，直接调用现有 `useAuth().login(data)`
  6. 登录成功后关闭弹窗
  7. 过期时显示“二维码已过期，请刷新”
- 关闭弹窗、切换模式或登录成功时，都要停止轮询并清理定时器

补充：
- `frontend/src/lib/api.ts` 增加：
  - `createWechatPcLoginSession()`
  - `pollWechatPcLoginSession(ticketId, pollToken)`
- `frontend/src/lib/auth.tsx` 继续复用现有 `login(data)`；可顺手把 `hasPassword` 一并持久化，避免后续状态不一致

## 五、小程序：增加“扫一扫登录电脑端”入口和确认流程

修改：
- `xiaochengxu/miniprogram/utils/api.js`
- `xiaochengxu/miniprogram/pages/profile/index.js` 或 `xiaochengxu/miniprogram/pages/settings/index.js`
- 如需独立确认页，可新增一个小程序页面；若当前 UI 允许，也可先用 `wx.showModal` 做最小实现

方案：
- 在小程序个人页或设置页增加入口：`扫一扫登录电脑端`
- 点击后执行：
  1. 若未登录，先引导到现有登录页 `xiaochengxu/miniprogram/pages/login/index.js`
  2. 登录后使用 `wx.scanCode`
  3. 解析扫码结果中的 `ticketId`
  4. 调用 `GET /auth/wechat-pc-login/scene/{ticketId}` 校验状态
  5. 展示确认 UI：`确认在 PC 端登录？`
  6. 点击确认 -> `POST /auth/wechat-pc-login/confirm`
  7. 点击取消 -> `POST /auth/wechat-pc-login/cancel`
  8. 成功后提示：`已确认，请返回电脑端`

API 封装建议新增：
- `getWechatPcLoginScene(ticketId)`
- `confirmWechatPcLogin(ticketId)`
- `cancelWechatPcLogin(ticketId)`

原因：
- 小程序当前已有成熟登录态与 Bearer token 注入逻辑，最适合做“已登录用户确认 PC 登录”的桥梁
- 放在个人页或设置页最符合用户心智，不需要改现有小程序登录主流程

## 六、安全要求

后端必须保证：
- 票据高熵不可猜
- 票据有效期短（建议 2~5 分钟）
- 轮询必须同时校验 `ticketId + pollToken`
- 同一票据只允许成功消费一次
- 已过期/已取消/已消费票据不能再确认或再取登录结果
- 小程序确认接口必须依赖现有 JWT 登录态
- 小程序确认页应展示基础设备信息（若实现成本可控）
- 对创建会话和轮询接口做基础频率限制或最少日志记录

## 七、关键文件

后端：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
- `src/main/java/com/xiaoyouyingyu/repository/UserRepository.java`
- 新增：`src/main/java/com/xiaoyouyingyu/service/PcWechatLoginService.java`
- 可选新增 DTO：`src/main/java/com/xiaoyouyingyu/dto/...`

PC 前端：
- `frontend/src/components/auth-modal.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.tsx`

小程序：
- `xiaochengxu/miniprogram/utils/api.js`
- `xiaochengxu/miniprogram/pages/profile/index.js`
- 或 `xiaochengxu/miniprogram/pages/settings/index.js`
- 如需要更完整确认流程，可新增一个确认页

# Reuse existing code

直接复用：
- PC 登录态写入：`frontend/src/lib/auth.tsx` 的 `login(data)`
- PC API 请求封装：`frontend/src/lib/api.ts` 的 `request()`
- 小程序请求封装：`xiaochengxu/miniprogram/utils/request.js`
- 小程序登录态持久化：`xiaochengxu/miniprogram/app.js` 的 `setLogin()`
- 小程序现有微信登录：`xiaochengxu/miniprogram/pages/login/index.js` + `utils/api.js` 的 `wechatLogin()`
- 后端统一认证响应：`src/main/java/com/xiaoyouyingyu/controller/AuthController.java` 的 `buildAuthResponse(User user)`
- 用户微信身份锚点：`src/main/java/com/xiaoyouyingyu/entity/User.java` 的 `wechatOpenid`

# Verification

## 后端验证
- 创建 PC 登录会话可返回 `ticketId / pollToken / qrContent / expiresAt`
- 未确认前轮询返回 `PENDING`
- 已登录小程序用户确认后，轮询返回完整 `AuthResponse`
- 同一票据成功消费后不能再次返回 token
- 已取消/已过期票据不能确认
- 未登录小程序请求 `scene / confirm / cancel` 被拒绝

## PC 验证
- 账号密码登录不受影响
- 登录弹窗可切换到微信扫码模式
- 扫码后确认成功，PC 自动登录并关闭弹窗
- 二维码过期后可刷新重试
- 关闭弹窗时轮询被清理，不再继续请求

## 小程序验证
- 已登录用户可从个人页/设置页发起扫码
- 扫到项目登录二维码后能进入确认流程
- 确认后看到“请返回电脑端”的成功提示
- 取消后 PC 端收到取消/失败状态
- 未登录扫码时会先被引导登录

## 运行验证
- 后端：启动 Spring Boot 后手工联调新接口
- 前端：`cd frontend && ./node_modules/.bin/next build`
- 小程序：开发者工具 + 真机扫码联调
