# 后端说明

> 最后更新：2026-06-05

## 代码位置

后端主工程位于 `src/main/java/com/xiaoyouyingyu`，使用 Maven 管理，启动类为 `Application.java`。

```text
src/main/java/com/xiaoyouyingyu/
├── Application.java
├── config/
├── controller/
├── dto/
├── entity/
├── repository/
├── security/
└── service/
```

## 技术栈

- Spring Boot 3.2.5
- Java 21
- Spring MVC
- Spring Security
- Spring Data JPA
- MySQL
- JJWT
- Jackson
- Lombok

## 分层职责

| 层 | 目录 | 职责 |
| --- | --- | --- |
| Controller | `controller` | 暴露 REST API，做参数校验、权限上下文读取和响应组装 |
| Service | `service` | 业务逻辑，包含 AI 调用、会员卡密、PC 微信扫码登录 |
| Repository | `repository` | JPA 数据访问，包含自定义查询 |
| Entity | `entity` | JPA 实体和数据库表映射 |
| Security | `security` | JWT 生成、校验和请求过滤 |
| Config | `config` | 安全配置、分类常量、启动数据初始化 |
| DTO | `dto` | 登录/注册请求和认证响应对象 |

## 启动入口

`Application.java` 是标准 Spring Boot 启动类，加载组件扫描、Web 服务、JPA、安全过滤器等。

## Controller 说明

### `AuthController`

路径前缀：`/api/auth`

负责：

- 用户注册：注册后自动赠送 3 天会员。
- 账号密码登录。
- 修改用户名。
- 修改密码。
- 微信用户首次设置密码。
- 微信小程序登录。
- PC 微信扫码登录 session 创建、轮询、场景查询、确认、取消。

关键点：

- 注册和登录返回 `AuthResponse`，包含 token、用户名、角色、会员到期时间、会员状态、是否已设置密码。
- 微信小程序新用户使用 `wx_` 前缀自动生成用户名，并标记 `hasPassword=false`。
- PC 扫码登录 ticket 保存在内存中，默认 5 分钟过期，服务重启后会丢失。

### `TopicController`

路径前缀：`/api/topics`

负责：

- 话题分页列表。
- 关键词、标签、日期范围筛选。
- 标签统计。
- 坚持天数统计。
- 话题详情。
- 月历话题数据。

关键点：

- 游客可以访问列表，但只返回简化字段。
- 游客不允许关键词搜索，搜索会返回 401。
- 列表默认按 `eventDate` 倒序排列。

### `TopicSubmissionController`

路径前缀：`/api/topic-submissions`

负责小程序用户提交感兴趣的话题：

- 登录用户提交话题标题、想练原因、分类和补充说明。
- 新提交默认保存为 `PENDING` 状态。
- 提交记录只作为运营参考数据，不会自动写入正式 `topics` 表。

权限：

- 登录用户即可提交。
- 游客点击小程序提交入口时应先进入登录引导。

### `AdminTopicSubmissionController`

路径前缀：`/api/admin/topic-submissions`

负责管理员处理用户提交的话题：

- 分页查询提交列表，支持状态筛选和关键词搜索。
- 查看提交详情。
- 将提交标记为 `ACCEPTED`（已采纳）或 `REJECTED`（未采纳）。

权限：

- 继承 `/api/admin/**` 规则，仅管理员可访问。
- 列表和详情只展示提交用户名，不返回用户密码、token 等敏感信息。

### `LearningController`

路径前缀：`/api/learning`

负责学习中心相关 AI 内容：

- 获取学习主题详情。
- 生成热身内容。
- 生成主题词汇。
- 生成表达模板。
- 生成练习任务。
- 点评用户回答。

权限：

- `SecurityConfig` 中限制为 `ADMIN` 或动态会员角色 `MEMBER`。
- 后端会员判定统一由 `User.isMembershipActive()` 提供，`ADMIN`、永久会员和未过期会员都会被视为会员。

### `SpokenWarmupController`

路径前缀：`/api/spoken-warmup`

