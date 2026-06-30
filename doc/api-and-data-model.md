# 接口与数据模型

> 最后更新：2026-06-05

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
| 会员 | 管理员、永久会员，或会员有效期未过期用户 |
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
  "membershipPermanent": false,
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

## 用户提交话题接口

### 小程序用户提交

路径前缀：`/api/topic-submissions`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `` | 登录用户 | 提交自己感兴趣的口语练习话题 |

请求：

```json
{
  "title": "面试时介绍自己的项目经历",
  "reason": "最近准备英文面试，想练习怎么自然地讲项目背景、遇到的问题和自己的贡献。",
  "category": "职场",
  "extraInfo": "希望有初级和进阶两个版本。"
}
```

响应：

```json
{
  "id": 1,
  "title": "面试时介绍自己的项目经历",
  "status": "PENDING",
  "createdAt": "2026-06-27T10:00:00"
}
```

规则：

- `title` 必填，trim 后长度需为 2-100。
- `reason` 和 `extraInfo` 最多 500 个字符。
- 新提交默认状态为 `PENDING`。
- V1 不限制提交频率，不提供用户侧提交记录。

### 管理员处理用户提交

路径前缀：`/api/admin/topic-submissions`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `` | 管理员 | 分页查询提交列表 |
| GET | `/{id}` | 管理员 | 查询提交详情 |
| PUT | `/{id}/status` | 管理员 | 更新提交状态 |

列表参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 页码，从 0 开始，默认 0 |
| `size` | number | 每页数量，默认 20，最大 100 |
| `status` | string | 可选：`PENDING`、`ACCEPTED`、`REJECTED` |
| `keyword` | string | 可选，匹配标题、想练原因、补充说明 |

状态更新请求：

```json
{
  "status": "ACCEPTED"
}
```

允许更新为：

- `ACCEPTED`：已采纳
- `REJECTED`：未采纳

V1 中管理员采纳只更新提交状态，不自动创建正式 `topics` 记录。

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

会员权限说明：`PREMIUM_USER` 角色不再单独代表有效会员；后端动态判断 `ADMIN`、`membershipPermanent=true` 或 `membershipExpireAt > now()`。

## 会员与支付接口

路径前缀：`/api/membership`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/status` | 登录用户 | 当前用户会员状态 |
| GET | `/plans` | 登录用户 | 小程序获取上架会员套餐 |
| POST | `/orders` | 登录用户 | 创建会员支付订单 |
| GET | `/orders/{orderNo}` | 登录用户且本人订单 | 查询订单状态 |

### 会员状态响应

```json
{
  "role": "USER",
  "membershipActive": true,
  "membershipExpireAt": "2026-07-27T12:00:00",
  "membershipPermanent": false,
  "remainingDays": 29,
  "membershipSource": "WECHAT_PAY",
  "isAdmin": false
}
```

### 套餐响应项

```json
{
  "id": 1,
  "name": "月度会员",
  "description": "30 天高级功能",
  "originalPriceCents": 1990,
  "salePriceCents": 990,
  "effectivePriceCents": 990,
  "durationDays": 30,
  "permanent": false,
  "discountActive": true,
  "status": "ACTIVE",
  "sortOrder": 10
}
```

### 创建订单请求与响应

```json
{
  "planId": 1
}
```

```json
{
  "orderNo": "M202606271230001234",
  "expiresAt": "2026-06-27T12:45:00",
  "paymentParams": {
    "timeStamp": "1782544200",
    "nonceStr": "random",
    "package": "prepay_id=...",
    "signType": "RSA",
    "paySign": "..."
  }
}
```

规则：

- 真实支付模式下，`paymentParams` 可直接传给小程序 `wx.requestPayment`。
- 开发 mock 支付模式下，`paymentParams` 会额外返回 `mockPayment=true`，且 `package` 为 `prepay_id=mock_...`；小程序应调用 `/api/dev/membership/orders/{orderNo}/mock-paid` 模拟支付完成，不应把 mock 参数传入 `wx.requestPayment`。
- 若调用微信支付下单失败，订单会保存为 `FAILED`，`failureReason` 记录失败原因，创建订单接口返回错误信息。
- 订单 15 分钟未支付会自动关闭。

### 微信支付回调

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/payment/wechat/notify` | 微信支付签名校验 | 微信支付结果通知 |

本接口不要求 JWT。mock 模式下可解析模拟通知；真实支付模式由 `WechatPayService` 使用微信支付平台证书验签，并使用 API v3 密钥解密回调资源。

## 管理端会员接口

