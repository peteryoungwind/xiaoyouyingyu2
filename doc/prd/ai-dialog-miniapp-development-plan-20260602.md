# 小柚英语微信小程序 AI 对话模块开发计划

> 日期：2026-06-02
> 依据文档：`doc/prd/ai-dialog-miniapp-requirements-20260602.md`
> 目标读者：后续负责实现的 AI 编码代理或开发者

---

## 1. 实施原则

- 在改代码前先阅读：
  - `doc/README.md`
  - `doc/repository-overview.md`
  - `doc/backend.md`
  - `doc/frontend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`
  - `doc/prd/ai-dialog-miniapp-requirements-20260602.md`
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- PC 后台沿用 Next.js App Router、React Query、Tailwind CSS、Radix UI、Lucide React。
- 微信小程序沿用原生 WXML/WXSS/JS，通过 `utils/api.js` 和 `utils/request.js` 调用接口。
- 小程序云函数代理沿用现有 `xiaochengxu/cloudfunctions/api/index.js` 转发/处理模式。
- AI 文本模型复用现有 `AiModel` 和 `AiService` 能力。
- TTS 能力优先复用现有 `TtsModel`、`TtsModelService`、`WordAudioService` 的模型配置思路。
- v1 只保存 AI 对话配置和每日用量，不保存对话内容、不保存录音文件。
- 先实现闭环能力：登录用户可以选主题、发送消息、收到 AI 回复、播放语音、查看文字、受额度限制。
- 对语音能力采取渐进实现：优先小程序端能力；不可用时再接后端 ASR/TTS 兜底。

---

## 2. 交付目标

### V1 完成标志

1. 小程序首页和学习中心都有“AI 对话”入口。
2. 未登录用户点击入口会进入登录引导，已登录用户可进入 AI 对话准备页。
3. 用户可以选择教学/练习模式、初级/进阶难度。
4. 用户可以选择已有主题或输入自定义主题。
5. 用户可以通过文字发送一轮或多轮消息。
6. 用户可以通过语音识别生成文本，并编辑后发送。
7. AI 回复默认以语音播放，文本默认显示。
8. 用户点击“隐藏文字”后可以折叠 AI 回复文本，并可再次点击“显示文字”展开。
9. 教学模式每轮返回英文回复、中文点评、优化表达和下一句引导。
10. 练习模式默认只做英文自然对话，不主动中文点评。
11. 后端按用户和自然日限制发送消息轮数。
12. 后端按单次会话限制最大轮数。
13. PC 后台管理员可以配置 AI 对话全局参数和四套提示词。
14. 关键接口有权限测试、额度测试、提示词选择测试。

---

## 3. 任务总览

### Phase 0：现状确认与技术验证

### Phase 1：后端数据模型与配置服务

### Phase 2：后端 AI 对话核心接口

### Phase 3：PC 后台配置页面

### Phase 4：小程序 API 与页面路由

### Phase 5：小程序 AI 对话准备页

### Phase 6：小程序 AI 对话页

### Phase 7：语音输入、语音播放与降级方案

### Phase 8：云函数代理适配

### Phase 9：测试、联调与验收

### Phase 10：上线准备与运维监控

---

## 4. Phase 0：现状确认与技术验证

### 4.1 阅读代码与确认现有能力

任务：