负责微信小程序“口语热身”模块：

- 获取口语热身主题详情。
- 生成热身介绍。
- 生成 10 个核心词汇。
- 生成 6 个句型模板。
- 生成 6 个地道表达。
- 生成 3 个模拟问答任务。
- 点评用户通过语音或文字提交的英文回答。
- 接收小程序录音文件并调用真实 ASR 能力返回识别文本。

权限：

- 登录用户即可访问，不限制会员状态。
- V1 不保存 AI 生成内容、用户回答或录音文件。

### `ShadowingLessonController`

路径前缀：`/api/shadowing-lessons`

负责微信小程序“跟读精听”模块：

- 分页查询已发布跟读精听资源，支持登录用户按未学习/已学习筛选。
- 获取资源详情；游客只返回媒体、简介和基础元信息，登录用户返回完整 `contentJson`。
- 列表和详情响应会清理展示字段：标题移除 `Episode + 序号`，通用 `Lingohow` 来源和 `300期油管地道口语` 栏目不返回给用户端展示。
- 登录用户打开详情时自动创建或更新 `user_shadowing_lesson_records`，同一用户同一资源只保留一条学习记录。
- 接收单句跟读录音并调用真实 ASR 获取识别文本，再调用 `AiService.reviewShadowingSentence` 生成综合点评。
- 句级点评和语音转文字均提供 multipart 主入口与 base64 兜底入口；小程序仅在 `wx.uploadFile` 网络层失败时使用 base64 入口。
- 成功点评后保存识别文本、评分和反馈 JSON 到 `shadowing_review_records`，不保存长期录音文件 URL。

权限：

- `GET /api/shadowing-lessons` 和 `GET /api/shadowing-lessons/{id}` 公开可访问。
- `POST /api/shadowing-lessons/{id}/sentences/{sentenceIndex}/review` 要求登录用户。
- `POST /api/shadowing-lessons/{id}/sentences/{sentenceIndex}/review-base64`、`POST /api/shadowing-lessons/speech-to-text`、`POST /api/shadowing-lessons/speech-to-text-base64` 要求登录用户。
- 跟读精听不要求会员权限；完整详情只要求登录。

### `AiDialogController`

路径前缀：`/api/ai-dialog`

负责小程序 AI 对话练习：

- 获取 AI 对话配置摘要和当天剩余额度。
- 接收用户单轮消息，按主题、模式、难度和页面内历史上下文调用 AI。
- 返回结构化英文回复、可选中文点评/优化表达和 TTS 音频 URL。
- 提供真实语音识别接口 `/speech-to-text`，复用 `SpeechToTextService` 上传本次录音并返回转写文本。

权限：

- 登录用户即可访问，不限制会员状态。
- 对话内容不落库；只保存每日用量。

### `MembershipController`

路径前缀：`/api`

负责：

- 查询当前用户会员状态。
- 查询小程序可购买会员套餐。
- 创建小程序会员支付订单。
- 查询当前用户自己的会员订单状态。
- 返回开通会员联系信息。
- 用户兑换卡密。

新增会员支付接口：

- `GET /api/membership/status`：当前用户会员状态，返回 `membershipActive`、`membershipPermanent`、`membershipExpireAt`。
- `GET /api/membership/plans`：返回上架会员套餐。
- `POST /api/membership/orders`：根据套餐创建微信小程序支付订单，返回 `wx.requestPayment` 参数。
- `GET /api/membership/orders/{orderNo}`：查询本人订单状态。

支付失败处理：

- 真实微信支付下单失败时，订单会从 `PENDING` 更新为 `FAILED`，并在 `failureReason` 保存微信支付返回或配置校验错误，便于后台订单页排查。
- 开发 mock 支付模式会在支付参数中返回 `mockPayment=true` 和 `prepay_id=mock_...`，由小程序调用开发接口模拟支付成功，不进入真实微信收银台。

### `AdminMembershipController`

路径前缀：`/api/admin/membership`

负责：