路径前缀：`/api/admin/membership`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/plans` | 管理员 | 套餐列表 |
| POST | `/plans` | 管理员 | 新增套餐 |
| PUT | `/plans/{id}` | 管理员 | 更新套餐 |
| PUT | `/plans/{id}/status` | 管理员 | 上架或下架套餐 |
| GET | `/orders` | 管理员 | 订单列表 |
| GET | `/orders/{id}` | 管理员 | 订单详情 |
| POST | `/users/{id}/grant` | 管理员 | 手动延长、设置到期时间或设置永久会员 |

新增/更新套餐请求：

```json
{
  "name": "周会员",
  "description": "7 天高级学习功能",
  "originalPriceCents": 990,
  "salePriceCents": 690,
  "durationDays": 7,
  "permanent": false,
  "discountStartAt": "2026-06-30T10:00:00",
  "discountEndAt": "2026-07-07T10:00:00",
  "status": "ACTIVE",
  "sortOrder": 0
}
```

字段规则：

- 必填：`name`、`originalPriceCents`、`salePriceCents`、`permanent`、`status`。
- 普通时长套餐：`permanent=false` 时 `durationDays` 必填且必须大于 0。
- 永久会员套餐：`permanent=true` 时后端忽略 `durationDays`。
- 可选：`description`、`discountStartAt`、`discountEndAt`、`sortOrder`。
- 金额单位为整数分；PC 前端以元输入并在提交时换算为分。
- `originalPriceCents` 不能小于 `salePriceCents`；折扣结束时间必须晚于开始时间。
- `status` 可选：`ACTIVE`（上架）、`INACTIVE`（下架）。只有上架套餐会在用户端套餐列表展示。

手动开通请求：

```json
{
  "operation": "EXTEND_DAYS",
  "days": 30,
  "reason": "客服补偿"
}
```

`operation` 可选：`EXTEND_DAYS`、`SET_EXPIRE_AT`、`PERMANENT`。

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

## 跟读精听接口

路径前缀：`/api/shadowing-lessons`

权限：

- 列表和详情公开可访问。
- 游客详情只返回媒体、简介和基础元信息，不返回完整 `content`。
- 登录用户详情返回完整 `content`，并自动写入学习记录。
- 句级点评、翻译练习点评和语音转文字接口要求登录，不要求会员权限。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `` | 公开 | 分页查询跟读精听资源，登录用户可按学习状态筛选 |
| GET | `/{id}` | 公开 | 查询详情；游客试看，登录用户完整内容 |
| POST | `/{id}/sentences/{sentenceIndex}/review` | 登录用户 | 上传单句录音并返回 ASR + AI 点评 |
| POST | `/{id}/translation-review` | 登录用户 | 提交中文翻译练习的英文回答并返回 AI 点评与优化 |
| POST | `/speech-to-text` | 登录用户 | 上传练习录音并返回 ASR 识别文本 |

### 列表参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `learned` | boolean | 是否查询已学习资源；游客查询 `true` 返回空列表 |
| `page` | number | 页码，从 0 开始，默认 0 |
| `size` | number | 每页数量，默认 10，最大 50 |

### 列表响应项

```json
{
  "id": 1,
  "title": "How to Say Sunny and Dreary Weather",
  "titleZh": "阳光明媚、天气阴沉怎么说？",
  "description": "围绕天气、心情和日常准备的原声片段。",
  "category": null,
  "topic": "天气季节",
  "sourceName": "Sydney Serena",
  "thumbnailUrl": "https://cdn.lingohow.cn/images/thumbnails/EP1.webp",
  "publishedDate": "2024-08-19",
  "sentenceCount": 6,
  "expressionCount": 10,
  "learned": false
}
```

### 详情响应

游客响应：

```json
{
  "id": 1,
  "title": "How to Say Sunny and Dreary Weather",
  "titleZh": "阳光明媚、天气阴沉怎么说？",
  "description": "围绕天气、心情和日常准备的原声片段。",
  "category": null,
  "topic": "天气季节",
  "thumbnailUrl": "https://cdn.lingohow.cn/images/thumbnails/EP1.webp",
  "videoUrl": "https://cdn.lingohow.cn/videos/episodes-mp4/EP1.mp4",
  "audioUrl": "https://cdn.lingohow.cn/audio/episodes/EP1.mp3",
  "previewOnly": true,
  "learned": false,
  "content": null
}
```

登录用户响应会将 `previewOnly` 设为 `false`、`learned` 设为 `true`，并返回结构化 `content`。

列表和详情响应中的 `title`、`titleZh` 是面向用户的展示标题；后端会移除标题内的 `Episode + 序号` 片段。`sourceName` 为通用导入标记 `Lingohow` 时不返回，`category` 为通用栏目名 `300期油管地道口语` 时不返回，避免在小程序列表页和详情页展示这些导入来源标记。

### `content` 结构

```json
{
  "challenge": { "zhText": "中文挑战文本", "tips": ["大胆开口练习"] },
  "transcript": { "en": "English transcript.", "zh": "中文对照。" },
  "sentences": [
    {
      "index": 0,
      "startSec": 0.3,
      "endSec": 4.4,
      "en": "I just got out of the shower.",
      "zh": "我刚洗完澡。",
      "phonetic": "/.../",
      "highlights": [{ "text": "got out of the shower", "zh": "洗完澡" }]
    }
  ],
  "expressions": [
    {
      "text": "get out of the shower",
      "phonetic": "/.../",
      "type": "phrasal verb",
      "definitionZh": "洗完澡",
      "exampleEn": "I just got out of the shower."
    }
  ],
  "cloze": {
    "enFullText": "完整英文",
    "zhPromptText": "用于翻译练习的中文提示",
    "answers": ["got out of the shower"]
  }
}
```

### 句级点评请求

```http
POST /api/shadowing-lessons/1/sentences/0/review
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

