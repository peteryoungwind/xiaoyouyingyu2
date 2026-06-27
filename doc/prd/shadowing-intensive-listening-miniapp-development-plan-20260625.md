# 小柚英语微信小程序跟读精听模块开发计划

> 日期：2026-06-25
> 依据文档：
> - `doc/prd/shadowing-intensive-listening-miniapp-requirements-20260624.md`
> - `doc/prototypes/shadowing-intensive-listening/index.html`
> 目标读者：后续负责实现的 AI 编码代理或开发者

---

## 1. 实施原则

- 在改代码前先阅读：
  - `doc/README.md`
  - `doc/repository-overview.md`
  - `doc/backend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`
  - `doc/prd/shadowing-intensive-listening-miniapp-requirements-20260624.md`
  - `doc/prototypes/shadowing-intensive-listening/index.html`
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- 小程序端沿用原生 WXML/WXSS/JS，通过 `xiaochengxu/miniprogram/utils/api.js` 和 `utils/request.js` 直连 Spring Boot REST API。
- AI 能力优先复用现有 `AiService`、默认 `AiModel` 配置以及项目内现有 ASR 调用链路。
- 跟读精听是固定内容资源模块，不再沿用“口语热身”的 AI 即时生成模式。
- 学习页遵循已确认原型：顶部媒体卡 + 连续学习流，不做多个割裂的大模块卡片。
- 游客可浏览列表并试看详情，但详情只展示媒体和简介；完整学习内容只对登录用户开放。
- 用户点开详情页即记为已学习；V1 不做“完成度”判断，不要求看完视频、做完录音或滚动到底。
- 发音评分采用“现有 ASR + AI 综合评分”，不接入专业发音评测服务。
- 录音文件只用于临时处理，不长期保存；数据库仅保存识别文本、评分和点评 JSON。
- 开发阶段通过脚本批量导入 Markdown 资料，V1 不做 PC 管理后台。
- 每个关键链路都需要独立 loading、error、empty、permission 状态，不能因为一个接口失败导致整页不可用。
- 实现完成后同步更新 `doc/miniapp.md`、`doc/backend.md`、`doc/api-and-data-model.md`。

---

## 2. 交付目标

### V1 完成标志

1. 小程序首页或学习模块中不再对用户暴露“口语热身”，改为“跟读精听”。
2. 游客和登录用户都可以进入跟读精听列表页。
3. 列表页支持 `未学习 / 已学习` 两个 tab。
4. 游客打开详情页时，只看到媒体和简介。
5. 登录用户打开详情页时，后端自动创建或更新学习记录。
6. 登录用户已打开的资源会进入已学习列表，并从未学习列表移除。
7. 详情页顶部支持独立视频播放和独立音频播放。
8. 详情页采用连续学习流布局，而不是多个强割裂模块。
9. 登录用户能看到对照原文、逐句跟读、地道表达和中文翻译练习。
10. 逐句跟读支持播放句子对应时间段。
11. 用户可以对单句进行录音。
12. 用户可以回放本次录音。
13. 用户可以提交单句录音获得 AI 点评。
14. 后端先对录音执行 ASR，再调用 AI 生成总分、发音、流利度、准确度和建议。
15. 数据库不保存长期录音文件。
16. 后端保存跟读点评文本和评分结果。
17. Markdown 示例资料可以通过脚本导入为正式资源。
18. 导入后的资源可以在小程序列表和详情页正常展示。
19. 详情页在媒体失败、无表达、无翻译练习、无登录等状态下有稳定兜底。
20. 跟读精听关键路径具备可执行测试或人工验收记录。

---

## 3. 任务总览

### Phase 0：现状确认与边界锁定

### Phase 1：后端数据模型与迁移方案

### Phase 2：Markdown 导入脚本

### Phase 3：后端资源读取与学习记录接口

### Phase 4：后端录音点评链路