- 会员套餐列表、新增、编辑、上架/下架。
- 会员订单列表和详情。
- 管理员手动延长会员、设置指定到期时间、设置永久会员。

权限：

- 继承 `/api/admin/**` 规则，仅管理员可访问。

### `WechatPayController`

路径前缀：`/api`

负责：

- `POST /api/payment/wechat/notify`：微信支付回调入口。该接口不要求 JWT，但业务处理必须由 `WechatPayService` 做微信支付签名校验或 mock 校验。
- `POST /api/dev/membership/orders/{orderNo}/mock-paid`：开发环境模拟支付成功接口，仅在 `WECHAT_PAY_MOCK_ENABLED=true` 时可用。

### `AdminController`

路径前缀：`/api/admin`

负责管理员功能：

- 话题创建、更新、删除。
- 用户列表、删除用户、修改角色。
- AI 旧生成接口兼容。
- AI 标题生成、问题生成。
- AI 模型增删改查。
- 卡密生成、列表、禁用。
- 兼容旧版设置用户会员到期时间、追加会员天数、查看会员记录。新版会员手动开通建议使用 `AdminMembershipController` 的统一接口。

权限：

- 所有 `/api/admin/**` 接口都要求 `ADMIN`。

### `AdminWordBookController`

路径前缀：`/api/admin`

负责单词练习管理端功能：

- 单词本创建、更新、发布、下架、软删除。
- 单词列表筛选、手动新增、更新、软删除。
- AI 按场景生成单词、按口语主题生成单词。
- AI 创建单词本后台任务创建、进度查询。
- 批量发布、下架、删除、排序和重新生成音频。

### `AdminTtsModelController`

路径前缀：`/api/admin/tts-models`

负责全局 TTS 模型配置：

- 全局 TTS 模型配置查询、新增、更新、删除和设置默认；前端统一放在 `/admin` 的“模型管理”中维护。

### `AdminAiDialogController`

路径前缀：`/api/admin/ai-dialog`

负责管理员维护 AI 对话全局配置：

- 查看和更新启用状态、文本模型、TTS 模型、音色、温度、单次最大轮数和每日发送轮数。
- 维护教学初级、教学进阶、练习初级、练习进阶四套系统提示词。
- 支持恢复内置默认提示词。

### `WordPracticeController`

路径前缀：`/api/word-practice`

负责用户端单词练习功能：

- 查询已发布单词本和个人进度。
- 查询单词本详情、下一批练习词、单词详情。
- 提交“认识/不认识”并更新复习计划。
- 进度统计和到期复习只计算 `studyCount > 0` 的真实练习记录；`NEW` 或 `studyCount=0` 的预创建记录仍按未学新词处理。
- 获取下一批练习词时只排除真正练过的单词，避免预创建进度记录导致用户还未学习就进入完成态。

权限由 `SecurityConfig` 要求有效登录态，控制器内统一读取并校验用户名；登录用户均可访问，不限制会员状态。

### `DailyArticleController`

路径前缀：`/api/daily-articles`

负责用户端每日外刊功能：

- 分页查询已推送外刊，支持 `read=true/false` 筛选已读或未读。
- 查询外刊详情，返回音频、段落、总结、词汇、句型、难度星级、词数、来源和长难句解析。
- 用户进入详情时自动写入阅读记录，同一用户同一外刊只记录一次。

权限：

- 登录用户均可访问，不限制会员状态。
- 非管理员不能访问未推送外刊。

### `AdminDailyArticleController`

路径前缀：`/api/admin/daily-articles`

负责每日外刊管理：

- 管理端分页查询全部外刊，支持按状态和是否已推送筛选。
- 新增、编辑、删除外刊。
- 更新外刊状态：`DRAFT`、`ENABLED`、`DISABLED`。
- 上传音频文件到 `{app.upload.dir}/daily-articles/`，保存并返回 `/uploads/daily-articles/...` URL。
- 手动触发今日外刊发布。

权限：

- 继承 `/api/admin/**` 规则，仅管理员可访问。

