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

## 单词练习接口

### 管理端单词接口

路径前缀：`/api/admin`

所有接口需要管理员权限。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/word-books` | 分页查询单词本 |
| POST | `/word-books` | 创建单词本 |
| GET | `/word-books/{id}` | 查询单词本详情与统计 |
| PUT | `/word-books/{id}` | 更新单词本 |
| PATCH | `/word-books/{id}/publish` | 发布单词本 |
| PATCH | `/word-books/{id}/offline` | 下架单词本 |
| DELETE | `/word-books/{id}` | 软删除单词本 |
| GET | `/word-books/{id}/words` | 查询单词列表 |
| POST | `/word-books/{id}/words` | 新增单词，可选 `ttsModelId` 查询参数 |
| PUT | `/words/{wordId}` | 更新单词 |
| DELETE | `/words/{wordId}` | 软删除单词 |
| POST | `/word-books/{id}/generate-by-scene` | AI 按场景生成单词并保存，可传 `ttsModelId` |
| POST | `/word-books/{id}/generate-by-topics` | AI 按口语主题生成单词并保存，可传 `ttsModelId` |
| POST | `/word-books/generation-tasks/scene` | 创建“按场景生成单词本”的后台任务，立即返回任务状态 |
| POST | `/word-books/generation-tasks/topics` | 创建“按主题生成单词本”的后台任务，立即返回任务状态 |
| GET | `/word-books/generation-tasks` | 查询最近后台生成任务及进度 |
| GET | `/word-books/generation-tasks/{taskId}` | 查询单个后台生成任务进度 |
| POST | `/words/batch-publish` | 批量发布单词 |
| POST | `/words/batch-offline` | 批量下架单词 |
| POST | `/words/batch-delete` | 批量软删除单词 |
| POST | `/words/batch-sort` | 批量调整排序 |
| POST | `/words/batch-regenerate-audio` | 批量重新生成音频，可传 `ttsModelId` |
| GET | `/tts-models` | 查询 TTS 模型配置 |
| POST | `/tts-models` | 新增 TTS 模型配置 |
| PUT | `/tts-models/{id}` | 更新 TTS 模型配置 |
| DELETE | `/tts-models/{id}` | 删除 TTS 模型配置 |
| PATCH | `/tts-models/{id}/default` | 设置默认 TTS 模型 |

单词列表支持参数：`page`、`size`、`difficulty`、`status`、`sourceTopicId`、`keyword`。

### 用户端单词接口

路径前缀：`/api/word-practice`

权限：登录用户。单词练习不再限制会员状态，普通 `USER`、`PREMIUM_USER` 和 `ADMIN` 只要携带有效 JWT 均可使用。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/books` | 查询已发布单词本与当前用户初级进度 |
| GET | `/books/{bookId}` | 查询单词本详情与指定难度进度 |
| GET | `/books/{bookId}/next` | 获取下一批练习词，优先到期复习词 |
| GET | `/words/{wordId}` | 查询已发布单词详情 |
| POST | `/words/{wordId}/answer` | 提交认识/不认识 |
| GET | `/books/{bookId}/progress` | 查询指定难度进度 |
| GET | `/books/{bookId}/words` | 查询当前用户已学单词 |

提交练习结果：

```json
{
  "result": "KNOWN"
}
```

`result` 可取 `KNOWN`、`FUZZY` 或 `UNKNOWN`。

复习规则：

- `KNOWN`：连续认识次数加 1；第 1、2、3 次分别安排 1 天、3 天、7 天后复习；连续 4 次认识后标记为 `MASTERED`。
- `FUZZY`：模糊次数加 1，连续认识次数重置为 0，次日复习。
- `UNKNOWN`：连续认识次数重置为 0，次日复习。

### 单词音频生成

后台通过 `tts_models` 配置 TTS 接口，可同时保存多个模型并通过默认模型或请求参数 `ttsModelId` 手动切换。