### Phase 5：小程序 API 封装与页面注册

### Phase 6：首页与学习模块入口替换

### Phase 7：跟读精听列表页

### Phase 8：跟读精听详情页

### Phase 9：录音、回放与 AI 点评交互

### Phase 10：体验打磨与异常兜底

### Phase 11：测试、联调与验收

### Phase 12：文档同步与上线准备

---

## 4. Phase 0：现状确认与边界锁定

### 4.1 阅读后端现有能力

任务：

- 阅读：
  - `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
  - `src/main/java/com/xiaoyouyingyu/controller/LearningController.java`
  - `src/main/java/com/xiaoyouyingyu/controller/SpokenWarmupController.java`
  - `src/main/java/com/xiaoyouyingyu/service/AiService.java`
  - `src/main/java/com/xiaoyouyingyu/entity/AiModel.java`
  - `src/main/java/com/xiaoyouyingyu/repository/AiModelRepository.java`
  - 现有 ASR、TTS、语音相关 service/controller
- 确认已有真实语音转文字接口或 service 是否可复用。
- 确认现有上传目录、临时文件存放位置、静态资源映射方式。
- 确认默认 AI 模型读取逻辑和失败路径。

产出：

- 输出现有 ASR 能力可复用清单。
- 明确跟读精听是否直接复用部分 `spokenWarmup` 控制器逻辑，或新建独立控制器更清晰。
- 明确录音临时文件在后端的处理方式。

验收：

- 确认 V1 必须新增数据库表。
- 确认 V1 不需要 PC 管理端路由。

### 4.2 阅读小程序现有结构

任务：

- 阅读：
  - `xiaochengxu/miniprogram/app.json`
  - `xiaochengxu/miniprogram/app.js`
  - `xiaochengxu/miniprogram/utils/request.js`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/audio.js`
  - `xiaochengxu/miniprogram/pages/home/*`
  - `xiaochengxu/miniprogram/pages/learning/*`
  - `xiaochengxu/miniprogram/pages/spokenWarmup/*`
  - `xiaochengxu/miniprogram/pages/spokenWarmupDetail/*`
  - `xiaochengxu/miniprogram/pages/dailyArticleDetail/*`
  - `xiaochengxu/miniprogram/pages/aiDialogChat/*`
- 确认首页学习入口当前实现位置。
- 确认学习 tab 中“口语热身”的承接方式。
- 确认小程序录音、播放、权限申请是否已有可复用逻辑。

产出：

- 明确页面命名方案：
  - 可选方案 A：复用 `pages/spokenWarmup` 与 `pages/spokenWarmupDetail`，改为“跟读精听”语义。
  - 可选方案 B：新增 `pages/shadowingLessons` 与 `pages/shadowingLessonDetail`。
- 推荐优先采用方案 B，避免旧语义和新结构混在一起；如果改动风险过高，再退回方案 A。

验收：

- 输出新增/修改文件清单。
- 确认不影响 AI 对话、每日外刊、单词练习等现有入口。

### 4.3 阅读原型并锁定 UI 范围

任务：

- 阅读原型：
  - `doc/prototypes/shadowing-intensive-listening/index.html`
  - `doc/prototypes/shadowing-intensive-listening/pages/01-list-unlearned.html`
  - `doc/prototypes/shadowing-intensive-listening/pages/03-detail-guest.html`
  - `doc/prototypes/shadowing-intensive-listening/pages/04-detail-member.html`
  - `doc/prototypes/shadowing-intensive-listening/pages/05-review-result.html`
- 锁定以下视觉规则：
  - 列表页使用浅灰背景、白色卡片、明亮蓝色主色。
  - 详情页采用媒体卡 + 连续学习流。
  - AI 点评使用底部抽屉，不跳转整页。

验收：

- 输出页面与原型映射关系。
- 确认实现阶段不再回退为强割裂模块卡片布局。

---