## Service 说明

### `AiService`

统一封装 OpenAI 兼容 Chat Completions 调用。

主要方法：

- `generate`：旧版通用生成接口。
- `generateTitles`：生成 5 个主题标题，会读取近一年和历史主题标题作为去重上下文。
- `generateQuestions`：按选中主题生成 10 个讨论问题。
- `generateWordsByScene`：按场景生成单词练习词汇 JSON。
- `generateWordsByTopic`：按口语主题生成单词练习词汇 JSON。
- `generateWarmup`：学习中心热身内容。
- `generateVocabulary`：学习中心词汇。
- `generateExpressions`：学习中心表达模板。
- `generateSentencePatterns`：口语热身句型模板。
- `generateIdiomaticExpressions`：口语热身地道表达。
- `generateTasks`：学习中心练习任务。
- `reviewAnswer`：点评用户回答。
- `generateStructuredReply`：供 AI 对话服务传入自定义 system prompt、上下文和温度，复用现有模型解析与 OpenAI 兼容调用。
- `reviewShadowingSentence`：跟读精听句级点评，输入资源标题、原句、音标、ASR 识别文本和录音时长，输出总分、发音、流利度、准确度、优点、建议练习和鼓励语 JSON。

模型选择：

- 传入 `modelId` 时优先使用 `ai_models` 表中的配置。
- 未传入或找不到模型时，使用 `application.yml` 中的默认 AI 配置。

返回约定：

- AI 被要求返回严格 JSON 字符串。
- Controller 将 JSON 字符串包装为 `{ "content": "..." }` 返回给前端。

### `SpeechToTextService`

负责真实语音转文字：

- 接收 `MultipartFile` 录音文件。
- 优先读取后台默认 AI 模型的 API Key 和 API 地址。
- 若未配置 `app.asr.api-url`，会从 OpenAI 兼容 Chat Completions 地址推导 `/audio/transcriptions`。
- 默认 ASR 模型为 `app.asr.model`，未配置时使用 `whisper-1`。
- 识别结果必须来自本次录音；空结果、第三方错误或配置缺失会返回明确错误。
- 不保存录音文件。

### `MembershipService`

负责会员与卡密：

- `grantRegistrationGift`：新用户注册赠送 3 天会员。
- `isActiveMember`：统一动态会员判断，管理员或永久会员或会员有效期未过期即为有效会员。
- `grantMembership`：统一会员授予入口，供卡密、微信支付、管理员手动开通复用。
- `redeemCode`：校验卡密状态并给用户延长会员。
- `setMembershipExpireAt`：管理员直接设置到期时间。
- `addMembershipDays`：管理员追加会员天数。
- `setMembershipPermanent`：管理员设置永久会员。
- `generateCodes`：批量生成卡密。
- `getUserRecords`：查看会员变更记录。

会员有效性：

- `ADMIN` 永远有效。
- 非管理员用户仅当 `membershipPermanent=true` 或 `membershipExpireAt` 晚于当前时间时有效。
- `PREMIUM_USER` 仅作为兼容角色保留，不再单独代表永久会员。

卡密状态：

- `ACTIVE`：可用。
- `USED`：已使用。
- `DISABLED`：已禁用。
- 过期判断通过 `expireAt` 动态判断。

### `MembershipPlanService`

负责会员套餐：

- 管理端套餐增删改查。
- 用户端只返回上架套餐。
- 校验金额、普通套餐天数、永久套餐、折扣时间。
- 创建订单时生成套餐快照，避免后续编辑影响历史订单。

### `MembershipOrderService`

负责会员订单：

- 创建 15 分钟有效的待支付订单。
- 调用 `WechatPayService` 创建小程序支付参数。
- 查询用户订单和管理端订单。
- 处理支付成功、幂等开通会员、记录微信交易号。
- 定时关闭超时未支付订单。

### `WechatPayService`

负责微信支付集成边界：