- `provider=openai`：OpenAI 兼容 TTS。`base_url` 可以填写供应商根路径，例如 `https://api.openai.com/v1`，后端会调用 `{base_url}/audio/speech`；也可以直接填写完整 `/audio/speech` 地址。
- `provider=qwen`、`dashscope` 或 `aliyun`：千问 Qwen-TTS。`base_url` 可以填写 `https://dashscope.aliyuncs.com/api/v1` 或完整 `.../services/aigc/multimodal-generation/generation` 地址。后端调用非流式接口，读取响应中的 `output.audio.url`，并立即下载音频保存到本地，避免使用 24 小时有效期的临时 URL。

新增单词、AI 生成单词和批量重新生成音频时，后端会为每个单词生成：

- 单词美式发音：`/uploads/word-audio/{wordBookId}/{wordId}/word-us.{format}`
- 单词英式发音：`/uploads/word-audio/{wordBookId}/{wordId}/word-uk.{format}`
- 例句美式发音：`/uploads/word-audio/{wordBookId}/{wordId}/example-us.{format}`
- 例句英式发音：`/uploads/word-audio/{wordBookId}/{wordId}/example-uk.{format}`

如果音频生成失败，单词文本仍会保存，`audio_status` 置为 `FAILED`，`audio_error` 记录错误，管理员可通过批量重新生成接口重试。

AI 创建单词本走后台任务：接口先创建单词本和 `word_generation_tasks` 记录，再异步执行“生成单词、保存单词、生成音频”。前端刷新页面不影响任务执行，可通过任务查询接口展示阶段、百分比、已保存单词数和音频生成进度。

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

### `tts_models`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `name` | VARCHAR(100) | 显示名称 |
| `base_url` | VARCHAR(500) | TTS API 根地址或完整接口地址。OpenAI 兼容模型支持 `/audio/speech`，Qwen-TTS 支持 DashScope `/services/aigc/multimodal-generation/generation` |
| `api_key` | VARCHAR(500) | API Key |
| `model_name` | VARCHAR(200) | TTS 模型名 |
| `provider` | VARCHAR(60) | 供应商标识，支持 `openai`、`qwen`、`dashscope`、`aliyun` |
| `voice_us` | VARCHAR(80) | 美式发音 voice |
| `voice_uk` | VARCHAR(80) | 英式发音 voice |
| `output_format` | VARCHAR(20) | 输出格式，默认 `mp3` |
| `is_default` | BOOLEAN | 是否默认 |
| `enabled` | BOOLEAN | 是否启用 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

### `word_books`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `name` | VARCHAR(120) | 单词本名称 |
| `description` | VARCHAR(1000) | 描述 |
| `scene` | VARCHAR(500) | 适用场景 |
| `status` | VARCHAR(20) | `DRAFT`、`PUBLISHED`、`OFFLINE` |
| `deleted` | BOOLEAN | 软删除 |
| `created_by` | BIGINT | 创建人 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

### `word_generation_tasks`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `word_book_id` | BIGINT | 目标单词本 ID |
| `type` | VARCHAR(20) | `SCENE` 或 `TOPICS` |
| `status` | VARCHAR(20) | `PENDING`、`RUNNING`、`COMPLETED`、`FAILED` |
| `stage` | VARCHAR(30) | `PENDING`、`GENERATING_WORDS`、`SAVING_WORDS`、`GENERATING_AUDIO`、`COMPLETED`、`FAILED` |
| `message` | VARCHAR(200) | 当前进度文案 |
| `progress` | INT | 0-100 进度百分比 |
| `total_words` | INT | AI 返回候选单词数 |
| `saved_words` | INT | 已保存单词数 |
| `skipped_words` | INT | 重复或字段不完整跳过数 |
| `audio_total` | INT | 待生成音频的单词数 |
| `audio_done` | INT | 已生成音频的单词数 |
| `error` | VARCHAR(1000) | 错误或跳过原因摘要 |
| `created_by` | BIGINT | 创建人 |
| `created_at` | DATETIME | 创建时间 |
| `started_at` | DATETIME | 开始时间 |
| `finished_at` | DATETIME | 完成/失败时间 |
| `updated_at` | DATETIME | 更新时间 |

