# Context

这次改动分两部分：

1. 完成小程序设置页的交互调整：修改用户名/修改密码改为点击条目后弹窗编辑，修正弹窗按钮文字垂直居中，会员开通联系人展示为“西柚 / 915981048”，并保持会员时间显示格式为 `年-月-日 时:分:秒`。
2. 实现账号体系第一阶段打通：微信登录自动注册的新用户没有“可用默认密码”，但可以在已登录的小程序设置页里首次设置密码；设置后即可用用户名+密码登录 PC 网页端。

当前代码里，后端微信自动注册用户会生成随机密码，但用户并不知道这个密码；同时 `/api/auth/password` 仍强制要求旧密码，因此微信新用户实际上无法补齐账号密码登录能力。需要在不破坏现有用户名密码用户流程的前提下，补上“首次设置密码”这条链路。

# Recommended approach

## 一、后端：增加“是否已设置可用密码”状态，并单独提供首次设密接口

### 1. 扩展用户模型
修改：
- `src/main/java/com/xiaoyouyingyu/entity/User.java`

方案：
- 新增布尔字段 `hasPassword`（默认 `true`）
- 普通注册用户：保存密码时同时置 `hasPassword = true`
- 微信自动注册用户：仍保存一个随机加密占位密码，但置 `hasPassword = false`

原因：
- 不建议把 `password` 设为 `null`，会引入更多空值判断
- 用占位密码 + `hasPassword=false` 最小改动且兼容当前密码校验方式
- 也能明确区分“用户自己设置过密码”和“系统自动生成但不可用的占位密码”

### 2. 扩展认证响应
修改：
- `src/main/java/com/xiaoyouyingyu/dto/AuthResponse.java`
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`

方案：
- 在 `AuthResponse` 中新增 `hasPassword`
- `buildAuthResponse()` 统一返回该字段
- 让以下响应都带上 `hasPassword`：
  - 注册
  - 登录
  - 修改用户名
  - 微信登录

用途：
- 小程序设置页据此判断显示“设置密码”还是“修改密码”
- PC 登录失败时也能围绕这一状态给出清晰提示

### 3. 保留现有改密接口，不混用语义
修改：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`

方案：
- 保留现有 `PUT /api/auth/password`，继续用于“已设置密码用户”的正常改密
- 当 `hasPassword == false` 时，这个接口直接返回明确错误，提示用户走首次设密流程

原因：
- 当前前后端都默认这个接口必须传旧密码
- 不建议把“首次设置密码”和“修改密码”塞进同一个接口，会让语义和客户端逻辑变复杂

### 4. 新增首次设密接口
修改：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- 如有必要，补充请求体校验 DTO；也可先沿用 `Map<String, String>` 做最小改动

新增接口：
- `PUT /api/auth/password/setup`

行为：
- 仅登录用户可调用
- 仅允许 `hasPassword == false` 的用户调用
- 请求体只需要 `newPassword`
- 校验新密码长度至少 6 位
- 保存加密后密码，并把 `hasPassword = true`
- 返回成功消息（可附带 `hasPassword: true`）