字段：

- `audioFile`：本次录音文件。
- `referenceText`：可选，前端显示的原句；后端仍会按 `lessonId + sentenceIndex` 从 `contentJson` 校验原句。
- `durationMs`：可选，录音时长毫秒。

响应：

```json
{
  "recognizedText": "I just got out of the shower.",
  "overallScore": 88,
  "pronunciationScore": 86,
  "fluencyScore": 84,
  "accuracyScore": 94,
  "strengths": ["句子主干完整"],
  "improvements": ["让 out of the 连读更自然"],
  "suggestedPractice": ["out of the shower"],
  "encouragement": "这句读得很稳，再读一遍会更顺。"
}
```

后端保存识别文本、分数和反馈 JSON，不保存长期录音文件 URL。

### 翻译练习点评请求

```http
POST /api/shadowing-lessons/1/translation-review
Content-Type: application/json
Authorization: Bearer <token>
```

请求：

```json
{
  "promptZh": "我刚洗完澡，吹干头发。",
  "referenceText": "I just got out of the shower, I dried my hair.",
  "userAnswer": "I just got out of the shower and dried my hair.",
  "inputMode": "voice"
}
```

响应：

```json
{
  "content": "{\"score\":90,\"strengths\":[\"意思完整\"],\"improvements\":[\"可以更自然地处理并列动作\"],\"corrections\":[],\"improvedAnswer\":\"I just got out of the shower and dried my hair.\",\"encouragement\":\"表达已经很清楚，继续保持。\"}"
}
```

`promptZh` 和 `referenceText` 为空时，后端会尝试从详情 `content.cloze.zhPromptText` 和 `content.cloze.enFullText` 兜底读取。

### 跟读精听语音转文字请求

```http
POST /api/shadowing-lessons/speech-to-text
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

字段：

- `audioFile`：本次翻译练习录音文件。

响应：

```json
{
  "text": "I just got out of the shower and dried my hair."
}
```

## 口语热身接口

路径前缀：`/api/spoken-warmup`

权限：登录用户。普通 `USER`、`PREMIUM_USER`、`ADMIN` 和未过期会员均可使用，不要求会员权限。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/topic/{id}` | 获取口语热身主题详情 |
| POST | `/warmup` | 生成 1 段热身介绍和 3 个热身问题 |
| POST | `/vocabulary` | 生成 10 个核心词汇 |
| POST | `/sentence-patterns` | 生成 6 个句型模板 |
| POST | `/idiomatic-expressions` | 生成 6 个地道表达 |
| POST | `/tasks` | 生成 3 个模拟问答任务 |
| POST | `/review` | 点评用户回答 |
| POST | `/speech-to-text` | 上传真实录音文件并返回 ASR 识别文本 |

### 口语热身生成请求

```json
{
  "titleEn": "After-work Time",
  "titleZh": "下班后的时间安排",
  "mode": "beginner",
  "exclude": "可选，本次页面已生成内容，用于重新生成去重"
}
```

### 口语热身点评请求

```json
{
  "titleEn": "After-work Time",
  "titleZh": "下班后的时间安排",
  "mode": "beginner",
  "taskTitle": "Short Answer",
  "taskDescription": "Describe what you usually do after work.",
  "answer": "I usually take a walk after work.",
  "inputMode": "voice"
}
```

