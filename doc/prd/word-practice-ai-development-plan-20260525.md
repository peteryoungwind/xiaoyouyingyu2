# 小柚英语单词练习功能 AI 开发计划

> 日期：2026-05-25
> 依据文档：`doc/prd/word-practice-requirements-20260525.md`
> 目标读者：后续负责实现的 AI 编码代理或开发者

## 1. 实施原则

- 在改代码前先阅读 `doc/README.md`、`doc/repository-overview.md`、`doc/backend.md`、`doc/frontend.md`、`doc/miniapp.md`、`doc/api-and-data-model.md`。
- 后端沿用 Spring Boot、Spring Security、Spring Data JPA、MySQL、Lombok。
- PC 前端沿用 Next.js App Router、React Query、Tailwind、Radix UI、Lucide React。
- 小程序沿用原生 WXML/WXSS/JS，通过 `utils/api.js` 调用后端 REST API。
- AI 调用复用现有 `AiService` 与 `ai_models` 配置。
- 先实现可闭环 v1，再考虑异步任务、复杂测验和增长功能。

## 2. 交付阶段

### Phase 0：代码现状确认

任务：

- 阅读现有实体、Repository、Controller、Service、SecurityConfig。
- 阅读 PC 后台 `/admin` 页面结构和 API 封装 `frontend/src/lib/api.ts`。
- 阅读小程序首页、学习中心、页面注册和 `xiaochengxu/miniprogram/utils/api.js`。
- 确认当前数据库迁移方式。如果没有正式迁移工具，按项目现状补充 JPA 实体并记录 SQL 建议。

产出：

- 明确需要新增的后端类、前端页面、小程序页面。
- 确认是否已有软删除模式、分页 DTO、统一异常处理工具。

### Phase 1：后端数据模型

新增枚举建议：

- `WordBookStatus`：`DRAFT`、`PUBLISHED`、`OFFLINE`
- `WordDifficulty`：`BEGINNER`、`ADVANCED`
- `WordStatus`：`DRAFT`、`PUBLISHED`、`OFFLINE`
- `UserWordStatus`：`NEW`、`LEARNING`、`REVIEWING`、`MASTERED`
- `WordPracticeResult`：`KNOWN`、`UNKNOWN`
- `WordAudioStatus`：`PENDING`、`READY`、`FAILED`

新增实体建议：

- `WordBook`
- `Word`
- `WordTopic`
- `WordBookTopic`
- `UserWordProgress`

新增 Repository：

- `WordBookRepository`
- `WordRepository`
- `WordTopicRepository`
- `WordBookTopicRepository`
- `UserWordProgressRepository`

关键约束：

- `words` 建议使用 `word_book_id + normalized_word` 唯一约束。
- `user_word_progress` 建议使用 `user_id + word_id` 唯一约束。
- 删除优先软删除，避免破坏历史学习进度。

验收：

- 项目可启动。
- JPA 实体字段与需求文档一致。
- Repository 支持按单词本、难度、状态、关键词、来源主题分页查询。

### Phase 2：后端核心业务服务

新增服务建议：

- `WordBookService`
  - 单词本 CRUD
  - 发布/下架
  - 统计初级/进阶词数
- `WordService`
  - 单词 CRUD
  - 单词本内去重
  - 批量发布/下架/删除/排序
  - 批量重新生成音频
- `WordGenerationService`
  - 按场景生成
  - 按口语主题生成
  - AI JSON 解析和校验
  - 重复跳过和主题关联补充
- `WordAudioService`
  - 调用后台配置的 TTS 模型
  - 生成单词美式/英式发音
  - 生成例句美式/英式发音
  - 保存音频到服务端本地目录
  - 返回可访问音频 URL
- `WordPracticeService`
  - 获取单词本列表和用户进度摘要
  - 获取下一批待练习单词
  - 提交认识/不认识
  - 计算复习时间和掌握状态

复习规则实现：