### 5. 收紧账号密码登录逻辑
修改：
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`

方案：
- 在 `POST /api/auth/login` 中，用户查到后先判断 `hasPassword`
- 若为 `false`，直接拒绝登录，并返回清晰文案，例如：
  - `该账号尚未设置密码，请先在小程序中设置密码`

这样可以确保：
- 微信自动注册用户虽然数据库里有占位密码，但不能直接走用户名密码登录
- 只有用户自己完成首次设密后，PC 端账号密码登录才真正开启

## 二、小程序：设置页按 hasPassword 分成“首次设密 / 正常改密”两条交互

### 1. 复用现有弹窗交互，不改成内联表单
修改：
- `xiaochengxu/miniprogram/pages/settings/index.js`
- `xiaochengxu/miniprogram/pages/settings/index.wxml`
- `xiaochengxu/miniprogram/pages/settings/index.wxss`

现状里设置页已经改成点击条目后弹窗，这个方向正确，继续沿用：
- 修改用户名：点击条目 -> 弹窗编辑 -> 成功后关闭
- 修改密码：点击条目 -> 弹窗编辑 -> 成功后关闭

无需退回为页内表单。

### 2. 小程序登录态保存 hasPassword
修改：
- `xiaochengxu/miniprogram/app.js`
- 可能涉及 `xiaochengxu/miniprogram/pages/login/index.js`
- `xiaochengxu/miniprogram/pages/register/index.js`
- `xiaochengxu/miniprogram/pages/settings/index.js`

方案：
- 在 `app.setLogin(...)` 的用户信息/全局状态里保存 `hasPassword`
- 微信登录、注册、用户名修改后都同步更新该字段
- 设置页 `refreshState()` 时从全局态读取 `hasPassword`

### 3. 新增小程序首次设密 API 封装
修改：
- `xiaochengxu/miniprogram/utils/api.js`

方案：
- 保留 `changePassword(oldPassword, newPassword)`
- 新增 `setupPassword(newPassword)`，请求 `/auth/password/setup`

### 4. 设置页密码项按状态动态文案和表单
修改：
- `xiaochengxu/miniprogram/pages/settings/index.js`
- `xiaochengxu/miniprogram/pages/settings/index.wxml`

方案：
- 若 `hasPassword == false`
  - 菜单标题可显示“设置密码”或保留“修改密码”但副文案明确说明首次设置
  - 副文案建议：`设置后可使用账号密码登录PC端`
  - 弹窗标题：`设置密码`
  - 表单字段：只显示“新密码”“确认新密码”
  - 提交时调用 `setupPassword(newPassword)`
- 若 `hasPassword == true`
  - 保持现有改密模式
  - 弹窗标题：`修改密码`
  - 表单字段：显示“原密码 / 新密码 / 确认新密码”
  - 提交时调用 `changePassword(oldPassword, newPassword)`

### 5. 用户名修改保持现有方案
修改：
- `xiaochengxu/miniprogram/pages/settings/index.js`
- `xiaochengxu/miniprogram/pages/settings/index.wxml`

方案：
- 沿用当前“点击条目 -> 弹窗 -> 调 `/auth/username` -> 更新 token 和 username”的流程
- 不需要额外改接口
- 成功后继续调用 `app.setLogin(...)`，但要把新的 `hasPassword` 一并写回全局态

### 6. 设置页展示修正
修改：
- `xiaochengxu/miniprogram/pages/settings/index.wxml`
- `xiaochengxu/miniprogram/pages/settings/index.wxss`

方案：
- 联系方式展示为：
  - `联系人：西柚`
  - `微信：915981048`
- 保持会员时间显示依赖 `util.formatDateTime()`，不要改回错误格式
- 修正弹窗按钮文字垂直居中：优先调整 `.modal-btn` 的文本布局，确保在微信 `button` 组件里正常居中。建议使用：
  - 保持固定高度
  - 去除默认 padding / border
  - `display:flex; align-items:center; justify-content:center;`
  - 如仍有偏移，再把 `line-height` 设为与高度一致验证真机表现

## 三、PC 网页：第一阶段只支持账号密码登录，但给出清晰提示

### 1. 登录流程不增加微信扫码
修改：
- `frontend/src/components/auth-modal.tsx`
- 必要时检查 `frontend/src/lib/api.ts`

方案：
- 第一阶段不做 PC 微信扫码登录
- 保持现有用户名密码登录框
- 确保后端返回的“尚未设置密码，请先在小程序设置密码”的错误能在弹窗中明确展示给用户

这样即可满足：
- 微信自动注册的新用户先到小程序里设置密码
- 然后回 PC 用用户名+密码登录

### 2. PC 设置页这阶段可选优化
可选修改：
- `frontend/src/app/settings/page.tsx`

建议：
- 如果工作量可控，可同步支持 `hasPassword == false` 时显示“首次设置密码”表单
- 但这不是第一阶段必需项，因为本阶段最核心路径是“小程序设密 -> PC 登录”

# Critical files

后端：
- `src/main/java/com/xiaoyouyingyu/entity/User.java`
- `src/main/java/com/xiaoyouyingyu/dto/AuthResponse.java`
- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`

小程序：
- `xiaochengxu/miniprogram/app.js`
- `xiaochengxu/miniprogram/utils/api.js`
- `xiaochengxu/miniprogram/pages/settings/index.js`
- `xiaochengxu/miniprogram/pages/settings/index.wxml`
- `xiaochengxu/miniprogram/pages/settings/index.wxss`
- `xiaochengxu/miniprogram/utils/util.js`（只复用已有时间格式化，不做回退）

PC 前端：
- `frontend/src/components/auth-modal.tsx`
- 可选：`frontend/src/app/settings/page.tsx`

# Reuse existing code

直接复用现有能力：
- 用户名修改接口：`src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- 小程序设置页弹窗交互：`xiaochengxu/miniprogram/pages/settings/index.js` + `index.wxml`
- 时间格式化：`xiaochengxu/miniprogram/utils/util.js` 中的 `formatDateTime()`
- 小程序认证请求封装：`xiaochengxu/miniprogram/utils/api.js`
- PC 登录弹窗：`frontend/src/components/auth-modal.tsx`

# Verification

## 后端验证
- 普通注册用户注册后，响应应返回 `hasPassword: true`
- 普通用户原有登录、改密流程不受影响
- 微信新用户首次登录后，响应应返回 `hasPassword: false`
- 微信新用户在未设密前，用用户名密码登录 PC，应收到清晰错误提示
- 微信新用户调用 `/api/auth/password/setup` 后：
  - 数据库中 `hasPassword` 变为 `true`
  - 可立即用用户名+新密码登录 PC
- 已设密码用户调用 `/api/auth/password/setup` 应被拒绝
- 未设密码用户调用旧 `/api/auth/password` 应被拒绝并提示走首次设密流程

## 小程序验证
- 设置页“修改用户名”点击后弹窗，成功后关闭并刷新当前用户名
- 设置页密码项：
  - 微信新用户显示首次设密文案，不显示原密码输入框
  - 已设密码用户显示修改密码文案，保留原密码输入框
- 弹窗“取消 / 确认”按钮文字在真机上垂直居中
- 会员区联系人文案正确显示为“西柚 / 915981048”
- 会员到期时间显示为 `YYYY-MM-DD HH:mm:ss`

## PC 验证
- 微信新用户未设密前，用用户名+密码登录时，页面能显示后端返回的引导提示
- 同一用户在小程序设密后，再回 PC 使用用户名+密码可以正常登录
- 原有 PC 普通用户登录不受影响