## 5. Phase 1：后端数据模型与迁移方案

### 5.1 新增枚举

建议新增：

- `ShadowingLessonStatus`
  - `DRAFT`
  - `PUBLISHED`
  - `DISABLED`

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/ShadowingLessonStatus.java`

### 5.2 新增实体：ShadowingLesson

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/ShadowingLesson.java`

建议字段：

- `id: Long`
- `title: String`
- `titleZh: String`
- `description: String`
- `episodeNo: String`
- `category: String`
- `topic: String`
- `sourceName: String`
- `sourceUrl: String`
- `thumbnailUrl: String`
- `videoUrl: String`
- `audioUrl: String`
- `publishedDate: LocalDate`
- `sentenceCount: Integer`
- `expressionCount: Integer`
- `contentJson: String`
- `status: ShadowingLessonStatus`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

字段建议：

- `contentJson` 使用 `@Lob` 或 `LONGTEXT`，兼容 JSON 字符串存储。
- `sourceUrl` 建议唯一或与 `episodeNo` 组合去重。
- 用户端只查询 `PUBLISHED` 资源。

索引建议：

- `status, published_date`
- `source_url`
- `episode_no`

验收：

- JPA 能创建 `shadowing_lessons` 表。
- `contentJson` 可保存完整学习结构。

### 5.3 新增实体：UserShadowingLessonRecord

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/UserShadowingLessonRecord.java`

建议字段：

- `id: Long`
- `userId: Long`
- `lessonId: Long`
- `firstOpenedAt: LocalDateTime`
- `lastOpenedAt: LocalDateTime`

约束建议：

- `user_id + lesson_id` 唯一。

验收：

- 同一用户重复打开同一资源只更新 `lastOpenedAt`。
- 首次打开写入 `firstOpenedAt`。

### 5.4 新增实体：ShadowingReviewRecord

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/ShadowingReviewRecord.java`

建议字段：

- `id: Long`
- `userId: Long`
- `lessonId: Long`
- `sentenceIndex: Integer`
- `referenceText: String`
- `recognizedText: String`
- `overallScore: Integer`
- `pronunciationScore: Integer`
- `fluencyScore: Integer`
- `accuracyScore: Integer`
- `feedbackJson: String`
- `createdAt: LocalDateTime`

规则：

- 不保存长期录音 URL。
- 分数范围校验在 service 层完成。

验收：

- 成功点评后数据库能写入一条记录。

### 5.5 新增 Repository

建议文件：

- `src/main/java/com/xiaoyouyingyu/repository/ShadowingLessonRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/UserShadowingLessonRecordRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/ShadowingReviewRecordRepository.java`

关键方法：

- `ShadowingLessonRepository`
  - `findByIdAndStatus(...)`
  - 用户端分页查询已发布资源。
- `UserShadowingLessonRecordRepository`
  - `findByUserIdAndLessonId(...)`
  - 查询已学习资源 ID 集合。
- `ShadowingReviewRecordRepository`
  - 按 `userId + lessonId + sentenceIndex` 查询最近一条记录，可选。

### 5.6 数据迁移说明

如果当前项目继续使用 `ddl-auto: update`，实体可自动建表；仍建议在文档或 SQL 记录中补充表结构说明，后续切 Flyway 时可直接迁移。

验收：

- 本地启动后新表自动创建成功。
- 若线上环境禁用自动建表，则需补手动 SQL。

---

## 6. Phase 2：Markdown 导入脚本

### 6.1 新增导入脚本

建议位置：

- `scripts/import-shadowing-lessons/`

建议文件：

- `scripts/import-shadowing-lessons/README.md`
- `scripts/import-shadowing-lessons/import_shadowing_lessons.js`

推荐原因：

- 项目已有前端 Node 环境，Markdown 解析和 JSON 整理用 Node 编写更轻便。
- 也可改为 Java `CommandLineRunner` 或独立 CLI，但 Node 更适合文本预处理。