```text
KNOWN:
  consecutiveKnownCount += 1
  knownCount += 1
  studyCount += 1
  if consecutiveKnownCount >= 4:
    status = MASTERED
    masteredAt = now
    nextReviewAt = null
  else:
    status = REVIEWING
    nextReviewAt = now + intervalByCount(consecutiveKnownCount)

UNKNOWN:
  consecutiveKnownCount = 0
  unknownCount += 1
  studyCount += 1
  status = REVIEWING
  nextReviewAt = now + 1 day
```

间隔：

- 1 次认识：1 天
- 2 次认识：3 天
- 3 次认识：7 天
- 4 次认识：15 天，但达到 4 次后直接 `MASTERED`，`nextReviewAt` 可为空

验收：

- 单元测试覆盖复习规则。
- 同一用户对同一单词反复提交时进度正确更新。
- 不同用户进度互不影响。

### Phase 3：后端 API

新增管理端 Controller：

- `AdminWordBookController`

接口：

- `GET /api/admin/word-books`
- `POST /api/admin/word-books`
- `GET /api/admin/word-books/{id}`
- `PUT /api/admin/word-books/{id}`
- `PATCH /api/admin/word-books/{id}/publish`
- `PATCH /api/admin/word-books/{id}/offline`
- `DELETE /api/admin/word-books/{id}`
- `GET /api/admin/word-books/{id}/words`
- `POST /api/admin/word-books/{id}/words`
- `PUT /api/admin/words/{wordId}`
- `DELETE /api/admin/words/{wordId}`
- `POST /api/admin/word-books/{id}/generate-by-scene`
- `POST /api/admin/word-books/{id}/generate-by-topics`
- `POST /api/admin/words/batch-publish`
- `POST /api/admin/words/batch-offline`
- `POST /api/admin/words/batch-delete`
- `POST /api/admin/words/batch-sort`
- `POST /api/admin/words/batch-regenerate-audio`
- `GET /api/admin/tts-models`
- `POST /api/admin/tts-models`
- `PUT /api/admin/tts-models/{id}`
- `DELETE /api/admin/tts-models/{id}`
- `PATCH /api/admin/tts-models/{id}/default`

新增用户端 Controller：

- `WordPracticeController`

接口：

- `GET /api/word-practice/books`
- `GET /api/word-practice/books/{bookId}`
- `GET /api/word-practice/books/{bookId}/next`
- `GET /api/word-practice/words/{wordId}`
- `POST /api/word-practice/words/{wordId}/answer`
- `GET /api/word-practice/books/{bookId}/progress`
- `GET /api/word-practice/books/{bookId}/words`

权限：

- `/api/admin/word-books/**` 和 `/api/admin/words/**`：`ADMIN`
- `/api/word-practice/**`：建议先与学习中心一致，允许 `PREMIUM_USER`、`ADMIN`、动态 `MEMBER`

验收：

- 管理员接口非管理员访问返回 403。
- 用户端接口未登录返回 401。
- 非会员访问用户端接口按现有学习中心策略返回无权限。

### Phase 4：AI 生成与 TTS 本地音频

AiService 扩展：

- 新增 `generateWordsByScene(...)`
- 新增 `generateWordsByTopics(...)`

内置提示词要求：

- 返回严格 JSON。
- 字段包含：
  - `word`
  - `phonetic`
  - `partOfSpeech`
  - `definitionZh`
  - `definitionEn`
  - `commonPatterns`
  - `exampleEn`
  - `exampleZh`
  - `difficulty`
  - `sourceScene`
- 单词排序需按语义相关性组织，相关词相邻。
- 初级词汇应高频、基础、适合场景入门表达。
- 进阶词汇应更精确、更地道，适合表达升级。

TTS 模型配置：

- 后台新增 TTS 模型配置能力，推荐复用现有 `AiModel` 管理风格；如现有模型表不适合区分聊天模型和 TTS 模型，则新增 `TtsModel` 实体。
- 配置字段建议包含：
  - `name`
  - `baseUrl`
  - `apiKey`
  - `modelName`
  - `provider`
  - `defaultModel`
  - `voiceUs`
  - `voiceUk`
  - `outputFormat`
  - `enabled`
- API Key 不返回明文，编辑时脱敏展示。
- 单词生成弹窗默认使用默认 TTS 模型，也可选择可用 TTS 模型。