- 阅读后端：
  - `src/main/java/com/xiaoyouyingyu/service/AiService.java`
  - `src/main/java/com/xiaoyouyingyu/entity/AiModel.java`
  - `src/main/java/com/xiaoyouyingyu/repository/AiModelRepository.java`
  - `src/main/java/com/xiaoyouyingyu/entity/TtsModel.java`
  - `src/main/java/com/xiaoyouyingyu/service/TtsModelService.java`
  - `src/main/java/com/xiaoyouyingyu/service/WordAudioService.java`
  - `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
  - `src/main/java/com/xiaoyouyingyu/controller/ApiExceptionHandler.java`
- 阅读 PC 后台：
  - `frontend/src/lib/api.ts`
  - `frontend/src/app/admin/page.tsx`
  - `frontend/src/app/admin/word-books/page.tsx`
  - 现有 AI 模型和 TTS 模型管理 UI。
- 阅读小程序：
  - `xiaochengxu/miniprogram/app.json`
  - `xiaochengxu/miniprogram/pages/home/*`
  - `xiaochengxu/miniprogram/pages/learning/*`
  - `xiaochengxu/miniprogram/pages/learningTopic/*`
  - `xiaochengxu/miniprogram/pages/wordPractice/*`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/request.js`
  - `xiaochengxu/miniprogram/utils/auth.js`
  - `xiaochengxu/miniprogram/utils/audio.js`
- 阅读云函数代理：
  - `xiaochengxu/cloudfunctions/api/index.js`

产出：

- 明确 AI 对话应该接 Java 后端接口，还是通过云函数代理后端接口。
- 明确现有 TTS 模型字段是否足够支持 AI 对话音色配置。
- 明确小程序端是否已有可复用的登录拦截函数。

### 4.2 语音能力技术验证

任务：

- 验证微信小程序环境中可用的录音 API：
  - `wx.getRecorderManager`
  - 录音权限申请与失败处理。
- 验证微信小程序是否可用原生语音识别能力。
- 验证小程序端文本朗读能力是否满足“AI 回复默认语音播放”。
- 如小程序端文本朗读不可用，确认后端 TTS 兜底方案：
  - 复用现有 TTS 模型配置。
  - 后端根据 AI 回复文本生成临时音频 URL。

验收：

- 输出实现结论：
  - 语音输入采用小程序原生识别，或采用后端 `/api/ai-dialog/speech-to-text` 兜底。
  - AI 回复播放采用小程序端朗读，或采用后端 TTS 音频 URL。

---

## 5. Phase 1：后端数据模型与配置服务

### 5.1 新增枚举

建议新增：

- `AiDialogMode`
  - `TEACHING`
  - `PRACTICE`
- `AiDialogDifficulty`
  - `BEGINNER`
  - `ADVANCED`
- `AiDialogTopicSource`
  - `SYSTEM`
  - `CUSTOM`

建议位置：

- `src/main/java/com/xiaoyouyingyu/entity/AiDialogMode.java`
- `src/main/java/com/xiaoyouyingyu/entity/AiDialogDifficulty.java`
- `src/main/java/com/xiaoyouyingyu/entity/AiDialogTopicSource.java`

### 5.2 新增实体：AiDialogConfig

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/AiDialogConfig.java`

建议字段：

- `id: Long`
- `enabled: Boolean`
- `aiModelId: Long`
- `asrModelId: Long`
- `ttsModelId: Long`
- `ttsVoice: String`
- `speechProvider: String`
- `ttsProvider: String`
- `temperature: Double`
- `maxRoundsPerSession: Integer`
- `dailyMessageLimit: Integer`
- `teachingBeginnerPrompt: String`
- `teachingAdvancedPrompt: String`
- `practiceBeginnerPrompt: String`
- `practiceAdvancedPrompt: String`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

字段约束：

- `enabled` 默认 `true`。
- `temperature` 默认 `0.7`，范围 `0` 到 `2`。
- `maxRoundsPerSession` 默认 `12`，必须大于 0。
- `dailyMessageLimit` 默认 `30`，必须大于 0。
- 四套提示词使用 `@Lob` 或足够长的文本字段。
- `aiModelId` 可为空；为空时使用现有默认 AI 模型。
- `ttsModelId` 可为空；为空时使用现有默认 TTS 模型。

### 5.3 新增实体：AiDialogUsage

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/AiDialogUsage.java`

建议字段：

- `id: Long`
- `userId: Long`
- `usageDate: LocalDate`
- `messageCount: Integer`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

关键约束：

- `userId + usageDate` 唯一。
- 只统计每日发送消息轮数，不保存对话内容。
- 日期口径使用 `Asia/Shanghai`。

### 5.4 新增 Repository

建议文件：

- `src/main/java/com/xiaoyouyingyu/repository/AiDialogConfigRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/AiDialogUsageRepository.java`

关键方法：

- `AiDialogConfigRepository`
  - `findTopByOrderByIdAsc()`
- `AiDialogUsageRepository`
  - `findByUserIdAndUsageDate(Long userId, LocalDate usageDate)`
  - `Optional<AiDialogUsage> findByUserIdAndUsageDate(...)`

### 5.5 SQL 建议

如果项目继续使用 `ddl-auto: update`，JPA 实体可自动建表；仍建议在 `src/main/resources/schema.sql` 或文档中记录 SQL：

```sql
CREATE TABLE ai_dialog_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ai_model_id BIGINT NULL,
  asr_model_id BIGINT NULL,
  tts_model_id BIGINT NULL,
  tts_voice VARCHAR(100) NULL,
  speech_provider VARCHAR(50) NULL,
  tts_provider VARCHAR(50) NULL,
  temperature DOUBLE NOT NULL DEFAULT 0.7,
  max_rounds_per_session INT NOT NULL DEFAULT 12,
  daily_message_limit INT NOT NULL DEFAULT 30,
  teaching_beginner_prompt TEXT NOT NULL,
  teaching_advanced_prompt TEXT NOT NULL,
  practice_beginner_prompt TEXT NOT NULL,
  practice_advanced_prompt TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

CREATE TABLE ai_dialog_usage (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  usage_date DATE NOT NULL,
  message_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_ai_dialog_usage_user_date (user_id, usage_date)
);
```

### 5.6 新增配置服务

建议文件：

- `src/main/java/com/xiaoyouyingyu/service/AiDialogConfigService.java`

职责：

- 读取唯一全局配置。
- 如果数据库没有配置，返回内置默认配置。
- 保存管理员更新的配置。
- 校验温度、轮数、每日额度和提示词非空。
- 根据模式和难度选择对应系统提示词。

验收：

- 无数据库配置时，用户端接口仍能使用默认配置。
- 管理员保存非法温度或轮数时返回 400。
- 四套提示词可分别读取和保存。

---

## 6. Phase 2：后端 AI 对话核心接口

### 6.1 新增 DTO

建议目录：

- `src/main/java/com/xiaoyouyingyu/dto/aidialog/`

建议 DTO：

- `AiDialogConfigSummaryResponse`
  - `enabled`
  - `maxRoundsPerSession`
  - `dailyMessageLimit`
  - `remainingToday`
- `AiDialogMessageRequest`
  - `sessionId`
  - `topicSource`
  - `topicId`
  - `customTopic`
  - `mode`
  - `difficulty`
  - `roundCount`
  - `message`
  - `history`
- `AiDialogHistoryMessage`
  - `role`
  - `content`
- `AiDialogMessageResponse`
  - `remainingToday`
  - `reply`
  - `audioUrl`
- `AiDialogReply`
  - `replyEn`
  - `feedbackZh`
  - `betterExpressionEn`
  - `betterExpressionZh`
  - `nextPromptEn`
- `AdminAiDialogConfigRequest`
- `AdminAiDialogConfigResponse`

### 6.2 新增服务：AiDialogUsageService

建议文件：

- `src/main/java/com/xiaoyouyingyu/service/AiDialogUsageService.java`

职责：

- 获取当天使用量。
- 计算剩余额度。
- 在用户发送消息前校验每日额度。
- 在 AI 对话请求成功后增加 `messageCount`。
- AI 调用失败时不扣除额度，或如果已扣除则回滚/补偿。

推荐扣除策略：

- 先检查额度，不立即扣除。
- AI 调用成功后，在同一业务流程中增加 `messageCount`。
- 若 AI 调用失败，不增加 `messageCount`。

验收：

- 每发送成功一次用户消息，剩余额度减少 1。
- AI 调用失败不扣次数。
- 并发请求不能突破每日限制。

### 6.3 新增服务：AiDialogService

建议文件：

- `src/main/java/com/xiaoyouyingyu/service/AiDialogService.java`

职责：

- 校验请求参数。
- 读取 AI 对话配置。
- 根据 `topicSource` 读取系统主题或使用自定义主题。
- 根据 `mode + difficulty` 选择系统提示词。
- 拼装对话上下文。
- 调用 AI 文本模型。
- 解析 AI 返回 JSON。
- 返回结构化 `AiDialogReply`。

提示词输出要求：

- 教学模式必须返回 JSON：

```json
{
  "replyEn": "英文对话回复",
  "feedbackZh": "中文点评纠错",
  "betterExpressionEn": "更自然的英文表达",
  "betterExpressionZh": "中文解释",
  "nextPromptEn": "下一句英文引导"
}
```

- 练习模式必须返回 JSON：

```json
{
  "replyEn": "英文对话回复",
  "nextPromptEn": "自然追问"
}
```

异常处理：

- 配置关闭：返回 503 或业务错误。
- 未选择主题：返回 400。
- 系统主题不存在：返回 404。
- 模式/难度非法：返回 400。
- AI 返回非 JSON：尝试提取 JSON；失败返回 503。

### 6.4 扩展 AiService

可选实现路径：

- 路径 A：在 `AiService` 中新增 `generateAiDialogReply(...)`。
- 路径 B：新建 `AiDialogService`，内部复用 `AiService` 的模型解析和 HTTP 调用能力。

推荐：

- 如果 `AiService` 已经封装了模型选择、HTTP 调用和 JSON 解析，优先复用。
- 将 AI 对话提示词选择、主题拼装和响应校验放在 `AiDialogService` 中，避免 `AiService` 继续变胖。

### 6.5 新增用户端 Controller

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/AiDialogController.java`

接口：

- `GET /api/ai-dialog/config`
  - 权限：已登录用户。
  - 返回：启用状态、单次最大轮数、每日限制、当天剩余额度。
- `POST /api/ai-dialog/message`
  - 权限：已登录用户。
  - 功能：发送一轮用户消息并获取 AI 回复。
- `POST /api/ai-dialog/speech-to-text`
  - 权限：已登录用户。
  - 功能：语音识别兜底接口。
  - v1 可先预留接口，若小程序原生识别可用，则暂不完整实现。

### 6.6 新增管理端 Controller

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/AdminAiDialogController.java`

接口：

- `GET /api/admin/ai-dialog/config`
- `PUT /api/admin/ai-dialog/config`
- `POST /api/admin/ai-dialog/config/reset-prompts`
- 可选：`POST /api/admin/ai-dialog/test`

权限：

- 全部要求 `ROLE_ADMIN`。

### 6.7 SecurityConfig

任务：

- 确认 `/api/ai-dialog/**` 归入“已认证用户”即可，不开放给游客。
- 确认 `/api/admin/ai-dialog/**` 归入 `ROLE_ADMIN`。
- 如果 SecurityConfig 使用通配符已经覆盖，则只需补充测试，不一定改配置。

验收：

- 未登录访问 `/api/ai-dialog/config` 返回 401。
- 普通用户访问 `/api/ai-dialog/config` 成功。
- 普通用户访问 `/api/admin/ai-dialog/config` 返回 403。
- 管理员访问 `/api/admin/ai-dialog/config` 成功。

---

## 7. Phase 3：PC 后台配置页面

### 7.1 API 封装

修改文件：

- `frontend/src/lib/api.ts`

新增方法：

- `getAiDialogConfig()`
- `updateAiDialogConfig(data)`
- `resetAiDialogPrompts()`
- 可选：`testAiDialogConfig(data)`

### 7.2 后台导航入口

候选方案：

- 方案 A：在现有“AI 模型”管理区域增加“AI 对话配置”区块。
- 方案 B：新增独立后台页面 `/admin/ai-dialog`。

推荐：

- 如果现有后台已有模型管理 tab，先采用方案 A。
- 如果页面已经过于复杂，则采用方案 B，并在侧边栏增加“AI 对话配置”。

### 7.3 配置页面结构

页面模块：

- 基础状态：
  - 启用/停用开关。
- 模型配置：
  - 文本 AI 模型选择。
  - 语音识别模型选择。
  - TTS 模型选择。
  - TTS 音色输入或下拉。
- 生成参数：
  - 温度。
  - 单次最大轮数。
  - 每日发送轮数限制。
- 提示词配置：
  - 教学模式 + 初级。
  - 教学模式 + 进阶。
  - 练习模式 + 初级。
  - 练习模式 + 进阶。
- 操作：
  - 保存。
  - 恢复默认提示词。
  - 可选测试配置。

UI 要求：

- 使用现有后台表单、卡片、按钮样式。
- 长提示词使用 textarea 或代码编辑风格文本域。
- 保存中禁用按钮。
- 保存成功展示 toast。
- 参数错误时展示字段级错误或统一错误提示。

验收：

- 管理员可以加载当前配置。
- 管理员可以保存基础参数。
- 管理员可以分别编辑四套提示词。
- 非管理员无法访问接口。

---

## 8. Phase 4：小程序 API 与页面路由

### 8.1 新增小程序 API 封装

修改文件：

- `xiaochengxu/miniprogram/utils/api.js`

新增方法：

- `getAiDialogConfig()`
- `sendAiDialogMessage(data)`
- `speechToText(filePath)` 或 `speechToText(audioFile)`

注意：

- 所有 AI 对话接口必须携带 token。
- 对 `401` 统一触发登录引导。
- 对 `429` 返回每日额度用尽提示。
- 对 `503` 返回“AI 对话暂不可用，请稍后再试”。

### 8.2 新增页面路由

修改文件：

- `xiaochengxu/miniprogram/app.json`

新增页面建议：

- `pages/aiDialogSetup/index`
- `pages/aiDialogChat/index`

页面文件：

- `xiaochengxu/miniprogram/pages/aiDialogSetup/index.js`
- `xiaochengxu/miniprogram/pages/aiDialogSetup/index.wxml`
- `xiaochengxu/miniprogram/pages/aiDialogSetup/index.wxss`
- `xiaochengxu/miniprogram/pages/aiDialogSetup/index.json`
- `xiaochengxu/miniprogram/pages/aiDialogChat/index.js`
- `xiaochengxu/miniprogram/pages/aiDialogChat/index.wxml`
- `xiaochengxu/miniprogram/pages/aiDialogChat/index.wxss`
- `xiaochengxu/miniprogram/pages/aiDialogChat/index.json`

### 8.3 登录拦截

任务：

- 复用现有 `utils/auth.js` 或页面内登录判断。
- 未登录点击 AI 对话入口时跳转：
  - `/pages/login/index`
  - 或使用现有登录弹窗模式。

验收：

- 未登录不能进入 `aiDialogSetup`。
- 未登录不能直接打开 `aiDialogChat`。
- 登录后可正常进入。

---

## 9. Phase 5：小程序 AI 对话准备页

### 9.1 页面数据结构

建议 data：

```js
{
  loading: false,
  configLoading: false,
  topicsLoading: false,
  config: null,
  mode: 'TEACHING',
  difficulty: 'BEGINNER',
  topicSource: 'SYSTEM',
  topicId: null,
  selectedTopic: null,
  customTopic: '',
  keyword: '',
  topics: [],
  page: 0,
  hasMore: true,
  error: ''
}
```

### 9.2 页面功能

任务：

- 页面加载时：
  - 校验登录状态。
  - 请求 `getAiDialogConfig()`。
  - 加载系统主题列表。
- 模式选择：
  - 教学模式。
  - 练习模式。
- 难度选择：
  - 初级。
  - 进阶。
- 主题来源：
  - 已有主题。
  - 自定义主题。
- 已有主题：
  - 展示主题列表。
  - 支持搜索。
  - 支持下拉加载更多。
  - 选择后高亮当前主题。
- 自定义主题：
  - 输入框。
  - 限制 100 字符。
  - 空值不能开始。
- 开始对话：
  - 生成本地 `sessionId`。
  - 跳转到 `aiDialogChat`，通过 query 或本地 storage 传递初始化数据。

推荐传参：

- 简单字段通过 query。
- `selectedTopic` 对象或较长自定义内容可临时写入 `wx.setStorageSync('aiDialogDraft', data)`，进入对话页后读取并删除。

### 9.3 UI 要求

- 使用浅色背景、圆角卡片、Apple 风格分段选择控件。
- 模式和难度使用横向 segmented control。
- 主题来源使用 segmented control 或轻量 tab。
- “开始对话”按钮固定在底部安全区域上方。
- 系统主题卡片展示英文标题、中文标题、标签。

验收：

- 默认选中教学模式、初级、已有主题。
- 未选择主题时“开始对话”不可点击。
- 自定义主题为空时不可开始。
- 选择已有主题后可以进入对话页。
- 输入自定义主题后可以进入对话页。

---

## 10. Phase 6：小程序 AI 对话页

### 10.1 页面数据结构

建议 data：

```js
{
  sessionId: '',
  mode: 'TEACHING',
  difficulty: 'BEGINNER',
  topicSource: 'SYSTEM',
  topicId: null,
  topicTitleEn: '',
  topicTitleZh: '',
  customTopic: '',
  maxRoundsPerSession: 12,
  remainingToday: 0,
  roundCount: 0,
  messages: [],
  inputMode: 'VOICE',
  textInput: '',
  recognizing: false,
  aiLoading: false,
  playingMessageId: null,
  error: ''
}
```

消息结构建议：

```js
{
  id: 'local-id',
  role: 'user' | 'assistant',
  text: '',
  visibleText: false,
  reply: null,
  audioUrl: '',
  status: 'sending' | 'done' | 'failed'
}
```

### 10.2 页面功能

任务：

- 页面进入时读取初始化参数。
- 顶部展示：
  - 主题。
  - 模式。
  - 难度。
  - 今日剩余额度。
  - 本次轮数。
- 消息列表：
  - 展示用户消息。
  - 展示 AI 消息占位、加载态、播放态。
  - AI 文本默认显示。
  - 每条 AI 消息提供“显示文字/隐藏文字”按钮。
- 文字输入：
  - 输入为空不能发送。
  - 发送中禁用输入。
- 发送逻辑：
  - 校验每日剩余额度。
  - 校验单次最大轮数。
  - 将用户消息加入本地 messages。
  - 调用 `sendAiDialogMessage`。
  - 成功后追加 AI 消息。
  - 更新 `remainingToday` 和 `roundCount`。
  - 自动播放 AI 回复。
  - 失败时标记用户消息可重试。
- 重新开始：
  - 清空本地 messages。
  - 清空 roundCount。
  - 返回准备页或留在当前页重新开始同主题。

### 10.3 教学模式展示

教学模式 AI 消息展示结构：

- 语音播放区：
  - 播放/重播按钮。
  - “隐藏文字/显示文字”按钮。
- 文字默认展开，包含：
  - 英文回复 `replyEn`。
  - 中文点评 `feedbackZh`。
  - 更好表达 `betterExpressionEn`。
  - 中文解释 `betterExpressionZh`。
  - 下一句引导 `nextPromptEn`。

### 10.4 练习模式展示

练习模式 AI 消息展示结构：

- 语音播放区。
- “隐藏文字/显示文字”按钮。
- 文字默认展开，包含：
  - 英文回复 `replyEn`。
  - 可选自然追问 `nextPromptEn`。

验收：

- 教学模式每轮展示完整教学结构。
- 练习模式不展示中文点评卡片。
- AI 文本默认显示。
- 点击隐藏文字后只折叠当前消息。
- 达到单次最大轮数后不能继续发送。
- 达到每日额度后不能继续发送。

---

## 11. Phase 7：语音输入、语音播放与降级方案

### 11.1 语音输入

任务：

- 在 `aiDialogChat` 中加入语音输入按钮。
- 使用录音权限检查：
  - 已授权：允许录音。
  - 未授权：展示授权提示。
  - 拒绝授权：引导用户去设置或切换文字输入。
- 实现录音状态：
  - 未录音。
  - 录音中。
  - 识别中。
  - 识别失败。
  - 识别成功待发送。
- 识别结果进入文本输入框，用户可以编辑。

实现优先级：

1. 优先使用微信小程序可用的原生语音识别能力。
2. 如不可用，调用 `POST /api/ai-dialog/speech-to-text`。
3. 如果 v1 暂无法实现识别，保留语音按钮但明确提示“当前环境暂不支持语音识别，请使用文字输入”，不能阻塞文字闭环上线。

### 11.2 AI 回复语音播放

任务：

- AI 返回后默认播放语音。
- 优先使用小程序端文本朗读能力。
- 如果小程序端朗读不可用：
  - 后端返回 `audioUrl`。
  - 小程序复用 `utils/audio.js` 播放音频。
- 每条 AI 消息提供重播按钮。
- 播放失败时展示提示，AI 文本默认可见，用户仍可通过文字继续学习。

### 11.3 后端 TTS 兜底

如需要后端 TTS，新增能力：

- `AiDialogTtsService`
  - 根据 AI 回复文本生成临时音频。
  - 使用 `AiDialogConfig.ttsModelId` 和 `ttsVoice`。
  - 保存到临时目录或 `uploads/ai-dialog-audio/{userId}/{date}/{uuid}.mp3`。
  - 返回可访问 URL。
- 清理策略：
  - v1 可不保存对话内容，但临时音频应可定期删除。
  - 建议后续增加清理脚本或定时任务。

验收：

- 用户可以语音输入或至少看到可用降级提示。
- AI 回复可以被播放或至少有后端 TTS 兜底。
- 播放失败不影响查看文字。

---

## 12. Phase 8：云函数代理适配

### 12.1 新增路由映射

修改文件：

- `xiaochengxu/cloudfunctions/api/index.js`

新增处理：

- `ai-dialog/config`
- `ai-dialog/message`
- `ai-dialog/speech-to-text`

如果云函数当前是直接访问 MySQL 并本地处理业务：

- 推荐本功能优先代理 Java 后端接口，避免在云函数中重复实现 AI 业务逻辑。
- 如果现有模式必须云函数直连数据库，则仍应保持业务规则与 Java 后端一致，但不推荐双写两套 AI 对话逻辑。

### 12.2 Token 透传

任务：

- 确认小程序请求云函数时 token 会传入。
- 云函数调用 Java 后端时透传 `Authorization: Bearer <token>`。

### 12.3 错误码透传

任务：

- `401`、`403`、`429`、`503` 不要吞掉。
- 小程序端根据错误码展示对应提示。

验收：

- 小程序通过云函数能调用 AI 对话配置接口。
- 小程序通过云函数能发送 AI 对话消息。
- 每日额度错误能正确返回小程序。

---

## 13. Phase 9：测试、联调与验收

### 13.1 后端单元测试

建议新增：

- `AiDialogConfigServiceTest`
  - 默认配置回退。
  - 四套提示词选择。
  - 参数校验。
- `AiDialogUsageServiceTest`
  - 初次使用量为 0。
  - 成功发送后计数 +1。
  - 达到每日限制后拒绝。
  - 不同用户互不影响。
  - 不同日期互不影响。
- `AiDialogServiceTest`
  - 教学模式解析完整 JSON。
  - 练习模式解析完整 JSON。
  - 非法主题来源返回错误。
  - 系统主题不存在返回错误。

### 13.2 后端集成测试

建议新增：

- `AiDialogControllerSecurityTest`
  - 未登录访问用户接口返回 401。
  - 登录用户访问用户接口成功。
  - 普通用户访问管理接口返回 403。
  - 管理员访问管理接口成功。
- `AiDialogUsageLimitIntegrationTest`
  - 每日额度耗尽返回 429。
  - AI 调用失败不扣次数。

### 13.3 PC 后台测试

任务：

- 管理员加载配置。
- 修改温度并保存。
- 修改单次最大轮数并保存。
- 修改每日轮数并保存。
- 修改四套提示词并保存。
- 非管理员访问时无权限。
- 保存失败时错误提示明确。

### 13.4 小程序功能测试

任务：

- 首页入口跳转。
- 学习中心入口跳转。
- 未登录拦截。
- 登录后进入准备页。
- 选择已有主题开始。
- 输入自定义主题开始。
- 教学模式发送文字消息。
- 练习模式发送文字消息。
- AI 回复默认显示文本。
- 点击隐藏文字。
- 单次最大轮数限制。
- 每日额度限制。
- AI 请求失败重试。
- 录音权限拒绝。
- 语音识别失败。
- 播放失败。

### 13.5 UI 检查

任务：

- 页面符合浅色、简约、Apple 风格。
- 卡片、按钮、输入框与现有小程序风格一致。
- 底部输入区不被安全区域遮挡。
- 长英文不会溢出消息气泡。
- 加载、错误、空状态都有清晰提示。

### 13.6 回归测试

任务：

- 登录/注册。
- 首页主题展示。
- 学习中心现有功能。
- 单词练习音频播放。
- PC 后台 AI 模型管理。
- PC 后台 TTS 模型管理。

---

## 14. Phase 10：上线准备与运维监控

### 14.1 配置准备

任务：

- 在正式库创建默认 `ai_dialog_config`。
- 配置默认 AI 文本模型。
- 配置默认 TTS 模型和音色。
- 配置默认每日发送轮数，例如 30。
- 配置默认单次最大轮数，例如 12。
- 检查 AI API Key 不暴露在前端或小程序。

### 14.2 小程序发布准备

任务：

- 确认小程序合法请求域名包含后端或云函数域名。
- 确认录音权限相关文案符合微信小程序审核要求。
- 确认新增页面已注册在 `app.json`。
- 确认入口文案不过度承诺 AI 能力。

### 14.3 日志与监控

建议记录：

- AI 对话消息接口调用失败。
- AI 返回 JSON 解析失败。
- 每日额度超限。
- 语音识别失败。
- TTS 生成或播放失败。

建议指标：

- 每日 AI 对话用户数。
- 每日发送消息轮数。
- 教学/练习模式占比。
- 初级/进阶占比。
- 系统主题/自定义主题占比。
- 平均每次会话轮数。
- AI 调用失败率。

### 14.4 灰度策略

推荐：

- 后台配置增加 `enabled` 开关。
- 上线初期先启用较低每日轮数，例如 10 到 20。
- 观察 AI 成本、失败率和用户反馈后再提高额度。
- 如果 AI 服务异常，可通过后台关闭模块或降低额度。

---

## 15. 建议开发顺序

1. 后端实体、Repository、配置服务。
2. 后端用户端配置摘要接口。
3. 后端管理端配置读取/保存接口。
4. PC 后台配置页面。
5. 后端 AI 对话消息接口。
6. 每日额度与单次轮数限制。
7. 小程序 API 封装和路由注册。
8. 小程序首页、学习中心入口。
9. 小程序 AI 对话准备页。
10. 小程序 AI 对话页文字输入闭环。
11. AI 回复显示文字与教学/练习展示差异。
12. AI 回复语音播放。
13. 语音输入识别。
14. 云函数代理适配。
15. 测试、联调、回归。
16. 上线配置和灰度。

---

## 16. 风险与处理方案

### 风险 1：微信小程序原生语音识别不可用

处理：

- 保留文字输入闭环。
- 使用后端 ASR/AI 识别接口兜底。
- 在 UI 上提供“当前环境暂不支持语音识别，请使用文字输入”的降级提示。

### 风险 2：小程序端文本朗读能力不足

处理：

- 后端使用 TTS 模型生成音频 URL。
- 小程序复用 `utils/audio.js` 播放。
- AI 文本仍可通过“显示文字”查看。

### 风险 3：AI 返回格式不稳定

处理：

- 强化系统提示词，要求严格 JSON。
- 后端解析时先尝试直接解析，再尝试提取 JSON。
- 解析失败返回明确错误，不把原始 AI 文本直接透给小程序。
- 测试覆盖教学/练习两种格式。

### 风险 4：每日额度并发超限

处理：

- 后端使用事务或数据库行级锁更新 `ai_dialog_usage`。
- `user_id + usage_date` 设置唯一约束。
- 并发请求必须以后端最终校验为准。

### 风险 5：提示词配置被误删或保存为空

处理：

- 保存时校验四套提示词非空。
- 提供恢复默认提示词功能。
- 数据库无配置或提示词为空时回退内置默认提示词。

### 风险 6：AI 成本超预期

处理：

- 每日发送轮数默认设置较低。
- 单次最大轮数限制。
- 上线初期通过后台开关灰度。
- 记录每日总轮数和失败率。

---

## 17. 最终验收 Checklist

### 后端

- [ ] `AiDialogConfig` 实体和配置服务完成。
- [ ] `AiDialogUsage` 实体和每日用量服务完成。
- [ ] `GET /api/ai-dialog/config` 完成。
- [ ] `POST /api/ai-dialog/message` 完成。
- [ ] `POST /api/ai-dialog/speech-to-text` 完成或以明确降级策略预留。
- [ ] `GET /api/admin/ai-dialog/config` 完成。
- [ ] `PUT /api/admin/ai-dialog/config` 完成。
- [ ] 四套提示词选择逻辑完成。
- [ ] 每日发送轮数限制完成。
- [ ] 单次最大轮数限制完成。
- [ ] 权限测试通过。

### PC 后台

- [ ] 管理员可以查看 AI 对话配置。
- [ ] 管理员可以编辑启用状态。
- [ ] 管理员可以选择 AI 文本模型。
- [ ] 管理员可以选择或配置语音/TTS 模型。
- [ ] 管理员可以设置温度。
- [ ] 管理员可以设置单次最大轮数。
- [ ] 管理员可以设置每日发送轮数限制。
- [ ] 管理员可以编辑四套提示词。
- [ ] 管理员可以恢复默认提示词。

### 小程序

- [ ] 首页新增 AI 对话入口。
- [ ] 学习中心新增 AI 对话入口。
- [ ] 未登录点击入口会引导登录。
- [ ] AI 对话准备页完成。
- [ ] 可以选择教学/练习模式。
- [ ] 可以选择初级/进阶难度。
- [ ] 可以选择系统主题。
- [ ] 可以输入自定义主题。
- [ ] AI 对话页完成。
- [ ] 可以文字输入并发送。
- [ ] 可以语音输入或展示可用降级提示。
- [ ] AI 回复默认播放语音。
- [ ] AI 文本默认展示，并可点击“隐藏文字”折叠。
- [ ] 教学模式展示中文点评和优化表达。
- [ ] 练习模式不主动展示中文点评。
- [ ] 每日额度用尽后不能发送。
- [ ] 单次轮数用尽后不能发送。

### 联调与上线

- [ ] 云函数代理已适配新增接口。
- [ ] 小程序合法域名配置完成。
- [ ] 默认后台配置已写入正式环境。
- [ ] AI Key 未暴露到前端或小程序。
- [ ] 关键错误日志可查看。
- [ ] 完成小程序端主流程手工验收。
- [ ] 完成 PC 后台配置验收。
- [ ] 完成后端自动化测试。