### 6.2 解析规则

必须解析：

- 页面标题
- 站内标题
- 栏目
- 日期
- 主题
- 原视频链接
- 页面缩略图
- 视频资源链接
- 音频资源链接
- 英文对照文本
- 中文对照文本
- 逐句跟读列表
- 表达列表
- 中文翻译练习全文

需要组装：

- `description`
- `sentenceCount`
- `expressionCount`
- `contentJson`

### 6.3 去重与幂等

规则：

- 优先使用 `sourceUrl` 去重。
- 无 `sourceUrl` 时使用 `episodeNo + category` 去重。
- 重复导入时更新而不是新增。

输出要求：

- 新增数量
- 更新数量
- 跳过数量
- 失败文件路径和原因

### 6.4 导入方式

建议实现两种模式：

- 单文件导入：
  - `node scripts/import-shadowing-lessons/import_shadowing_lessons.js --file /abs/path/file.md`
- 目录导入：
  - `node scripts/import-shadowing-lessons/import_shadowing_lessons.js --dir /abs/path/folder`

验收：

- 示例 Markdown 可成功导入。
- 重复执行导入不会制造重复记录。
- 导入失败时日志可读。

---

## 7. Phase 3：后端资源读取与学习记录接口

### 7.1 新增 DTO

建议新增：

- `ShadowingLessonListItemResponse`
- `ShadowingLessonGuestDetailResponse`
- `ShadowingLessonDetailResponse`
- `ShadowingLessonContentDto`
- `ShadowingSentenceDto`
- `ShadowingExpressionDto`

目标：

- 不直接把 entity 原样暴露给前端。
- 游客和登录用户响应结构明确区分。