本地音频策略：

- 文本模型只负责生成单词内容、释义、句型、例句等结构化文本。
- 文本生成保存前或保存后，系统调用 `WordAudioService` 生成音频。
- 每个单词生成 4 个音频文件：
  - 单词美式发音
  - 单词英式发音
  - 英文例句美式发音
  - 英文例句英式发音
- 音频文件保存到服务端本地目录，例如：

```text
uploads/word-audio/{wordId}/word-us.mp3
uploads/word-audio/{wordId}/word-uk.mp3
uploads/word-audio/{wordId}/example-us.mp3
uploads/word-audio/{wordId}/example-uk.mp3
```

- 文件 URL 或相对路径写入 `words` 表：
  - `audio_us_url`
  - `audio_uk_url`
  - `example_audio_us_url`
  - `example_audio_uk_url`
- 后端需要提供静态资源访问配置，使小程序和 PC 前端可以播放本地保存的音频。
- 重新生成音频时，应覆盖旧文件或写入新文件并更新 URL；若覆盖失败，应避免留下错误 URL。
- 音频生成失败时保留单词文本内容，将 `audio_status` 标记为 `FAILED`，记录 `audio_error`，允许后台批量重新生成。

验收：

- AI 返回格式异常不会导致服务崩溃。
- 重复词正确跳过。
- TTS 模型可在后台配置。
- 单词和例句的美式/英式音频保存到本地并可播放。
- 音频失败可重试。

### Phase 5：PC 前端 API 封装

修改 `frontend/src/lib/api.ts`：

- 增加管理端单词本 API 方法。
- 增加 AI 生成 API 方法。
- 增加批量操作 API 方法。
- 类型定义建议放在同文件或新建 `frontend/src/lib/word-practice.ts`，按现有风格决定。

需要的 TypeScript 类型：

- `WordBook`
- `Word`
- `WordBookStats`
- `GenerateBySceneRequest`
- `GenerateByTopicsRequest`
- `GenerateResult`
- `BatchWordRequest`
- `TtsModel`

验收：

- 所有新增接口自动携带 token。
- 401 和错误提示沿用现有封装。

### Phase 6：PC 后台页面

推荐路由：

- `/admin/word-books`：单词本列表
- `/admin/word-books/[id]`：单词本详情与单词管理

也可以集成到现有 `/admin` tab，但若现有页面已经很大，建议拆独立页面并在侧边栏加入口。

单词本列表能力：

- 表格展示名称、状态、初级词数、进阶词数、发布词数、关联主题数、更新时间。
- 新建、编辑、发布、下架、删除。

单词本详情能力：

- 筛选：关键词、难度、发布状态、来源主题。
- 单词表格：勾选、多选、批量操作。
- AI 生成弹窗。
- 单词编辑弹窗。
- TTS 模型配置入口，或在现有模型管理中增加 TTS 模型类型。
- 生成结果摘要 Toast 或 Alert。

主题创建成功弹窗：

- 在现有后台创建主题成功后插入提示。
- 弹窗字段：目标单词本、初级数量、进阶数量、模型。
- 跳过不影响主题创建。

验收：

- 管理员可完成全链路配置。
- 批量操作后表格刷新。
- 生成失败有清晰提示。

### Phase 7：小程序 API 与页面注册

修改：

- `xiaochengxu/miniprogram/app.json`
- `xiaochengxu/miniprogram/utils/api.js`
- 首页 `pages/home/index`
- 学习中心 `pages/learning/index`

新增页面建议：

- `pages/wordBooks/index`：单词本列表
- `pages/wordBookDetail/index`：单词本学习首页和难度切换
- `pages/wordPractice/index`：练习页
- `pages/wordDetail/index`：单词详情页，或在练习页内做详情面板

API 方法：

- `getWordBooks`
- `getWordBookDetail`
- `getNextWords`
- `getWordDetail`
- `submitWordAnswer`
- `getWordBookProgress`
- `getWordBookWords`

验收：

- 首页入口能进入单词本列表。
- 学习中心入口能进入单词本列表。
- 未登录和非会员按现有逻辑引导。