点评响应仍包装在 `content` 字符串中，内部 JSON 包含：

```json
{
  "score": 85,
  "strengths": ["..."],
  "improvements": ["..."],
  "corrections": [
    {
      "original": "I very like walking.",
      "corrected": "I really like walking.",
      "explanationZh": "like 前通常不用 very 修饰。"
    }
  ],
  "improvedAnswer": "...",
  "encouragement": "..."
}
```

### 语音转文字请求

```http
POST /api/spoken-warmup/speech-to-text
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

字段：

- `audioFile`：用户本次录音文件。
- `topicId`：可选。
- `mode`：可选，`beginner` 或 `advanced`。

响应：

```json
{
  "text": "I usually take a walk after work."
}
```

语音识别结果必须来自用户本次真实录音。空识别结果、ASR 配置缺失或第三方错误会返回错误响应；后端不保存录音文件。

## 每日外刊接口

### 用户端

路径前缀：`/api/daily-articles`

权限：登录用户。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `` | 分页查询已推送外刊，支持未读/已读 |
| GET | `/{id}` | 查询外刊详情，并自动标记当前用户已读 |

列表参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `read` | boolean | `false` 查询未读，`true` 查询已读；默认 `false` |
| `page` | number | 页码，从 0 开始，默认 0 |
| `size` | number | 每页数量，默认 10 |

列表项响应：

```json
{
  "id": 1,
  "title": "A New Way to Travel",
  "titleZh": "旅行的新方式",
  "publishedDate": "2026-06-02",
  "read": false
}
```

详情响应：

```json
{
  "id": 1,
  "title": "A New Way to Travel",
  "titleZh": "旅行的新方式",
  "audioUrl": "/uploads/daily-articles/example.mp3",
  "summary": "文章总结",
  "vocabulary": "[{\"word\":\"route\",\"phoneticUk\":\"ruːt\",\"phoneticUs\":\"ruːt\",\"pos\":\"n.\",\"meaning\":\"路线\",\"example\":\"The route follows the river.\",\"exampleZh\":\"这条路线沿河而行。\"}]",
  "expressions": "[{\"expression\":\"I would rather...\",\"meaning\":\"我宁愿……\",\"example\":\"I would rather take the train.\"}]",
  "difficultyStars": 3,
  "wordCount": 670,
  "sourceName": "纽约时报",
  "keySentences": "[{\"sentence\":\"English long sentence.\",\"translation\":\"中文翻译。\",\"analysis\":\"句子结构解析。\"}]",
  "publishedDate": "2026-06-02",
  "read": true,
  "paragraphs": [
    {
      "id": 1,
      "sortOrder": 1,
      "contentEn": "English paragraph.",
      "contentZh": "中文翻译。"
    }
  ]
}
```

`vocabulary`、`expressions`、`keySentences` 均为 JSON 数组字符串；旧记录缺少 `difficultyStars`、`wordCount`、`sourceName`、`keySentences` 时返回 `null`，小程序端隐藏对应模块。未登录访问返回 `401`。非管理员访问未推送外刊返回 `404`。

### 管理端

路径前缀：`/api/admin/daily-articles`

权限：管理员。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `` | 管理端分页查询外刊库存 |
| GET | `/{id}` | 查询外刊详情 |
| POST | `` | 新增外刊 |
| PUT | `/{id}` | 更新外刊 |
| PATCH | `/{id}/status` | 更新状态 |
| PATCH | `/{id}/enable` | 启用 |
| PATCH | `/{id}/disable` | 禁用 |
| DELETE | `/{id}` | 删除外刊 |
| POST | `/upload-audio` | 上传音频文件 |
| POST | `/publish-today` | 手动触发今日外刊 |

管理端列表参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `status` | string | 可选：`DRAFT`、`ENABLED`、`DISABLED` |
| `published` | boolean | 可选：是否已推送 |
| `page` | number | 页码，从 0 开始，默认 0 |
| `size` | number | 每页数量，默认 20 |

保存请求：

```json
{
  "title": "A New Way to Travel",
  "titleZh": "旅行的新方式",
  "audioUrl": "/uploads/daily-articles/example.mp3",
  "summary": "文章总结",
  "vocabulary": "[{\"word\":\"route\",\"zh\":\"路线\"}]",
  "expressions": "[{\"template\":\"I would rather...\",\"zh\":\"我宁愿……\"}]",
  "status": "ENABLED",
  "paragraphs": [
    {
      "sortOrder": 1,
      "contentEn": "English paragraph.",
      "contentZh": "中文翻译。"
    }
  ]
}
```

手动发布响应：

```json
{
  "message": "今日外刊已生成",
  "articleId": 1,
  "publishedDate": "2026-06-02"
}
```

当今日已有外刊时返回 `message = "今日外刊已存在"`；没有启用且未推送候选外刊时返回 `message = "没有可推送的外刊"`。

## AI 对话接口

路径前缀：`/api/ai-dialog`

权限：登录用户。普通 `USER`、`PREMIUM_USER`、`ADMIN` 和未过期会员均可使用，不要求会员权限。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/config` | 获取启用状态、单次最大轮数、每日轮数限制和当天剩余额度 |
| POST | `/message` | 发送一轮用户消息并获取 AI 回复 |
| POST | `/speech-to-text` | 上传真实录音文件并返回 ASR 识别文本 |