- mock 模式下返回模拟 `wx.requestPayment` 参数，并支持模拟支付通知。
- 真实微信支付模式下调用微信支付 API v3 JSAPI/小程序下单。
- 使用商户私钥生成微信支付 API 请求签名和小程序 `wx.requestPayment` 的 `paySign`。
- 使用微信支付平台证书校验回调签名。
- 使用 API v3 密钥解密回调资源数据。

### `PcWechatLoginService`

负责 PC 微信扫码登录临时票据。

流程：

1. PC 调用创建 session，后端生成 `ticketId` 和 `pollToken`。
2. PC 显示包含 `xiaoyouyingyu://pc-login?ticket=...` 的二维码。
3. 小程序端读取 ticket，调用场景查询接口展示设备信息。
4. 小程序用户确认登录。
5. PC 轮询接口拿到 token 并完成登录。

注意：

- ticket 存在内存 `ConcurrentHashMap` 中，不适合多实例共享。
- 如要多实例部署，建议改为 Redis 或数据库存储。

### `WordBookService` / `WordService` / `WordGenerationService`

### `DailyArticleService`

每日外刊核心业务服务：

- `listForUser`：按已读/未读筛选已发布外刊。
- `getUserDetail`：校验发布状态、返回详情并自动标记已读。
- 详情响应包含精读字段：`difficultyStars`、`wordCount`、`sourceName`、`keySentences`；旧数据为空时前端隐藏对应模块。
- `listForAdmin` / `getAdminDetail`：管理端查看库存。
- `create` / `update` / `changeStatus` / `delete`：维护主表和段落表。
- `publishToday`：定时任务和手动触发共用的发布方法；若今日已有外刊或无候选外刊，会返回明确提示并不产生错误数据。
- `uploadAudio`：保存音频文件并返回静态资源 URL。

每日外刊精读素材支持两类导入脚本：

- `scripts/import_daily_article_intensive_reading.java`：单篇 JSON 模板导入，默认读取 `doc/generated/daily-article-intensive-reading.template.json`。
- `scripts/import_daily_articles_from_weixin_md.java`：批量转换微信公众号 Markdown，默认读取 `/Users/admin/Documents/Codex/2026-06-26/https-mp-weixin-qq-com-s-2/outputs/weixin_articles_md`，输出 JSON 到 `doc/generated/daily-articles-intensive-reading-batch`，再写入 `daily_articles` 主表和 `daily_article_paragraphs` 段落表。

批量脚本会提取标题、音频直链、词数、难度、来源、双语正文、词汇、写作积累，并将写作积累同步为表达句型和长难句解析；导入前按英文标题、中文标题或音频 URL 查重，重复素材会跳过。

`DailyArticlePublishScheduler` 每天 `Asia/Shanghai` 06:00 调用 `publishToday`。当前通过单实例 `synchronized` 避免并发重复发布；多实例部署时建议增加数据库唯一约束或分布式锁。

负责单词练习管理端业务：

- `WordBookService`：单词本 CRUD、发布/下架、软删除和统计。
- `WordService`：单词 CRUD、单词本内归一化去重、批量操作和响应组装。
- `WordGenerationService`：调用 `AiService`，解析 AI JSON，校验字段，跳过重复词并保存；同步接口仍保留，后台任务会复用候选词生成、保存和音频生成能力。
- `WordGenerationTaskService`：创建 `word_generation_tasks` 后台任务并异步执行，持续记录 `GENERATING_WORDS`、`SAVING_WORDS`、`GENERATING_AUDIO`、`COMPLETED`、`FAILED` 等阶段，刷新页面不影响任务执行。
- `WordAudioService`：读取默认可用 TTS 模型，为单词和例句分别生成美式/英式音频并保存到本地；支持 OpenAI 兼容 `/audio/speech` 与千问 Qwen-TTS 非流式接口。Qwen-TTS 返回的临时音频 URL 会被立即下载成本地文件。
- 单词新增、AI 生成和重新生成音频时可传入 `ttsModelId` 指定 TTS 模型；未传入时使用默认可用模型。
- `TtsModelService`：管理全局 TTS 模型配置，API Key 返回时会脱敏。