### 7.2 新增 Controller

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/ShadowingLessonController.java`

建议接口：

- `GET /api/shadowing-lessons`
- `GET /api/shadowing-lessons/{id}`

### 7.3 列表接口实现

接口：

- `GET /api/shadowing-lessons?learned=false&page=0&size=10`
- `GET /api/shadowing-lessons?learned=true&page=0&size=10`

规则：

- 游客请求 `learned=true` 时可返回空列表，保持接口成功。
- 登录用户根据学习记录返回未学习/已学习分页。
- 结果按 `publishedDate` 倒序。

验收：

- 游客可以看列表。
- 登录用户切换 tab 正常。
- 点开详情后下次请求列表学习状态变化正确。

### 7.4 详情接口实现

接口：

- `GET /api/shadowing-lessons/{id}`

规则：

- 游客仅返回媒体、简介和基础信息。
- 登录用户返回完整 `contentJson` 解析结果。
- 登录用户打开详情时自动写入学习记录。

实现建议：

- 在 service 中封装 `getLessonDetailForGuest()` 与 `getLessonDetailForUser()`。
- 学习记录写入使用幂等更新。

验收：

- 游客只能看到试看范围。
- 登录用户可看到完整内容。
- 学习记录被正确写入。

### 7.5 权限配置

任务：

- 在 `SecurityConfig.java` 中增加：
  - 列表与详情接口公开。
  - 点评接口要求登录。

验收：

- 未登录请求点评接口返回 401。
- 未登录请求列表和详情接口可成功。

---

## 8. Phase 4：后端录音点评链路

### 8.1 新增点评请求 DTO

建议新增：

- `ShadowingReviewRequest`

字段：

- `lessonId: Long`
- `sentenceIndex: Integer`
- `referenceText: String`
- `durationMs: Long`

说明：

- 若采用 `multipart/form-data`，DTO 只承载元信息，文件单独接收。

### 8.2 新增点评接口

接口：

- `POST /api/shadowing-lessons/{id}/sentences/{sentenceIndex}/review`

请求：

- `multipart/form-data`
  - `audioFile`
  - `referenceText`
  - `durationMs`

响应：

- `recognizedText`
- `overallScore`
- `pronunciationScore`
- `fluencyScore`
- `accuracyScore`
- `strengths`
- `improvements`
- `suggestedPractice`
- `encouragement`

### 8.3 ASR 处理

任务：

- 复用现有 ASR service。
- 若当前项目还没有标准化 ASR service，需要先抽象：
  - 输入：临时音频文件
  - 输出：识别文本

关键规则：

- 录音文件只用于本次处理。
- 处理结束后及时删除临时文件。

验收：

- 录音成功时能返回 `recognizedText`。
- ASR 失败时返回清晰错误。

### 8.4 AI 综合评分

任务：

- 在 `AiService` 中新增类似 `reviewShadowingSentence(...)` 的方法。
- Prompt 需要输入：
  - 资源标题
  - 原句英文
  - 原句中文
  - 音标
  - ASR 识别文本

输出要求：

- 必须返回固定 JSON。
- 后端需要解析并兜底。

评分建议：

- `accuracyScore` 参考识别结果与原句相似度。
- `fluencyScore` 参考识别完整度与节奏自然度。
- `pronunciationScore` 参考关键词识别情况与 AI 综合判断。

验收：

- AI 返回字段完整。
- JSON 解析失败时页面不会崩。

### 8.5 点评记录持久化

任务：

- 成功点评后写入 `shadowing_review_records`。

验收：

- 数据库存在点评记录。
- 不包含长期录音 URL。

---

## 9. Phase 5：小程序 API 封装与页面注册

### 9.1 `utils/api.js` 新增接口

建议新增：

- `getShadowingLessons({ learned, page, size })`
- `getShadowingLessonDetail(id)`
- `reviewShadowingSentence(id, sentenceIndex, filePath, extra)`

要求：

- 点评接口支持 `multipart/form-data` 上传。
- 继续沿用统一错误处理。

### 9.2 页面注册

若采用新页面路径，需在 `app.json` 注册：

- `pages/shadowingLessons/index`
- `pages/shadowingLessonDetail/index`

若采用复用路径，则需明确：

- `pages/spokenWarmup/index`
- `pages/spokenWarmupDetail/index`

建议：

- 优先新建路径，减少旧语义干扰。

### 9.3 公共工具

任务：

- 评估是否抽一个 `utils/recorder.js` 用于：
  - 请求录音权限
  - 开始录音
  - 停止录音
  - 返回临时文件
- 若现有 `aiDialogChat` 中已有成熟录音逻辑，优先抽公共工具复用。

---

## 10. Phase 6：首页与学习模块入口替换

### 10.1 首页入口

任务：

- 将首页学习入口中的“口语热身”替换为“跟读精听”。
- 图标和卡片风格延续现有 Apple 风格入口。

交互建议：

- 游客和登录用户都可直接进入跟读精听列表。
- 不再像旧“口语热身”那样只切到学习 tab 再承接。

### 10.2 学习模块入口

任务：

- 若学习页存在“口语热身”入口或相关文案，同步替换为“跟读精听”。
- 若学习页仍保留会员提示，需要检查是否与本模块“游客可试看”规则冲突。

规则：

- 跟读精听不走会员专属限制。
- 详情内容的完整权限由登录态控制，而不是会员态。

验收：

- 小程序入口文案一致。
- 游客可进入列表，不会被误导到会员购买流程。

---

## 11. Phase 7：跟读精听列表页

### 11.1 页面结构

目标页面：

- `pages/shadowingLessons/index`

参考原型：

- `doc/prototypes/shadowing-intensive-listening/pages/01-list-unlearned.html`
- `doc/prototypes/shadowing-intensive-listening/pages/02-list-learned-empty.html`

界面要求：

- 标题：`跟读精听`
- 副标题：`看原声视频，练精听、跟读和地道表达`
- 顶部轻量推荐 hero
- `未学习 / 已学习` tab
- 资源卡片列表

### 11.2 列表状态

必须支持：

- loading
- empty
- error
- loaded

游客规则：

- 可展示列表。
- `已学习` tab 可隐藏，或展示为空状态；推荐展示，但为空，保持结构统一。

### 11.3 卡片信息

卡片展示：

- 封面
- 英文/中文标题
- 主题
- 日期
- `句子数 · 表达数`
- 状态

验收：

- 页面视觉接近原型。
- 长标题不溢出。
- 空状态文案与原型一致或近似。

---

## 12. Phase 8：跟读精听详情页

### 12.1 页面结构

目标页面：

- `pages/shadowingLessonDetail/index`

参考原型：

- `doc/prototypes/shadowing-intensive-listening/pages/03-detail-guest.html`
- `doc/prototypes/shadowing-intensive-listening/pages/04-detail-member.html`

### 12.2 游客详情态

展示：

- 顶部媒体卡
- 标题和简介
- 登录引导卡

不展示：

- 精听挑战
- 对照原文
- 逐句跟读
- 地道表达
- 中文翻译练习

### 12.3 登录详情态

布局要求：

- 媒体卡独立。
- 媒体下方为一整块连续学习流。
- 使用步骤导航：
  - 读
  - 跟
  - 学
  - 练
- 使用细分隔线组织内容，而不是堆叠多个重卡片。

### 12.4 内容模块实现

对照原文：

- 默认中英对照。
- 可切只看英文。
- 高亮表达支持点击或视觉关联。

逐句跟读：

- 内嵌在学习流中。
- 每句支持播放、录音、回放、点评。
- 四个操作按钮在同一行展示。

地道表达：

- 默认轻量展示。
- 可展开完整解析。

中文翻译练习：

- 默认显示中文提示。
- 支持文字输入和语音输入。
- 默认展示可编辑英文输入框。
- 输入框下方提供“切换为语音输入”按钮，语音识别成功后回填输入框。
- 查看参考英文、AI 点评两个操作按钮同一行展示。

验收：

- 页面观感接近新版连续学习流原型。
- 不再出现大块割裂模块感。

---

## 13. Phase 9：录音、回放与 AI 点评交互

### 13.1 录音权限

任务：

- 首次录音前检查或申请录音权限。
- 权限拒绝后展示明确引导。

### 13.2 本地录音与回放

任务：

- 每句独立维护录音状态：
  - 未录音
  - 录音中
  - 已录音
  - 提交中
- 回放使用小程序本地临时音频。

### 13.3 点评提交流程

流程：

1. 用户完成录音。
2. 页面允许点击“点评”。
3. 上传临时文件到后端。
4. 等待 ASR + AI 结果。
5. 打开底部点评抽屉。

### 13.4 点评展示

参考原型：

- `doc/prototypes/shadowing-intensive-listening/pages/05-review-result.html`

展示内容：

- 总分
- 发音分
- 流利度
- 准确度
- ASR 识别文本
- 优点
- 建议练习
- 再读一次按钮

验收：

- 点评抽屉可打开和关闭。
- 失败时展示错误，不吞掉当前录音状态。

---

## 14. Phase 10：体验打磨与异常兜底

### 14.1 媒体失败兜底

规则：

- 视频失败时不影响音频和文本展示。
- 音频失败时仍可进行文本学习。

### 14.2 缺失字段兜底

规则：

- 无表达则隐藏表达区。
- 无翻译练习则隐藏翻译练习区。
- 无音标则隐藏音标行。
- 无缩略图则使用默认占位背景。

### 14.3 列表与详情加载态

要求：

- 列表：骨架或 loading。
- 详情：媒体卡、简介和内容区分别可加载。
- 点评：句级 loading，不影响其它句子。

### 14.4 UI 对齐

要求：

- 颜色、圆角、阴影、按钮风格对齐原型。
- 保持 Apple 风格明亮感，不做沉重深色方案。

---

## 15. Phase 11：测试、联调与验收

### 15.1 后端单元测试建议

- Markdown 解析测试。
- `sourceUrl` 幂等去重测试。
- 学习记录首次打开/重复打开测试。
- 游客详情裁剪测试。
- 句子索引越界测试。
- AI 点评 JSON 解析兜底测试。

### 15.2 后端集成测试建议

- 列表 `learned=true/false` 测试。
- 登录用户详情打开后学习记录写入测试。
- 点评接口鉴权测试。
- 点评接口成功链路测试。

### 15.3 小程序人工验收

- 游客列表浏览。
- 游客详情试看。
- 登录用户进入详情并自动记为已学习。
- 列表 tab 状态变化。
- 播放视频和音频。
- 逐句录音、回放和点评。
- 拒绝权限、重新授权、重新录音。
- 网络失败和媒体失败兜底。

### 15.4 验收清单

- [ ] 跟读精听入口替换完成。
- [ ] 列表页可浏览。
- [ ] 游客详情只显示媒体和简介。
- [ ] 登录后资源自动记为已学习。
- [ ] 连续学习流布局实现。
- [ ] 逐句录音与回放可用。
- [ ] 点评结果包含目标字段。
- [ ] 数据库不保存长期录音文件。
- [ ] 示例 Markdown 能导入并展示。

---

## 16. Phase 12：文档同步与上线准备

### 16.1 文档同步

实现完成后更新：

- `doc/miniapp.md`
- `doc/backend.md`
- `doc/api-and-data-model.md`

建议补充：

- 跟读精听页面路径
- 新增接口
- 新增数据表
- 录音与点评链路
- 导入脚本用法

### 16.2 上线准备

检查项：

- 生产环境 ASR 和 AI 模型配置可用。
- 生产环境临时文件目录可写并有清理策略。
- 导入脚本已导入首批资源。
- 缩略图、视频、音频地址在正式域名下可访问。

### 16.3 运维与观察点

建议关注：

- 列表和详情接口响应时间。
- 点评接口平均耗时和失败率。
- ASR 失败率。
- AI 返回 JSON 解析失败率。
- 用户从列表到详情再到点评的完成率。

---

## 17. 实施顺序建议

建议严格按下列顺序推进，避免前端先写死假数据后返工：

1. 先完成数据表和实体。
2. 再完成 Markdown 导入脚本。
3. 导入 1 到 3 条真实资源做联调样本。
4. 完成列表和详情接口。
5. 完成点评接口。
6. 再做小程序页面和交互。
7. 最后统一做体验打磨和文档更新。

---

## 18. 风险与注意事项

- 现有 ASR 能力如果接口不稳定，会直接影响跟读点评体验，需要优先验证。
- 连续学习流页面比传统模块卡片更依赖内容节奏，前端实现时不要为了省事再改回“多个大卡片”。
- 如果录音文件清理不及时，可能造成磁盘累积，需要明确临时文件生命周期。
- Markdown 资料格式若后续不稳定，导入脚本要尽早做失败日志和容错。
- 若现有首页或学习页仍存在会员语义，需要避免把“跟读精听”误导为会员专属。

---

## 19. 交付物清单

- 需求文档：
  - `doc/prd/shadowing-intensive-listening-miniapp-requirements-20260624.md`
- 原型：
  - `doc/prototypes/shadowing-intensive-listening/index.html`
- 开发计划：
  - `doc/prd/shadowing-intensive-listening-miniapp-development-plan-20260625.md`
- 实现代码：
  - 后端实体、Repository、Service、Controller、DTO
  - 小程序页面、API 封装、录音与点评交互
  - 导入脚本

## 20. 导入脚本
node scripts/import-shadowing-lessons/import_shadowing_lessons.js \
--file /path/to/material.md \
--out /tmp/shadowing.sql

导入模版
shadowing_lesson_template.md
