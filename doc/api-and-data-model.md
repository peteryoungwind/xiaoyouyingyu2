# 接口与数据模型

> 最后更新：2026-05-25

## 基础约定

后端 API 前缀为 `/api`。

认证方式：

```http
Authorization: Bearer <token>
```

常见错误响应：

```json
{
  "error": "错误说明"
}
```

部分接口也可能返回：

```json
{
  "message": "提示信息"
}
```

## 权限说明

| 权限 | 说明 |
| --- | --- |
| 公开 | 不需要 token |
| 登录用户 | 需要有效 JWT |
| 会员 | 管理员、`PREMIUM_USER`，或会员未过期用户 |
| 管理员 | `ADMIN` |

## 认证接口

路径前缀：`/api/auth`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/register` | 公开 | 用户名密码注册 |
| POST | `/login` | 公开 | 用户名密码登录 |
| PUT | `/username` | 登录用户 | 修改用户名 |
| PUT | `/password` | 登录用户 | 修改密码 |
| PUT | `/password/setup` | 登录用户 | 微信用户首次设置密码 |
| POST | `/wechat-login` | 公开 | 小程序微信 code 登录 |
| POST | `/wechat-pc-login/session` | 公开 | PC 创建微信扫码登录 session |
| GET | `/wechat-pc-login/session/{ticketId}` | 公开 | PC 轮询扫码登录结果 |
| GET | `/wechat-pc-login/scene/{ticketId}` | 登录用户且绑定微信 | 小程序查询 PC 登录场景 |
| POST | `/wechat-pc-login/confirm` | 登录用户且绑定微信 | 小程序确认 PC 登录 |
| POST | `/wechat-pc-login/cancel` | 登录用户且绑定微信 | 小程序取消 PC 登录 |

### 注册/登录请求

```json
{
  "username": "user001",
  "password": "123456"
}
```

### 认证响应

```json
{
  "token": "jwt-token",
  "username": "user001",
  "role": "USER",
  "membershipExpireAt": "2026-05-28T10:00:00",
  "membershipActive": true,
  "hasPassword": true
}
```

## 话题接口

路径前缀：`/api/topics`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `` | 公开，搜索需登录 | 分页查询话题 |
| GET | `/{id}` | 公开 | 查询话题详情 |
| GET | `/tags` | 公开 | 查询标签统计 |
| GET | `/stats` | 公开 | 查询坚持天数 |
| GET | `/calendar` | 公开 | 查询某月日历数据 |

### 话题列表参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 页码，从 0 开始，默认 0 |
| `size` | number | 每页数量，默认 10 |
| `keyword` | string | 关键词，游客不可用 |
| `tag` | string | 分类标签 |
| `startDate` | date | 开始日期 |
| `endDate` | date | 结束日期 |

### 话题对象

```json
{
  "id": 1,
  "title": "After-work Time",
  "titleZh": "下班后的时间安排",
  "tags": "生活习惯,自我成长",
  "eventDate": "2026-05-25",
  "questions": "[{\"en\":\"What do you usually do after work?\",\"zh\":\"你下班后通常做什么？\"}]",
  "creatorId": 1,
  "createdAt": "2026-05-25T10:00:00"
}
```

## 学习接口

路径前缀：`/api/learning`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/topic/{id}` | 会员 | 获取学习主题详情 |
| POST | `/warmup` | 会员 | 生成热身内容 |
| POST | `/vocabulary` | 会员 | 生成主题词汇 |
| POST | `/expressions` | 会员 | 生成表达模板 |
| POST | `/tasks` | 会员 | 生成练习任务 |
| POST | `/review` | 会员 | 点评用户回答 |

### 学习生成请求

```json
{
  "titleEn": "After-work Time",
  "titleZh": "下班后的时间安排",
  "mode": "beginner",
  "exclude": "可选，已有内容，用于换一批去重"
}
```

### 点评请求

```json
{
  "titleEn": "After-work Time",
  "titleZh": "下班后的时间安排",
  "taskTitle": "Talk about your routine",
  "answer": "I usually take a walk after work.",
  "mode": "beginner"
}
```

### AI 内容响应

学习接口统一返回：

```json
{
  "content": "{\"vocabulary\":[...]}"
}
```

前端和小程序需要再解析 `content` 中的 JSON 字符串。

## 会员接口

路径前缀：`/api`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/user/membership` | 登录用户 | 当前用户会员状态 |
| GET | `/user/membership-contact` | 公开 | 开通会员联系信息 |
| POST | `/redeem-codes/redeem` | 登录用户 | 兑换卡密 |

### 会员状态响应

```json
{
  "role": "USER",
  "membershipActive": true,
  "membershipExpireAt": "2026-06-24T10:00:00",
  "remainingDays": 29,
  "membershipSource": "REDEEM_CODE",
  "isAdmin": false
}
```

### 兑换卡密请求

```json
{
  "code": "ABCD1234EFGH5678"
}
```

## 管理接口

路径前缀：`/api/admin`

所有接口需要管理员权限。

### 话题管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/topics` | 创建话题 |
| PUT | `/topics/{id}` | 更新话题 |
| DELETE | `/topics/{id}` | 删除话题 |