### `WordPracticeService`

负责用户练习闭环：

- 下一词查询时优先返回到期复习词，没有到期复习词时返回未学新词。
- `KNOWN` 会累加连续认识次数，并按 1 天、3 天、7 天安排复习。
- 连续 4 次 `KNOWN` 后状态变为 `MASTERED`，`nextReviewAt` 置空。
- `FUZZY` 会累加模糊次数，将连续认识次数重置为 0，并安排次日复习。
- `UNKNOWN` 会将连续认识次数重置为 0，并安排次日复习。

### `AiDialogConfigService` / `AiDialogUsageService` / `AiDialogService`

负责 AI 对话闭环：

- `AiDialogConfigService`：读取唯一全局配置；数据库无配置时返回内置默认配置；保存管理员配置并校验温度、轮数和四套提示词。
- `AiDialogUsageService`：按用户和 `Asia/Shanghai` 自然日统计成功发送轮数；AI 调用成功后才扣减额度；并发更新使用数据库行锁。
- `AiDialogService`：校验主题、模式、难度、单次轮数和每日额度；构造主题上下文；解析 AI JSON；返回结构化回复。
- `AiDialogAudioService`：复用 TTS 模型为 AI 英文回复生成临时音频到 `/uploads/ai-dialog/`；TTS 失败时返回 `audioUrl=null`，对话文本结构仍正常返回。

## Entity 说明

| 实体 | 表 | 说明 |
| --- | --- | --- |
| `User` | `users` | 用户、角色、微信 openid、会员状态 |
| `Topic` | `topics` | 英语口语主题、标签、日期、问题 JSON |
| `AiModel` | `ai_models` | AI API 供应商/模型配置 |
| `AiDialogConfig` | `ai_dialog_config` | AI 对话全局配置、模型选择、轮数限制和四套提示词 |
| `AiDialogUsage` | `ai_dialog_usage` | 用户每日 AI 对话发送轮数统计，不保存对话内容 |
| `RedeemCode` | `redeem_codes` | 会员卡密 |
| `MembershipRecord` | `membership_records` | 会员变更流水 |
| `TtsModel` | `tts_models` | TTS 供应商、模型、语音、输出格式和默认模型配置，支持 OpenAI 兼容模型与 Qwen-TTS 并存 |
| `WordBook` | `word_books` | 单词本，支持草稿、已发布、已下架和软删除 |
| `Word` | `words` | 单词内容、释义、例句、音频 URL、难度、发布状态和来源 |
| `WordBookTopic` | `word_book_topics` | 单词本与口语主题的多对多关联 |
| `WordTopic` | `word_topics` | 单词与口语主题的多对多来源关联 |
| `UserWordProgress` | `user_word_progress` | 用户单词学习进度、复习时间和掌握状态 |
| `WordGenerationTask` | `word_generation_tasks` | AI 创建单词本后台任务、阶段、进度和错误摘要 |
| `ShadowingLesson` | `shadowing_lessons` | 跟读精听固定资源，包含媒体链接、元信息和结构化学习内容 JSON |
| `UserShadowingLessonRecord` | `user_shadowing_lesson_records` | 用户打开跟读精听详情的学习记录 |
| `ShadowingReviewRecord` | `shadowing_review_records` | 用户单句跟读 ASR 识别文本、评分和 AI 点评 JSON |

## Repository 说明

