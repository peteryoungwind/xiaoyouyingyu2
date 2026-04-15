# 小柚英语 (xiaoyouyingyu) — AI 协作开发文档

> 版本：1.1-SNAPSHOT | 最后更新：2026-04-15
>
> 这份文档不是产品宣传稿，而是给后续 AI / 开发者快速上手代码结构用的。
> 重点回答 4 个问题：
> 1. 项目现在有哪些子系统
> 2. 核心代码分别在哪
> 3. 改一个功能应该先看哪些文件
> 4. 前后端数据是怎么流动的

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈](#2-技术栈)
3. [当前代码结构总览](#3-当前代码结构总览)
4. [后端结构梳理](#4-后端结构梳理)
5. [前端结构梳理](#5-前端结构梳理)
6. [微信小程序结构](#6-微信小程序结构)
7. [数据模型与数据库映射](#7-数据模型与数据库映射)
8. [认证、权限与会员机制](#8-认证权限与会员机制)
9. [AI 能力与调用链](#9-ai-能力与调用链)
10. [关键接口分组](#10-关键接口分组)
11. [高频改动场景索引](#11-高频改动场景索引)
12. [构建与联调](#12-构建与联调)
13. [风险点与注意事项](#13-风险点与注意事项)

---

## 1. 项目概览

**小柚英语** 当前已经不是单一的“话题管理站点”，而是一个包含 **Web 前端 + Spring Boot 后端 + 微信小程序** 的英语口语练习系统，主要由以下几块组成：

### 1.1 核心业务模块

- **话题系统**：中英双语话题、日期、分类、问题列表、日历分布、搜索筛选
- **学习中心**：围绕话题生成热身、词汇、表达、任务、AI 点评
- **管理后台**：AI 生成话题、手动建题、话题管理、用户管理、模型管理
- **会员系统**：会员到期时间、注册赠送会员、后台赠送会员、会员状态判断
- **卡密系统**：生成卡密、分页查看、禁用卡密、用户兑换卡密
- **微信登录系统**：
  - 小程序 `code -> openid` 登录
  - PC 端二维码登录，会在小程序侧确认
- **分类体系**：话题标签不再是完全自由输入，已收敛到固定分类集合

### 1.2 当前系统边界

当前仓库包含 3 个主要运行单元：

1. **Spring Boot 后端**：负责认证、权限、数据、AI 调用、会员/卡密/微信登录逻辑
2. **Next.js Web 前端**：管理后台、学习中心、设置页、用户/卡密管理
3. **微信小程序**：移动端访问、扫码确认 PC 登录、会员相关入口

---

## 2. 技术栈

### 2.1 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 21 | 编程语言 |
| Spring Boot | 3.2.5 | 应用框架 |
| Spring Security | - | 认证与授权 |
| Spring Data JPA | - | ORM / Repository |
| Spring Validation | - | 参数校验 |
| MySQL | 8.0+ | 主数据库 |
| HikariCP | - | 连接池 |
| JJWT | 0.12.5 | JWT |
| Jackson | - | JSON 解析 |
| Lombok | - | 简化样板代码 |
| Maven | - | 构建工具 |

### 2.2 Web 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.0 | React 框架 |
| React | 18.3.0 | UI |
| TypeScript | 5.5.0 | 类型约束 |
| Tailwind CSS | 3.4.0 | 样式系统 |
| TanStack React Query | 5.50.0 | 服务端状态管理 |
| Lucide React | 0.400.0 | 图标 |
| qrcode.react | - | PC 微信登录二维码 |

### 2.3 小程序

| 技术 | 用途 |
|------|------|
| 微信小程序原生 | 移动端 UI 与交互 |
| 云函数 | 小程序端辅助能力 |

---

## 3. 当前代码结构总览

```text
xiaoyouyingyu2/
├── CLAUDE.md
├── pom.xml
├── src/main/
│   ├── java/com/xiaoyouyingyu/
│   │   ├── Application.java
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── resources/
│       └── application.yml
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── app/
│       ├── components/
│       └── lib/
├── xiaochengxu/
│   ├── miniprogram/
│   ├── cloudfunctions/
│   └── project.config.json
└── frontend.zip   # 当前是未跟踪文件，不属于正式代码结构
```

### 3.1 AI 修改代码时，优先关注的入口文件

如果后续 AI 要改功能，优先从这些文件切入：

#### 后端核心入口

- `src/main/java/com/xiaoyouyingyu/controller/AuthController.java`
- `src/main/java/com/xiaoyouyingyu/controller/AdminController.java`
- `src/main/java/com/xiaoyouyingyu/controller/LearningController.java`
- `src/main/java/com/xiaoyouyingyu/controller/MembershipController.java`
- `src/main/java/com/xiaoyouyingyu/service/AiService.java`
- `src/main/java/com/xiaoyouyingyu/service/MembershipService.java`
- `src/main/java/com/xiaoyouyingyu/service/PcWechatLoginService.java`
- `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
- `src/main/java/com/xiaoyouyingyu/config/TopicCategoryConstants.java`

#### 前端核心入口

- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.tsx`
- `frontend/src/app/admin/page.tsx`
- `frontend/src/app/learning-center/topic/[id]/page.tsx`
- `frontend/src/app/topics/page.tsx`
- `frontend/src/app/topic/[id]/page.tsx`
- `frontend/src/app/users/page.tsx`
- `frontend/src/app/settings/page.tsx`
- `frontend/src/app/redeem-codes/page.tsx`
- `frontend/src/components/auth-modal.tsx`
- `frontend/src/components/sidebar.tsx`
- `frontend/src/lib/tag-colors.ts`

#### 小程序核心入口

- `xiaochengxu/miniprogram/utils/api.js`
- `xiaochengxu/miniprogram/utils/auth.js`
- `xiaochengxu/miniprogram/pages/login/index.js`
- `xiaochengxu/miniprogram/pages/profile/index.js`
- `xiaochengxu/miniprogram/pages/redeem/index.js`

---

## 4. 后端结构梳理

后端基础包：`src/main/java/com/xiaoyouyingyu/`

### 4.1 目录职责

#### `config/`

- `SecurityConfig.java`
  - Spring Security 配置
  - 定义公开接口、管理员接口、学习中心权限
  - 配置 CORS
- `DataInit.java`
  - 启动时确保 `admin` 用户存在
  - 当前逻辑会重置管理员密码为 `admin123`
- `TopicCategoryConstants.java`
  - 统一话题分类常量
  - 对标签做合法性校验与标准排序

#### `controller/`

- `AuthController.java`
  - 注册 / 登录 / 改用户名 / 改密码 / 首次设密
  - 微信小程序登录
  - PC 微信扫码登录流程
- `TopicController.java`
  - 公开话题接口：列表、详情、标签统计、坚持天数、日历
- `AdminController.java`
  - 话题 CRUD
  - 用户管理
  - AI 生成标题 / 问题
  - AI 模型管理
  - 卡密管理
  - 后台会员管理
- `LearningController.java`
  - 学习中心接口：热身 / 词汇 / 表达 / 任务 / 点评
- `MembershipController.java`
  - 当前用户会员信息
  - 会员联系信息
  - 卡密兑换

#### `entity/`

- `User.java`
- `Topic.java`
- `AiModel.java`
- `RedeemCode.java`
- `MembershipRecord.java`

#### `repository/`

- `UserRepository.java`
- `TopicRepository.java`
- `AiModelRepository.java`
- `RedeemCodeRepository.java`
- `MembershipRecordRepository.java`

#### `service/`

- `AiService.java`
  - AI 统一调用层
- `MembershipService.java`
  - 会员赠送、追加、卡密兑换、后台操作记录
- `PcWechatLoginService.java`
  - PC 微信扫码登录会话管理

#### `security/`

- `JwtUtils.java`
- `JwtFilter.java`

#### `dto/`

- `AuthRequest.java`
- `AuthResponse.java`

---

### 4.2 后端按职责理解

#### 1）认证相关

看：
- `AuthController.java`
- `JwtUtils.java`
- `JwtFilter.java`
- `SecurityConfig.java`
- `User.java`

#### 2）会员 / 卡密相关

看：
- `MembershipController.java`
- `MembershipService.java`
- `RedeemCode.java`
- `MembershipRecord.java`
- `User.java`
- `AdminController.java`

#### 3）AI 相关

看：
- `AiService.java`
- `AdminController.java`
- `LearningController.java`
- `AiModel.java`
- `AiModelRepository.java`

#### 4）话题相关

看：
- `TopicController.java`
- `AdminController.java`
- `Topic.java`
- `TopicRepository.java`
- `TopicCategoryConstants.java`

---

### 4.3 关键后端类说明

#### `AuthController.java`

当前职责已经明显超出“普通登录接口”，包括：

- `POST /api/auth/register`
- `POST /api/auth/login`
- `PUT /api/auth/username`
- `PUT /api/auth/password`
- `PUT /api/auth/password/setup`
- `POST /api/auth/wechat-login`
- `POST /api/auth/wechat-pc-login/session`
- `GET /api/auth/wechat-pc-login/session/{ticketId}`
- `GET /api/auth/wechat-pc-login/scene/{ticketId}`
- `POST /api/auth/wechat-pc-login/confirm`
- `POST /api/auth/wechat-pc-login/cancel`

返回的认证信息不再只有 `token + username + role`，还包含：

- `membershipExpireAt`
- `membershipActive`
- `hasPassword`

#### `AdminController.java`

这是管理员主入口，包含 5 大块：

1. **话题管理**
2. **用户管理**
3. **AI 生成**
4. **AI 模型管理**
5. **卡密 / 会员管理**

也就是说，后续任何“后台功能扩展”，大概率都要先看它。

#### `MembershipService.java`

会员逻辑集中在这里，当前包括：

- 注册赠送 3 天会员
- 卡密兑换
- 后台设置会员到期时间
- 后台追加会员天数
- 记录会员变更历史
- 批量生成卡密

#### `PcWechatLoginService.java`

这是一个内存态的 PC 登录票据服务，负责管理：

- `PENDING`
- `CONFIRMED`
- `CANCELLED`
- `EXPIRED`
- `CONSUMED`

后续如果 PC 扫码登录出现问题，优先检查这个类和 `AuthController.java` 的对应接口。

---

## 5. 前端结构梳理

前端基础目录：`frontend/src/`

### 5.1 app 路由层

#### `app/layout.tsx`

全局布局，负责挂载：
- `Providers`
- `Sidebar`
- `TopBar`

#### `app/page.tsx`

首页 / 仪表盘：
- 统计信息
- 标签分类
- 日历预览
- 最新话题

#### `app/topics/page.tsx`

话题列表页：
- 搜索
- 分类筛选
- 分页
- 日期范围

#### `app/topic/[id]/page.tsx`

话题详情页：
- 详情展示
- 题目展示
- 学习中心入口
- 管理员可直接编辑

#### `app/admin/page.tsx`

管理员主工作台，当前是一个多 Tab 页面，至少包含：
- AI 生成话题
- 手动创建话题
- 话题列表管理
- 用户列表管理
- AI 模型管理

如果后续要改“后台功能流程”，先看这个页面。

#### `app/calendar/page.tsx`

日历视图：
- 按月加载数据
- 按日期查看对应主题

#### `app/learning-center/page.tsx`

学习中心主题入口页：
- 会员可访问
- 搜索 / 分类筛选

#### `app/learning-center/topic/[id]/page.tsx`

学习中心主页面，是学习功能最核心的前端页：
- 模式切换
- 热身内容
- 词汇
- 表达模板
- 练习任务
- AI 点评

#### `app/users/page.tsx`

独立的用户管理页：
- 用户角色修改
- 删除用户
- 会员状态展示
- 会员追加天数 / 直接设过期时间

#### `app/settings/page.tsx`

设置页当前不只是“改密码”，还包括：
- 会员信息展示
- 联系管理员购买 / 续费
- 卡密兑换
- 修改密码

#### `app/redeem-codes/page.tsx`

卡密管理页：
- 批量生成卡密
- 分页查看卡密
- 按状态筛选
- 禁用卡密

---

### 5.2 components 组件层

#### `components/sidebar.tsx`

主导航入口，决定当前 Web 端可见页面。

当前导航包含：
- `/`
- `/topics`
- `/calendar`
- `/learning-center`
- `/admin`（管理员）
- `/users`（管理员）
- `/redeem-codes`（管理员）
- `/settings`

#### `components/top-bar.tsx`

顶部用户栏，负责：
- 登录入口
- 用户状态展示
- 管理员 / 会员标签
- 退出登录

#### `components/auth-modal.tsx`

登录弹窗是当前认证前端核心，支持两种模式：
- 账号密码登录 / 注册
- 微信扫码 PC 登录

其中扫码模式会：
1. 创建 ticket
2. 展示二维码
3. 轮询登录状态
4. 成功后写入本地 auth 状态

#### `components/providers.tsx`

挂载全局 Provider：
- React Query
- AuthProvider
- ToastProvider

#### `components/toast-provider.tsx`

轻量提示系统。

#### `components/calendar.tsx`

日历 UI 复用组件。

---

### 5.3 lib 公共逻辑层

#### `lib/api.ts`

这是前端最关键的文件之一，几乎所有请求都从这里出去。

当前特点：

- 默认 API 基地址：`/api`
- 支持 `direct: true` 时直连后端：
  - 开发环境：`http://localhost:8080/api`
  - 生产环境：`https://xiaoyou-ky.top/api`
- 自动注入 JWT Token
- 自动统一错误处理
- `401` 时自动清理本地登录态并触发 `auth:expired`

如果接口改动了，通常需要同时改这里。

#### `lib/auth.tsx`

Web 端认证上下文。

当前本地持久化字段包括：
- `token`
- `username`
- `role`
- `membershipExpireAt`
- `membershipActive`
- `hasPassword`

重要点：
- `isPremium` 不是单纯靠角色判断
- `isPremium = isAdmin || membershipActive`

#### `lib/tag-colors.ts`

分类系统中心文件。

负责：
- 分类顺序
- 标签解析
- 已知分类标准化
- 分类颜色映射

当前固定分类为：
- 个人成长
- 情绪心理
- 人际交往
- 生活方式
- 职场发展
- 学习提升
- 文化旅行
- 消费科技

后续如果改“分类 / 标签 / 颜色 / 筛选顺序”，前后端都要同步改：
- 后端：`TopicCategoryConstants.java`
- 前端：`tag-colors.ts`

---

## 6. 微信小程序结构

目录：`xiaochengxu/`

这部分已经是仓库正式组成部分，不能再忽略。

### 6.1 顶层结构

```text
xiaochengxu/
├── cloudfunctions/
│   ├── api/
│   └── quickstartFunctions/
├── miniprogram/
│   ├── app.js
│   ├── app.json
│   ├── pages/
│   ├── components/
│   ├── custom-tab-bar/
│   └── utils/
├── project.config.json
└── README.md
```

### 6.2 小程序页面

#### `pages/home/`
首页

#### `pages/topics/`
话题列表

#### `pages/topicDetail/`
话题详情

#### `pages/calendar/`
日历页

#### `pages/learning/`
学习中心列表

#### `pages/learningTopic/`
单个学习主题页

#### `pages/login/`
登录页，和 Web 端扫码登录联动

#### `pages/register/`
注册页

#### `pages/profile/`
个人中心 / 会员相关入口

#### `pages/settings/`
设置页

#### `pages/redeem/`
卡密兑换页

### 6.3 小程序工具层

#### `utils/api.js`
小程序 API 封装

#### `utils/auth.js`
小程序登录态管理

#### `utils/request.js`
请求层

如果后续是改微信登录、扫码确认、会员页，小程序目录必须一起看。

---

## 7. 数据模型与数据库映射

> 这里写的是**当前代码实际反映出的核心字段**，不是历史版本结构。

### 7.1 `users` 表 / `User.java`

文件：`src/main/java/com/xiaoyouyingyu/entity/User.java`

| 字段 | 说明 |
|------|------|
| `id` | 用户 ID |
| `username` | 用户名 |
| `password` | 密码哈希 |
| `hasPassword` | 是否已设置密码，微信创建账号时可能为 `false` |
| `wechatOpenid` | 微信 openid |
| `role` | `ADMIN` / `PREMIUM_USER` / `USER` |
| `membershipExpireAt` | 会员到期时间 |
| `membershipSource` | 会员来源 |
| `membershipUpdatedAt` | 会员更新时间 |
| `createdAt` | 创建时间 |

注意：
- `PREMIUM_USER` 角色仍然存在
- 但实际学习中心权限还会结合 `membershipExpireAt` 动态生成 `ROLE_MEMBER`
- `admin` 视为永远会员

### 7.2 `topics` 表 / `Topic.java`

| 字段 | 说明 |
|------|------|
| `id` | 主题 ID |
| `title` | 英文标题 |
| `titleZh` | 中文标题 |
| `tags` | 分类字符串，逗号分隔 |
| `eventDate` | 日期 |
| `questions` | JSON 字符串 |
| `creatorId` | 创建者 ID |
| `createdAt` | 创建时间 |

### 7.3 `ai_models` 表 / `AiModel.java`

存储可切换的 AI 模型配置：
- 显示名称
- API 地址
- API Key
- 模型名称
- 是否默认模型

### 7.4 `redeem_codes` 表 / `RedeemCode.java`

用于会员卡密系统，核心包含：
- 卡密字符串
- 名称
- 增加天数
- 状态
- 过期时间
- 使用人
- 使用时间
- 备注
- 创建人

### 7.5 `membership_records` 表 / `MembershipRecord.java`

会员变更历史表，用于记录：
- 注册赠送
- 卡密兑换
- 后台直接设置
- 后台追加天数

---

## 8. 认证、权限与会员机制

### 8.1 JWT 机制

基础仍然是 JWT：
- 登录 / 注册成功后签发 token
- 前端保存在 localStorage
- 后续请求自动带 `Authorization: Bearer <token>`

### 8.2 当前权限规则

文件：`src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`

#### 公开接口

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/wechat-login`
- `/api/auth/wechat-pc-login/session`
- `/api/auth/wechat-pc-login/session/*`
- `/api/topics`
- `/api/topics/calendar`
- `/api/topics/tags`
- `/api/topics/stats`
- `/api/topics/{id}`
- `/api/user/membership-contact`

#### 管理员接口

- `/api/admin/**` -> `ROLE_ADMIN`

#### 学习中心接口

- `/api/learning/**` -> `ROLE_PREMIUM_USER` / `ROLE_ADMIN` / `ROLE_MEMBER`

### 8.3 `ROLE_MEMBER` 的意义

`User.Role` 枚举里没有 `MEMBER`，但 `JwtFilter` 会根据当前用户会员状态动态补充权限。

也就是说，学习中心访问权不只由 `role` 决定，还由：
- `membershipExpireAt`
- `isMembershipActive()`

共同决定。

### 8.4 CORS 当前配置

当前允许来源：
- `http://localhost:3000`
- `http://localhost:3001`
- `https://xiaoyou-ky.top`
- `http://xiaoyou-ky.top`

---

## 9. AI 能力与调用链

### 9.1 后端 AI 中心

文件：`src/main/java/com/xiaoyouyingyu/service/AiService.java`

统一负责：
- 旧版多轮话题生成
- 批量生成标题
- 根据标题生成问题
- 学习中心热身内容生成
- 词汇生成
- 表达模板生成
- 任务生成
- AI 点评

### 9.2 AI 模型切换

模型配置通过数据库管理：
- 默认模型可切换
- 每次请求可带 `modelId`
- 管理入口在 Web 后台 `admin/page.tsx`

### 9.3 Web 端 AI 生成流程

#### 话题 AI 生成

入口：`frontend/src/app/admin/page.tsx`

流程：
1. 输入 prompt
2. 调用 `api.aiGenerateTitles()`
3. 选一个标题
4. 调用 `api.aiGenerateQuestions()`
5. 勾选保留的问题
6. 填写日期 / 分类
7. 调用 `api.createTopic()` 保存

#### 学习中心 AI 生成

入口：`frontend/src/app/learning-center/topic/[id]/page.tsx`

流程：
1. 获取主题
2. 切换模式（beginner / advanced 等）
3. 分别请求 warmup / vocabulary / expressions / tasks / review
4. 前端解析返回的 `content` JSON 字符串并展示

---

## 10. 关键接口分组

这里只列“结构理解”最重要的接口分组，不展开完整示例。

### 10.1 认证接口

#### 普通认证
- `POST /api/auth/register`
- `POST /api/auth/login`
- `PUT /api/auth/username`
- `PUT /api/auth/password`
- `PUT /api/auth/password/setup`

#### 微信登录
- `POST /api/auth/wechat-login`

#### PC 微信扫码登录
- `POST /api/auth/wechat-pc-login/session`
- `GET /api/auth/wechat-pc-login/session/{ticketId}`
- `GET /api/auth/wechat-pc-login/scene/{ticketId}`
- `POST /api/auth/wechat-pc-login/confirm`
- `POST /api/auth/wechat-pc-login/cancel`

### 10.2 公开话题接口

- `GET /api/topics`
- `GET /api/topics/{id}`
- `GET /api/topics/tags`
- `GET /api/topics/stats`
- `GET /api/topics/calendar`

### 10.3 管理后台接口

#### 话题
- `POST /api/admin/topics`
- `PUT /api/admin/topics/{id}`
- `DELETE /api/admin/topics/{id}`

#### 用户
- `GET /api/admin/users`
- `DELETE /api/admin/users/{id}`
- `PUT /api/admin/users/{id}/role`

#### AI
- `POST /api/admin/ai/generate`
- `POST /api/admin/ai/generate-titles`
- `POST /api/admin/ai/generate-questions`

#### AI 模型
- `GET /api/admin/ai/models`
- `POST /api/admin/ai/models`
- `PUT /api/admin/ai/models/{id}`
- `DELETE /api/admin/ai/models/{id}`

#### 卡密
- `POST /api/admin/redeem-codes`
- `GET /api/admin/redeem-codes`
- `PATCH /api/admin/redeem-codes/{id}/disable`

#### 会员
- `PATCH /api/admin/users/{id}/membership-expire-at`
- `POST /api/admin/users/{id}/membership-add-days`
- `GET /api/admin/users/{id}/membership-records`

### 10.4 学习中心接口

- `GET /api/learning/topic/{id}`
- `POST /api/learning/warmup`
- `POST /api/learning/vocabulary`
- `POST /api/learning/expressions`
- `POST /api/learning/tasks`
- `POST /api/learning/review`

### 10.5 会员接口

- `GET /api/user/membership`
- `GET /api/user/membership-contact`
- `POST /api/redeem-codes/redeem`

---

## 11. 高频改动场景索引

这一节是给 AI 最实用的“改功能导航”。

### 11.1 改登录逻辑

先看：
- 后端：`AuthController.java` `SecurityConfig.java` `JwtFilter.java` `User.java`
- 前端：`frontend/src/components/auth-modal.tsx` `frontend/src/lib/auth.tsx` `frontend/src/lib/api.ts`
- 小程序：`xiaochengxu/miniprogram/pages/login/index.js` `xiaochengxu/miniprogram/utils/auth.js`

### 11.2 改会员逻辑

先看：
- 后端：`MembershipController.java` `MembershipService.java` `User.java` `MembershipRecord.java`
- 前端：`frontend/src/app/settings/page.tsx` `frontend/src/app/users/page.tsx` `frontend/src/lib/auth.tsx` `frontend/src/lib/api.ts`
- 小程序：`pages/profile` `pages/redeem`

### 11.3 改卡密逻辑

先看：
- 后端：`AdminController.java` `MembershipController.java` `MembershipService.java` `RedeemCode.java`
- 前端：`frontend/src/app/redeem-codes/page.tsx` `frontend/src/app/settings/page.tsx` `frontend/src/lib/api.ts`
- 小程序：`pages/redeem`

### 11.4 改话题分类 / 标签体系

前后端要一起改：
- 后端：`TopicCategoryConstants.java`
- 前端：`tag-colors.ts`
- 相关页面：`page.tsx` `topics/page.tsx` `admin/page.tsx`

### 11.5 改学习中心功能

先看：
- 后端：`LearningController.java` `AiService.java`
- 前端：`frontend/src/app/learning-center/page.tsx` `frontend/src/app/learning-center/topic/[id]/page.tsx` `frontend/src/lib/api.ts`

### 11.6 改后台 AI 生成流程

先看：
- 后端：`AdminController.java` `AiService.java` `AiModelRepository.java`
- 前端：`frontend/src/app/admin/page.tsx` `frontend/src/lib/api.ts`

### 11.7 改用户管理

先看：
- 后端：`AdminController.java` `User.java` `UserRepository.java`
- 前端：`frontend/src/app/users/page.tsx`

### 11.8 改 Web 导航或权限入口

先看：
- `frontend/src/components/sidebar.tsx`
- `frontend/src/components/top-bar.tsx`
- `frontend/src/lib/auth.tsx`

---

## 12. 构建与联调

### 12.1 后端

```bash
mvn clean package
java -jar target/xiaoyouyingyu-1.0-SNAPSHOT.jar
```

### 12.2 前端

```bash
cd frontend
npm install
npm run dev
```

### 12.3 前后端联调

前端默认通过 `/api` 访问接口。

但 `frontend/src/lib/api.ts` 中部分请求会通过 `direct: true` 直连后端：
- 开发环境：`http://localhost:8080/api`
- 生产环境：`https://xiaoyou-ky.top/api`

所以排查“本地能用、线上不能用”时，先看是不是走了 `direct` 模式。

### 12.4 小程序

目录：`xiaochengxu/`

一般通过微信开发者工具打开 `project.config.json` 对应项目运行。

---

## 13. 风险点与注意事项

### 13.1 现存安全 / 配置风险

- `DataInit.java` 当前会在启动时重置管理员密码为 `admin123`
- 用户列表接口当前仍直接返回 `User`，存在暴露密码哈希风险
- `application.yml` 中的数据库、JWT、AI 配置应继续收敛到环境变量
- CORS 允许来源当前是硬编码

### 13.2 结构性注意点

- **标签不是自由文本**，要遵守固定分类集合
- **会员权限不是纯角色判断**，还依赖 `membershipExpireAt`
- **Web / 小程序 / 后端三端已经耦合**，改登录或会员时不要只改一端
- **前端很多请求统一走 `lib/api.ts`**，不要在页面里随意重复写 fetch
- **管理后台并不只管题目**，还承担模型、用户、会员、卡密等管理职责

### 13.3 给后续 AI 的建议

开始改动前，优先做这几步：

1. 先确认改动属于哪条业务线：认证 / 话题 / 学习中心 / 会员 / 卡密 / 小程序
2. 从本文件第 11 节找到对应入口文件
3. 优先读 `frontend/src/lib/api.ts` 和对应 controller，确认接口真实契约
4. 如果涉及分类、会员、扫码登录，默认按“前后端联动 + 小程序可能也要联动”来检查

---

## 附：当前固定分类

```text
个人成长
情绪心理
人际交往
生活方式
职场发展
学习提升
文化旅行
消费科技
```

## 附：当前最重要的 10 个文件

```text
src/main/java/com/xiaoyouyingyu/controller/AuthController.java
src/main/java/com/xiaoyouyingyu/controller/AdminController.java
src/main/java/com/xiaoyouyingyu/controller/MembershipController.java
src/main/java/com/xiaoyouyingyu/service/AiService.java
src/main/java/com/xiaoyouyingyu/service/MembershipService.java
frontend/src/lib/api.ts
frontend/src/lib/auth.tsx
frontend/src/app/admin/page.tsx
frontend/src/app/learning-center/topic/[id]/page.tsx
frontend/src/components/auth-modal.tsx
```

如果未来代码结构有较大变化，优先更新这份文档的：
- 第 3 节总结构
- 第 4/5/6 节模块结构
- 第 11 节高频改动索引