### `word_book_topics`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `word_book_id` | BIGINT | 单词本 ID |
| `topic_id` | BIGINT | 口语主题 ID |
| `created_at` | DATETIME | 创建时间 |

唯一约束：`word_book_id + topic_id`。

### `words`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `word_book_id` | BIGINT | 单词本 ID |
| `word` | VARCHAR(120) | 英文单词或短语 |
| `normalized_word` | VARCHAR(120) | 去首尾空格并小写后的去重字段 |
| `difficulty` | VARCHAR(20) | `BEGINNER`、`ADVANCED` |
| `status` | VARCHAR(20) | `DRAFT`、`PUBLISHED`、`OFFLINE` |
| `phonetic` | VARCHAR(120) | 音标 |
| `part_of_speech` | VARCHAR(255) | 词性 |
| `definition_zh` | VARCHAR(1000) | 中文释义 |
| `definition_en` | VARCHAR(1000) | 英文释义 |
| `common_patterns` | VARCHAR(1200) | 常用搭配/句型 |
| `example_en` | VARCHAR(1200) | 英文例句 |
| `example_zh` | VARCHAR(1200) | 中文例句翻译 |
| `source_scene` | VARCHAR(500) | 来源场景 |
| `source_topic_id` | BIGINT | 来源口语主题 ID |
| `source_topic_title` | VARCHAR(300) | 来源口语主题标题 |
| `audio_us_url` | VARCHAR(500) | 单词美式发音 URL |
| `audio_uk_url` | VARCHAR(500) | 单词英式发音 URL |
| `example_audio_us_url` | VARCHAR(500) | 例句美式发音 URL |
| `example_audio_uk_url` | VARCHAR(500) | 例句英式发音 URL |
| `audio_status` | VARCHAR(20) | `PENDING`、`READY`、`FAILED` |
| `audio_error` | VARCHAR(1000) | 音频生成错误 |
| `sort_order` | INT | 后台排序 |
| `deleted` | BOOLEAN | 软删除 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

唯一约束：`word_book_id + normalized_word`。

### `word_topics`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `word_id` | BIGINT | 单词 ID |
| `topic_id` | BIGINT | 口语主题 ID |
| `topic_title_en` | VARCHAR(200) | 来源主题英文标题冗余 |
| `topic_title_zh` | VARCHAR(200) | 来源主题中文标题冗余 |
| `created_at` | DATETIME | 创建时间 |

唯一约束：`word_id + topic_id`。同一单词本内遇到重复词但来源主题不同时，不新增重复单词，只补充 `word_topics` 关联。

### `user_word_progress`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `user_id` | BIGINT | 用户 ID |
| `word_id` | BIGINT | 单词 ID |
| `word_book_id` | BIGINT | 单词本 ID |
| `status` | VARCHAR(20) | `NEW`、`LEARNING`、`REVIEWING`、`MASTERED` |
| `difficulty` | VARCHAR(20) | 冗余记录练习时单词难度 |
| `study_count` | INT | 总练习次数 |
| `known_count` | INT | 认识次数 |
| `fuzzy_count` | INT | 模糊次数 |
| `unknown_count` | INT | 不认识次数 |
| `consecutive_known_count` | INT | 连续认识次数 |
| `first_studied_at` | DATETIME | 首次学习时间 |
| `last_practiced_at` | DATETIME | 上次练习时间 |
| `next_review_at` | DATETIME | 下次复习时间 |
| `mastered_at` | DATETIME | 掌握时间 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

唯一约束：`user_id + word_id`。

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