### Phase 8：小程序练习体验

单词本列表：

- 展示名称、描述、初级/进阶词数、已学、待复习、已掌握。

单词本详情：

- 难度切换：初级、进阶。
- 学习概览：总词数、已学、待复习、已掌握。
- 主按钮：开始练习。

练习页：

- 首屏只突出英文单词。
- 提供美式和英式发音按钮。
- 提供“认识”“不认识”“查看详情”。
- 认识/不认识提交后自动加载下一词。
- 当前没有可练习内容时展示完成状态。

详情页/面板：

- 展示释义、音标、词性、句型、例句、来源主题。
- 支持播放美式/英式发音。

验收：

- 点认识后连续次数增加并安排复习。
- 点不认识后连续次数重置。
- 4 次认识后显示已掌握。
- 本地音频 URL 播放失败时有提示。

### Phase 9：文档同步

实现完成后更新：

- `doc/backend.md`
- `doc/frontend.md`
- `doc/miniapp.md`
- `doc/api-and-data-model.md`
- 必要时更新 `doc/README.md` 的文档索引。

更新内容：

- 新增实体和表。
- 新增 API。
- 新增 PC 页面。
- 新增小程序页面。
- 新增 AI 生成、TTS 模型配置与本地音频策略。

### Phase 10：测试与验证

后端建议执行：

```bash
mvn test
```

PC 前端建议执行：

```bash
cd frontend
npm run build
```

小程序建议手工验证：

- 微信开发者工具打开 `xiaochengxu`。
- 检查页面注册无误。
- 检查首页和学习中心入口。
- 使用测试账号跑完整练习流程。

核心测试用例：

- 管理员创建单词本。
- 管理员按场景生成初级词。
- 管理员按主题生成进阶词。
- 重复词跳过。
- 批量发布/下架/删除。
- 用户学习新词。
- 用户复习到期词。
- 用户连续 4 次认识后掌握。
- 不同用户进度隔离。

## 3. 推荐实现顺序

1. 后端实体、枚举、Repository。
2. 后端复习规则服务和单元测试。
3. 管理端单词本/单词 CRUD API。
4. 用户端单词练习 API。
5. AI 生成服务、TTS 模型配置和本地音频策略。
6. PC 前端 API 封装。
7. PC 单词本管理页面。
8. PC 主题创建后的补充词汇弹窗。
9. 小程序 API 封装和页面注册。
10. 小程序单词本列表、详情、练习、详情展示。
11. 全链路测试。
12. 文档同步。

## 4. 关键风险与处理

### 风险 1：TTS 模型能力和文件存储路径不明确

处理：

- 先封装 `WordAudioService` 接口，避免 TTS 供应商逻辑散落在业务服务中。
- TTS 模型后台可配置，默认模型缺失时禁止发起音频生成并给出明确提示。
- 本地音频保存目录做成配置项，例如 `app.upload.word-audio-dir`。
- 对外访问 URL 前缀做成配置项，例如 `app.upload.public-base-url`。
- 若音频生成失败，不阻塞单词落库，但标记可重试。

### 风险 2：AI 返回 JSON 不稳定

处理：

- 提示词要求严格 JSON。
- 服务端使用 DTO 校验。
- 单条失败不影响其他有效单词保存。
- 返回生成摘要。

### 风险 3：后台 `/admin` 页面继续膨胀

处理：

- 优先新建独立 `/admin/word-books` 路由。
- 侧边栏新增“单词训练”入口。

### 风险 4：重复词与多主题关联冲突

处理：

- 单词实体按 `word_book_id + normalized_word` 去重。
- 若重复但来源主题不同，只新增 `word_topics` 关联。

### 风险 5：复习队列排序不符合预期

处理：

- 获取下一批时优先 `nextReviewAt <= now` 的复习词，按 `nextReviewAt` 升序。
- 无复习词时取未学习新词，按后台 `sort_order` 和创建时间。

## 5. 待实现前最终确认

- 单词练习是否只允许会员使用。
- AI 生成接口是否先同步实现，还是直接使用异步任务。
- 单词详情是否 v1 支持多个例句；当前计划按一个主例句实现。