| Repository | 关键能力 |
| --- | --- |
| `UserRepository` | 按用户名/openid 查询、用户名存在判断、按角色计数 |
| `TopicRepository` | 话题搜索、日期范围查询、最早日期、标题去重上下文 |
| `AiModelRepository` | 查询默认模型、清空默认模型 |
| `RedeemCodeRepository` | 按 code 查询、按状态分页、倒序分页 |
| `MembershipRecordRepository` | 按用户查询会员流水 |
| `TtsModelRepository` | 查询默认/可用 TTS 模型、清空默认模型 |
| `WordBookRepository` | 单词本分页、已发布单词本查询 |
| `WordRepository` | 单词本内去重、单词筛选、练习新词查询、统计 |
| `WordBookTopicRepository` | 单词本主题关联去重与统计 |
| `WordTopicRepository` | 单词来源主题关联去重与展示 |
| `UserWordProgressRepository` | 用户练习进度、到期复习词、进度统计 |
| `WordGenerationTaskRepository` | 后台生成任务列表和任务状态持久化 |
| `DailyArticleRepository` | 用户端已发布外刊列表、管理端筛选、今日发布检查和候选外刊查询 |
| `DailyArticleParagraphRepository` | 按外刊 ID 查询、统计和替换段落 |
| `DailyArticleReadRepository` | 用户阅读记录去重和删除 |
| `ShadowingLessonRepository` | 已发布资源分页、详情查询、导入去重查询 |
| `UserShadowingLessonRecordRepository` | 用户资源学习记录查询、去重和更新 |
| `ShadowingReviewRecordRepository` | 句级跟读点评记录保存和最近记录查询 |

## 认证与授权

### JWT

`JwtUtils` 负责：

- 生成 token：subject 为 username，claim 中包含 role。
- 解析 token。
- 校验签名和过期时间。

### 请求过滤

`JwtFilter` 负责：

- 读取 `Authorization: Bearer <token>`。
- 校验 token。
- 查询用户。
- 写入 Spring Security 认证上下文。
- 如果用户会员有效，额外添加 `ROLE_MEMBER` 权限。

### 路由权限

`SecurityConfig` 主要规则：

- 注册、登录、微信登录、PC 扫码登录 session 创建/轮询：公开。
- 话题列表、详情、标签、统计、日历：公开。
- 会员联系信息：公开。
- `/api/admin/**`：仅管理员。
- `/api/learning/**`：会员、管理员或动态会员角色。
- `/api/word-practice/**`：要求登录，由控制器读取并校验用户名；登录用户可用，不限制会员状态。
- `/api/daily-articles/**`：要求登录；用户端只能读取已推送外刊，管理员可通过管理接口查看未推送内容。
- `GET /api/shadowing-lessons`、`GET /api/shadowing-lessons/{id}`：公开；游客只能拿到试看详情。
- `POST /api/shadowing-lessons/{id}/sentences/{sentenceIndex}/review`、`POST /api/shadowing-lessons/{id}/sentences/{sentenceIndex}/review-base64`、`POST /api/shadowing-lessons/speech-to-text`、`POST /api/shadowing-lessons/speech-to-text-base64`：要求登录。
- `/uploads/**`：公开读取，用于小程序和 PC 前端播放本地音频。
- 其他接口：要求登录。

## 配置说明

配置文件：`src/main/resources/application.yml`

主要配置项：

| 配置 | 说明 |
| --- | --- |
| `spring.datasource.*` | MySQL 连接 |
| `spring.jpa.hibernate.ddl-auto` | 当前为 `update`，启动时自动同步实体表结构 |
| `wechat.appid` / `wechat.secret` | 微信小程序登录配置 |
| `app.jwt.secret` | JWT 签名密钥 |
| `app.jwt.expiration-ms` | JWT 过期时间 |
| `app.ai.*` | 默认 AI API 配置 |
| `app.upload.dir` | 本地上传/音频保存目录，默认 `uploads` |

单词音频保存路径以单词本为维度组织：`{app.upload.dir}/word-audio/{wordBookId}/{wordId}/`，对外 URL 为 `/uploads/word-audio/{wordBookId}/{wordId}/...`。

单词表还支持公共词典发音 URL 后台补全任务。`PublicDictionaryWordAudioBackfillScheduler` 会在服务启动后按配置慢速扫描 `words` 表中缺少 `audio_us_url` 或 `audio_uk_url` 的单词，每次只处理一个词：