### 用户管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/users` | 用户列表 |
| DELETE | `/users/{id}` | 删除用户 |
| PUT | `/users/{id}/role` | 修改用户角色 |
| PATCH | `/users/{id}/membership-expire-at` | 设置会员到期时间 |
| POST | `/users/{id}/membership-add-days` | 追加会员天数 |
| GET | `/users/{id}/membership-records` | 查询会员流水 |

### AI 管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/ai/generate` | 旧版通用 AI 生成 |
| POST | `/ai/generate-titles` | 生成 5 个主题标题 |
| POST | `/ai/generate-questions` | 为标题生成 10 个讨论问题 |
| GET | `/ai/models` | AI 模型列表 |
| POST | `/ai/models` | 新增 AI 模型 |
| PUT | `/ai/models/{id}` | 更新 AI 模型 |
| DELETE | `/ai/models/{id}` | 删除 AI 模型 |

### 卡密管理

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/redeem-codes` | 批量生成卡密 |
| GET | `/redeem-codes` | 分页查询卡密 |
| PATCH | `/redeem-codes/{id}/disable` | 禁用卡密 |

## 数据模型

当前线上表结构应以 JPA 实体为准。`schema.sql` 是早期初始化参考，不完整覆盖当前会员、AI 模型、微信登录等字段。

### `users`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `username` | VARCHAR(50) | 用户名，唯一 |
| `password` | VARCHAR | BCrypt 密码，可为空或系统生成 |
| `has_password` | BOOLEAN | 是否已设置可用密码 |
| `wechat_openid` | VARCHAR | 微信 openid，唯一 |
| `role` | VARCHAR(20) | `ADMIN`、`PREMIUM_USER`、`USER` |
| `membership_expire_at` | DATETIME | 会员到期时间 |
| `membership_source` | VARCHAR(30) | 会员来源 |
| `membership_updated_at` | DATETIME | 会员更新时间 |
| `created_at` | DATETIME | 创建时间 |

### `topics`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `title` | VARCHAR(200) | 英文标题 |
| `title_zh` | VARCHAR(200) | 中文标题 |
| `tags` | VARCHAR(255) | 逗号分隔分类 |
| `event_date` | DATE | 话题日期 |
| `questions` | JSON | 中英双语问题数组 |
| `creator_id` | BIGINT | 创建者 ID |
| `created_at` | DATETIME | 创建时间 |

### `ai_models`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `name` | VARCHAR(100) | 显示名称 |
| `api_url` | VARCHAR(500) | OpenAI 兼容接口地址 |
| `api_key` | VARCHAR(500) | API Key |
| `model_name` | VARCHAR(200) | 模型名 |
| `is_default` | BOOLEAN | 是否默认 |
| `created_at` | DATETIME | 创建时间 |

### `redeem_codes`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `code` | VARCHAR(64) | 卡密码，唯一 |
| `name` | VARCHAR(100) | 卡密名称 |
| `days` | INT | 兑换后增加天数 |
| `expire_at` | DATETIME | 卡密自身过期时间 |
| `status` | VARCHAR(20) | `ACTIVE`、`USED`、`DISABLED` |
| `used_by` | BIGINT | 使用者 ID |
| `used_at` | DATETIME | 使用时间 |
| `remark` | VARCHAR(255) | 备注 |
| `created_by` | BIGINT | 创建者 ID |
| `created_at` | DATETIME | 创建时间 |

### `membership_records`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `user_id` | BIGINT | 用户 ID |
| `change_type` | VARCHAR(30) | `REGISTER_GIFT`、`REDEEM_CODE`、`ADMIN_SET`、`ADMIN_ADD` |
| `days` | INT | 变更天数 |
| `before_expire_at` | DATETIME | 变更前到期时间 |
| `after_expire_at` | DATETIME | 变更后到期时间 |
| `related_code_id` | BIGINT | 关联卡密 ID |
| `operator_id` | BIGINT | 操作人 ID |
| `remark` | VARCHAR(255) | 备注 |
| `created_at` | DATETIME | 创建时间 |

## 固定话题分类

后端 `TopicCategoryConstants` 只允许以下分类：

- 自我成长
- 情绪心理
- 人际沟通
- 生活习惯
- 学习方法
- 职场发展
- 文化旅行
- 兴趣娱乐
- 消费科技

创建或更新话题时，后端会：

- 去掉空标签。
- 去重。
- 校验是否在允许列表内。
- 按固定顺序重新拼接。