### 配置摘要响应

```json
{
  "enabled": true,
  "maxRoundsPerSession": 12,
  "dailyMessageLimit": 30,
  "remainingToday": 29
}
```

### 发送消息请求

```json
{
  "sessionId": "client-session-id",
  "topicSource": "SYSTEM",
  "topicId": 1,
  "customTopic": "",
  "mode": "TEACHING",
  "difficulty": "BEGINNER",
  "roundCount": 0,
  "message": "I usually go for a walk after work.",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! What would you like to talk about?" }
  ]
}
```

字段取值：

- `topicSource`：`SYSTEM` 或 `CUSTOM`。
- `mode`：`TEACHING` 或 `PRACTICE`。
- `difficulty`：`BEGINNER` 或 `ADVANCED`。
- `roundCount`：当前页面已成功发送的用户消息轮数；达到配置的单次最大轮数后后端拒绝继续发送。

### 发送消息响应

```json
{
  "remainingToday": 28,
  "audioUrl": "/uploads/ai-dialog/xxxx.mp3",
  "reply": {
    "replyEn": "That sounds like a healthy way to relax.",
    "feedbackZh": "表达清楚，可以补充原因让内容更完整。",
    "betterExpressionEn": "I usually take a walk after work to clear my mind.",
    "betterExpressionZh": "clear my mind 表示放松头脑，更自然。",
    "nextPromptEn": "Where do you usually go for your walk?"
  }
}
```

说明：

- 对话内容不保存到数据库，`history` 只用于当前请求上下文。
- 每次 AI 调用成功后才增加当天用量；调用失败不扣次数。
- `audioUrl` 可能为空，表示 TTS 未配置或生成失败，客户端应降级展示文字。
- 每日额度用尽返回 `429`，响应包含 `remainingToday: 0`。
- AI 对话关闭或模型响应异常返回 `503`。

## AI 对话管理接口

路径前缀：`/api/admin/ai-dialog`

