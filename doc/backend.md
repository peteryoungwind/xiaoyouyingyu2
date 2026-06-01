# 后端说明

> 最后更新：2026-05-25

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

- `SecurityConfig` 中限制为 `PREMIUM_USER`、`ADMIN` 或动态会员角色 `MEMBER`。
- 后端会员判定统一由 `User.isMembershipActive()` 提供，`ADMIN`、`PREMIUM_USER` 和未过期会员都会被视为会员。

### `MembershipController`

路径前缀：`/api`

负责：

- 查询当前用户会员状态。
- 返回开通会员联系信息。
- 用户兑换卡密。

### `AdminController`

路径前缀：`/api/admin`

负责管理员功能：

- 话题创建、更新、删除。
- 用户列表、删除用户、修改角色。
- AI 旧生成接口兼容。
- AI 标题生成、问题生成。
- AI 模型增删改查。
- 卡密生成、列表、禁用。
- 设置用户会员到期时间、追加会员天数、查看会员记录。

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

### `WordPracticeController`

路径前缀：`/api/word-practice`

负责用户端单词练习功能：

- 查询已发布单词本和个人进度。
- 查询单词本详情、下一批练习词、单词详情。
- 提交“认识/不认识”并更新复习计划。

权限由 `SecurityConfig` 要求有效登录态，控制器内统一读取并校验用户名；登录用户均可访问，不限制会员状态。

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
- `generateTasks`：学习中心练习任务。
- `reviewAnswer`：点评用户回答。

模型选择：

- 传入 `modelId` 时优先使用 `ai_models` 表中的配置。
- 未传入或找不到模型时，使用 `application.yml` 中的默认 AI 配置。

返回约定：

- AI 被要求返回严格 JSON 字符串。
- Controller 将 JSON 字符串包装为 `{ "content": "..." }` 返回给前端。

### `MembershipService`

负责会员与卡密：

- `grantRegistrationGift`：新用户注册赠送 3 天会员。
- `redeemCode`：校验卡密状态并给用户延长会员。
- `setMembershipExpireAt`：管理员直接设置到期时间。
- `addMembershipDays`：管理员追加会员天数。
- `generateCodes`：批量生成卡密。
- `getUserRecords`：查看会员变更记录。

卡密状态：

- `ACTIVE`：可用。
- `USED`：已使用。
- `DISABLED`：已禁用。
- 过期判断通过 `expireAt` 动态判断。

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

## Entity 说明

| 实体 | 表 | 说明 |
| --- | --- | --- |
| `User` | `users` | 用户、角色、微信 openid、会员状态 |
| `Topic` | `topics` | 英语口语主题、标签、日期、问题 JSON |
| `AiModel` | `ai_models` | AI API 供应商/模型配置 |
| `RedeemCode` | `redeem_codes` | 会员卡密 |
| `MembershipRecord` | `membership_records` | 会员变更流水 |
| `TtsModel` | `tts_models` | TTS 供应商、模型、语音、输出格式和默认模型配置，支持 OpenAI 兼容模型与 Qwen-TTS 并存 |
| `WordBook` | `word_books` | 单词本，支持草稿、已发布、已下架和软删除 |
| `Word` | `words` | 单词内容、释义、例句、音频 URL、难度、发布状态和来源 |
| `WordBookTopic` | `word_book_topics` | 单词本与口语主题的多对多关联 |
| `WordTopic` | `word_topics` | 单词与口语主题的多对多来源关联 |
| `UserWordProgress` | `user_word_progress` | 用户单词学习进度、复习时间和掌握状态 |
| `WordGenerationTask` | `word_generation_tasks` | AI 创建单词本后台任务、阶段、进度和错误摘要 |

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