- 优先查询 Free Dictionary API 返回的公开发音 URL。
- 未命中时查询 Wiktionary 原页中的英文发音模板，并通过 Wikimedia Commons API 获取实际媒体 URL。
- 只写入当前为空的 `audio_us_url` / `audio_uk_url`，不会覆盖已有本地 TTS 音频。
- 英美音只在来源明确标记 `US`、`GA`、`UK`、`RP`、`GB` 或文件名明确包含 `en-us` / `en-uk` 时写入。
- 两侧发音都补齐后将 `audio_status` 置为 `READY`；只补到一侧时保留现有状态并把 `audio_error` 标记为 `PUBLIC_DICTIONARY_AUDIO_PARTIAL`；公共来源没有可用音频时标记为 `PUBLIC_DICTIONARY_AUDIO_MISSING`。
- 后台任务会跳过 `PUBLIC_DICTIONARY_AUDIO_PARTIAL` 和 `PUBLIC_DICTIONARY_AUDIO_MISSING`，避免反复请求同一个词；如需重新尝试，清空对应单词的 `audio_error` 后任务会再次扫描。
- 遇到 Wiktionary / Commons 429 限流时按 `app.word-audio.public-source.wiktionary-backoff-ms` 暂停后续 Wiktionary 补抓，避免高频请求公共服务。

相关配置：

| 配置 | 默认值 | 说明 |
| --- | --- | --- |
| `app.word-audio.public-source.enabled` | `true` | 是否启用公共词典发音 URL 后台补全 |
| `app.word-audio.public-source.initial-delay-ms` | `30000` | 服务启动后首次执行延迟 |
| `app.word-audio.public-source.delay-ms` | `5000` | 每次处理一个单词后的固定延迟 |
| `app.word-audio.public-source.wiktionary-backoff-ms` | `600000` | Wiktionary / Commons 限流后的退避时长 |
| `app.word-audio.public-source.user-agent` | `xiaoyouyingyu-public-dictionary-audio/1.0` | 访问公共 API 的 User-Agent |

公共发音 URL 来自 Free Dictionary API、Wiktionary 和 Wikimedia Commons，使用时应在产品或关于页面注明来源，并按 Commons 文件页面的许可要求保留署名和 license 信息。当前 `words` 表只保存播放 URL；如需逐条展示署名和许可证，应新增来源/许可字段或单独的音频来源表。

每日外刊音频保存路径为 `{app.upload.dir}/daily-articles/`，对外 URL 为 `/uploads/daily-articles/...`。

跟读精听 V1 使用外部视频/音频 URL 或导入资料中的媒体 URL；句级录音通过 multipart 上传给 ASR 服务，处理后只保存识别文本和点评结果，不落长期音频文件。

## 跟读精听导入脚本

开发阶段通过 `scripts/import-shadowing-lessons/import_shadowing_lessons.js` 导入 Markdown 资料：

```bash
node scripts/import-shadowing-lessons/import_shadowing_lessons.js \
  --file /abs/path/lesson.md \
  --out /tmp/shadowing.sql
```

默认生成 SQL，不直接连库。直接执行模式使用本机 `mysql` CLI，并读取 `XIAOYOU_DB_URL`、`XIAOYOU_DB_USER`、`XIAOYOU_DB_PASSWORD`：

```bash
node scripts/import-shadowing-lessons/import_shadowing_lessons.js \
  --file /abs/path/lesson.md \
  --execute
```

脚本会解析元信息、媒体链接、精听挑战、对照原文、逐句跟读、表达和口头填空，并按 `source_url` 幂等更新。

安全建议：

- 生产环境不要把数据库密码、微信密钥、JWT 密钥、AI Key 写入仓库。
- 建议改为环境变量，例如 `${SPRING_DATASOURCE_URL}`、`${APP_JWT_SECRET}`、`${APP_AI_API_KEY}`。

## 后端本地启动

```bash
mvn spring-boot:run
```

默认后端端口为 Spring Boot 默认端口 `8080`。

## 后端构建

```bash
mvn clean package
```

构建产物位于 `target/`，可通过 `java -jar` 运行。