权限：管理员。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/config` | 获取完整 AI 对话配置 |
| PUT | `/config` | 更新 AI 对话配置 |
| POST | `/config/reset-prompts` | 恢复四套内置默认提示词 |

可配置字段：

- `enabled`
- `aiModelId`
- `asrModelId`
- `ttsModelId`
- `ttsVoice`
- `speechProvider`
- `ttsProvider`
- `temperature`
- `maxRoundsPerSession`
- `dailyMessageLimit`
- `teachingBeginnerPrompt`
- `teachingAdvancedPrompt`
- `practiceBeginnerPrompt`
- `practiceAdvancedPrompt`

校验：

- `temperature` 必须在 `0` 到 `2` 之间。
- `maxRoundsPerSession` 和 `dailyMessageLimit` 必须大于 `0`。
- 四套提示词不能为空。

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
| GET | `/books` | 查询已发布单词本与当前用户在词书所属等级下的进度 |
| GET | `/books/{bookId}` | 查询单词本详情与词书所属等级进度 |
| GET | `/books/{bookId}/next` | 获取下一批练习词，优先到期复习词 |
| GET | `/words/{wordId}` | 查询已发布单词详情 |
| POST | `/words/{wordId}/answer` | 提交认识/不认识 |
| GET | `/books/{bookId}/progress` | 查询指定难度进度 |
| GET | `/books/{bookId}/words` | 查询当前词书全部已发布单词和当前用户在每个词上的进度，用于小程序整本词书本地缓存 |

提交练习结果：

```json
{
  "result": "KNOWN"
}
```

`result` 可取 `KNOWN`、`FUZZY` 或 `UNKNOWN`。

整本词书缓存响应：

```json
{
  "words": [
    {
      "id": 1,
      "wordBookId": 7,
      "word": "routine",
      "difficulty": "BEGINNER",
      "definitionZh": "日常安排；惯例",
      "definitionEn": "a usual way of doing things",
      "exampleEn": "My morning routine starts with coffee.",
      "progress": {
        "status": "REVIEWING",
        "studyCount": 1,
        "nextReviewAt": "2026-06-30T09:00:00"
      }
    }
  ],
  "progress": {
    "difficulty": "BEGINNER",
    "total": 120,
    "learned": 36,
    "mastered": 8,
    "dueReview": 4,
    "remainingNew": 84
  }
}
```

单词本等级规则：

- `word_books.level` 取值为 `BEGINNER` 或 `ADVANCED`。
- 一个单词本只能属于一个等级，用户端接口返回的 `progress.difficulty` 与词书 `level` 保持一致。
- 用户端接口仍兼容 `difficulty` 查询参数，但后端会以词书 `level` 为准查询练习词和进度。
- 新增、编辑、AI 生成单词时，单词 `difficulty` 会被强制设置为所属词书等级，避免同一本词书混入初级和进阶单词。
- 用户端进度中的 `learned` 只统计真正提交过练习结果的记录，即 `studyCount > 0`；`status=NEW` 或 `studyCount=0` 的预创建进度仍视为未学新词。
- `/books/{bookId}/next` 查询新词时只排除真正练过的单词，避免预创建 `NEW` 进度导致用户还没学习就没有下一词。
- 到期复习词同样要求 `studyCount > 0`，仅存在 `nextReviewAt` 的预创建记录不会被当作复习词。

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

AI 对话回复音频会复用 `tts_models` 中的可用模型，生成到 `/uploads/ai-dialog/`。该音频为即时播放辅助，不保存会话内容。

AI 创建单词本走后台任务：接口先创建单词本和 `word_generation_tasks` 记录，再异步执行“生成单词、保存单词、生成音频”。前端刷新页面不影响任务执行，可通过任务查询接口展示阶段、百分比、已保存单词数和音频生成进度。

除本地 TTS 外，后端还提供公共词典发音 URL 后台补全任务。该任务按 `app.word-audio.public-source.*` 配置慢速执行，扫描缺少 `audio_us_url` 或 `audio_uk_url` 的单词，从 Free Dictionary API、Wiktionary 和 Wikimedia Commons 补充可播放的公开媒体 URL。任务只补空字段，不覆盖已有 `/uploads/word-audio/...` 本地音频；英美音只在来源明确标注口音时写入。只补到一侧发音时，`audio_error` 会标记为 `PUBLIC_DICTIONARY_AUDIO_PARTIAL`；公共来源没有可用音频时标记为 `PUBLIC_DICTIONARY_AUDIO_MISSING`；两侧都补齐时，`audio_status` 可置为 `READY`。后台任务会跳过 `PUBLIC_DICTIONARY_AUDIO_PARTIAL` 和 `PUBLIC_DICTIONARY_AUDIO_MISSING`，如需重新尝试可清空对应单词的 `audio_error`。

公共来源的音频许可需要在产品侧注明来源和许可。当前 `words` 表只存播放 URL，批量脚本 `scripts/backfill_public_dictionary_word_audio.java` 会额外生成 `logs/public-dictionary-word-audio-backfill.tsv` 作为来源/许可审计记录；若前端需要逐条展示署名，应扩展数据模型保存 Commons 文件页、作者和 license 信息。

### 已导入单词本记录

#### 商务英语

- 导入日期：2026-06-27
- 数据库单词本 ID：`6`
- 单词本等级：`ADVANCED`
- 单词本状态：`PUBLISHED`
- 词条规模：1000 个单个英文单词，全部为 `ADVANCED`
- 词条状态：全部为 `PUBLISHED`
- 音频状态：全部为 `PENDING`，本次未生成音频，后续可用批量音频回填脚本补齐
- 源数据：`doc/generated/business-english-wordbook.json`
- 封面资产：`doc/generated/business-english-cover.svg`、`doc/generated/business-english-cover.png`
- 导入记录：`doc/generated/business-english-wordbook-import-record.md`

#### 职场英语

- 导入日期：2026-06-27
- 数据库单词本 ID：`7`
- 单词本等级：`BEGINNER`
- 单词本状态：`PUBLISHED`
- 词条规模：1000 个单个英文单词，全部为 `BEGINNER`
- 词条状态：全部为 `PUBLISHED`
- 音频状态：全部为 `PENDING`，本次未生成音频，后续可用批量音频回填脚本补齐
- 中文释义：只保留词义，不包含“初级”“职场英语”等等级或来源标签
- 源数据：`doc/generated/workplace-english-wordbook.json`
- 封面资产：`doc/generated/workplace-english-cover.svg`、`doc/generated/workplace-english-cover.png`
- 导入记录：`doc/generated/workplace-english-wordbook-import-record.md`

#### 日常生活

- 导入日期：2026-06-27
- 数据库单词本 ID：`8`
- 单词本等级：`BEGINNER`
- 单词本状态：`PUBLISHED`
- 词条规模：1000 个单个英文单词，全部为 `BEGINNER`
- 词条状态：全部为 `PUBLISHED`
- 音频状态：全部为 `PENDING`，本次未生成音频，后续可用批量音频回填脚本补齐
- 中文释义：只保留词义，不包含“初级”“日常生活”等等级或来源标签
- 源数据：`doc/generated/daily-life-wordbook.json`
- 封面资产：`doc/generated/daily-life-cover.svg`、`doc/generated/daily-life-cover.png`
- 导入记录：`doc/generated/daily-life-wordbook-import-record.md`

#### 雅思托福

- 导入日期：2026-06-27
- 数据库单词本 ID：`9`
- 单词本等级：`ADVANCED`
- 单词本状态：`PUBLISHED`
- 词条规模：1000 个单个英文单词，全部为 `ADVANCED`
- 词条状态：全部为 `PUBLISHED`
- 音频状态：全部为 `PENDING`，本次未生成音频，后续可用批量音频回填脚本补齐
- 中文释义：只保留词义，不包含“进阶”“雅思托福”等等级或来源标签
- 源数据：`doc/generated/ielts-toefl-wordbook.json`
- 封面资产：`doc/generated/ielts-toefl-cover.svg`、`doc/generated/ielts-toefl-cover.png`
- 导入记录：`doc/generated/ielts-toefl-wordbook-import-record.md`

#### 小柚口语进阶

- 导入日期：2026-06-27
- 数据库单词本 ID：`10`
- 单词本等级：`ADVANCED`
- 单词本状态：`PUBLISHED`
- 词条规模：1000 个不重复的单个英文单词，全部为 `ADVANCED`
- 主题覆盖：基于当前导出的 263 个口语主题，每个主题分配 3 到 4 个词条，同一主题词条连续排列
- 主题关联：`word_book_topics` 写入 263 条，`word_topics` 写入 1000 条
- 词条状态：全部为 `PUBLISHED`
- 音频状态：全部为 `PENDING`，本次未生成音频，后续可用批量音频回填脚本补齐
- 中文释义：只保留词义，不包含“小柚口语进阶”“进阶”等等级或来源标签
- 源数据：`doc/generated/xiaoyou-speaking-advanced-wordbook.json`
- 主题快照：`doc/generated/xiaoyou-topic-snapshot.json`
- 封面资产：`doc/generated/xiaoyou-speaking-advanced-cover.svg`、`doc/generated/xiaoyou-speaking-advanced-cover.png`
- 导入记录：`doc/generated/xiaoyou-speaking-advanced-wordbook-import-record.md`

#### 小柚口语初级

- 导入日期：2026-06-27
- 数据库单词本 ID：`11`
- 单词本等级：`BEGINNER`
- 单词本状态：`PUBLISHED`
- 词条规模：1000 个不重复的单个英文单词，全部为 `BEGINNER`
- 主题覆盖：基于当前导出的 263 个口语主题，每个主题分配 3 到 4 个词条，同一主题词条连续排列
- 主题关联：`word_book_topics` 写入 263 条，`word_topics` 写入 1000 条
- 词条状态：全部为 `PUBLISHED`
- 音频状态：全部为 `PENDING`，本次未生成音频，后续可用批量音频回填脚本补齐
- 中文释义：只保留词义，不包含“小柚口语初级”“初级”等等级或来源标签
- 源数据：`doc/generated/xiaoyou-speaking-beginner-wordbook.json`
- 主题快照：`doc/generated/xiaoyou-topic-snapshot.json`
- 封面资产：`doc/generated/xiaoyou-speaking-beginner-cover.svg`、`doc/generated/xiaoyou-speaking-beginner-cover.png`
- 导入记录：`doc/generated/xiaoyou-speaking-beginner-wordbook-import-record.md`

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
| `level` | VARCHAR(20) | 单词本等级：`BEGINNER`、`ADVANCED`；默认 `BEGINNER` |
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

### `daily_articles`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `title` | VARCHAR(300) | 英文标题 |
| `title_zh` | VARCHAR(300) | 中文标题 |
| `audio_url` | VARCHAR(1000) | 音频 URL，支持外部 URL 或上传后的 `/uploads/...` |
| `summary` | TEXT | 文章总结 |
| `vocabulary` | JSON | 重点词汇 JSON 字符串 |
| `expressions` | JSON | 表达句型 JSON 字符串 |
| `difficulty_stars` | INT | 精读难度星级，1-5，可空 |
| `word_count` | INT | 英文词数，可空 |
| `source_name` | VARCHAR(200) | 素材来源名称，可空 |
| `key_sentences` | JSON | 长难句解析 JSON 字符串 |
| `status` | VARCHAR(20) | `DRAFT`、`ENABLED`、`DISABLED` |
| `published_date` | DATE | 发布日期；为空表示未推送 |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

索引：`published_date`、`status + published_date`。

每日外刊精读素材通过脚本导入。单篇素材模板位于 `doc/generated/daily-article-intensive-reading.template.json`，单篇导入脚本位于 `scripts/import_daily_article_intensive_reading.java`；微信公众号 Markdown 批量转换和导入脚本位于 `scripts/import_daily_articles_from_weixin_md.java`，批量 JSON 输出目录为 `doc/generated/daily-articles-intensive-reading-batch`。脚本默认写入 `status=ENABLED`，`publishedDate=null` 时由每日 06:00 定时任务推送；若写入具体日期，则表示该素材已推送。

### `daily_article_paragraphs`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `article_id` | BIGINT | 外刊 ID |
| `sort_order` | INT | 段落顺序，从 1 开始 |
| `content_en` | TEXT | 英文正文段落 |
| `content_zh` | TEXT | 中文翻译 |

索引：`article_id + sort_order`。

### `daily_article_reads`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `article_id` | BIGINT | 外刊 ID |
| `user_id` | BIGINT | 用户 ID |
| `read_at` | DATETIME | 首次阅读时间 |

唯一约束：`article_id + user_id`，用于避免重复阅读记录。

### `shadowing_lessons`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `title` | VARCHAR(255) | 英文标题或页面标题 |
| `title_zh` | VARCHAR(255) | 中文标题 |
| `description` | TEXT | 资源简介 |
| `episode_no` | VARCHAR(50) | 集数编号，如 `EP1` |
| `category` | VARCHAR(100) | 栏目 |
| `topic` | VARCHAR(100) | 主题 |
| `source_name` | VARCHAR(100) | 来源作者或来源名称 |
| `source_url` | VARCHAR(1000) | 来源页面 URL，用于导入去重 |
| `thumbnail_url` | VARCHAR(1000) | 封面图 |
| `video_url` | VARCHAR(1000) | 独立视频地址 |
| `audio_url` | VARCHAR(1000) | 独立音频地址 |
| `published_date` | DATE | 发布日期 |
| `sentence_count` | INT | 句子数 |
| `expression_count` | INT | 表达数 |
| `content_json` | LONGTEXT | 精听挑战、原文、句子、表达、填空 JSON |
| `status` | VARCHAR(20) | `DRAFT`、`PUBLISHED`、`DISABLED` |
| `created_at` | DATETIME | 创建时间 |
| `updated_at` | DATETIME | 更新时间 |

索引：`status + published_date`、`source_url`、`episode_no`。

### `user_shadowing_lesson_records`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `user_id` | BIGINT | 用户 ID |
| `lesson_id` | BIGINT | 跟读精听资源 ID |
| `first_opened_at` | DATETIME | 首次打开时间 |
| `last_opened_at` | DATETIME | 最近打开时间 |

唯一约束：`user_id + lesson_id`。

### `shadowing_review_records`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | BIGINT | 主键 |
| `user_id` | BIGINT | 用户 ID |
| `lesson_id` | BIGINT | 跟读精听资源 ID |
| `sentence_index` | INT | 句子索引，0-based |
| `reference_text` | TEXT | 原句英文 |
| `recognized_text` | TEXT | ASR 识别文本 |
| `overall_score` | INT | 总分 |
| `pronunciation_score` | INT | 发音分 |
| `fluency_score` | INT | 流利度 |
| `accuracy_score` | INT | 准确度 |
| `feedback_json` | LONGTEXT | AI 原始反馈 JSON |
| `created_at` | DATETIME | 创建时间 |

不保存长期录音 URL。

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
