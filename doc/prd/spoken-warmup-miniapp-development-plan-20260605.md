# 小柚英语微信小程序口语热身模块开发计划

> 日期：2026-06-05
> 依据文档：`doc/prd/spoken-warmup-miniapp-requirements-20260605.md`
> 目标读者：后续负责实现的 AI 编码代理或开发者

---

## 1. 实施原则

- 在改代码前先阅读：
  - `doc/README.md`
  - `doc/repository-overview.md`
  - `doc/backend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`
  - `doc/prd/spoken-warmup-miniapp-requirements-20260605.md`
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- 小程序沿用原生 WXML/WXSS/JS，通过 `xiaochengxu/miniprogram/utils/api.js` 和 `utils/request.js` 直连 Spring Boot REST API。
- AI 文本生成复用现有 `AiService`、`LearningController`、`AiModelRepository` 和后台默认 AI 模型。
- 小程序端优先复用现有 `pages/learningTopic` 的模块化生成逻辑，但新功能入口和页面命名应围绕“口语热身”，不要继续暴露“会员学习中心”语义。
- 小程序语音输入必须实现真实语音转文字：可以复用 AI 对话模块已有录音交互，但必须把用户本次录音转写为文本；不能只录音后提示用户手动编辑。
- V1 不新增口语热身数据表，不保存 AI 生成内容，不保存用户回答，不保存录音文件。
- 先实现闭环：登录用户可选主题、选难度、按模块生成、重新生成去重、语音或文字提交回答、查看 AI 点评。
- 每个模块独立 loading、error、retry，不允许某个 AI 请求失败导致整页不可用。
- 实现完成后同步更新 `doc/miniapp.md`、`doc/api-and-data-model.md`、`doc/backend.md`。

---

## 2. 交付目标

### V1 完成标志

1. 小程序首页“听力练习”入口已替换为“口语热身”。
2. 未登录用户点击“口语热身”进入登录引导。
3. 登录用户点击“口语热身”进入主题列表页。
4. 主题列表复用现有主题接口，并支持关键词搜索、标签筛选、日期筛选、分页加载。
5. 用户点击主题后进入口语热身详情页。
6. 详情页默认初级，并支持切换进阶。
7. 切换初级/进阶时，已生成内容按难度隔离或清空，不混用。
8. 热身介绍模块点击后实时生成 1 段介绍和 3 个热身问题。
9. 核心词汇模块点击后实时生成 10 个词汇项。
10. 句型模板模块点击后实时生成 6 个句型模板。
11. 地道表达模块点击后实时生成 6 个表达。
12. 模拟问答模块点击后实时生成 3 个任务。
13. 每个模块都有重新生成按钮，重新生成请求携带本次页面会话已生成内容作为 `exclude`。
14. 模拟练习回答区默认是语音输入。
15. 用户可以切换为文字输入。
16. 语音输入完成后，系统能基于用户本次真实录音返回可编辑的识别文本。
17. 用户提交英文回答后，AI 返回评分、优点、改进建议、纠错、优化回答和鼓励。
18. 页面退出后不保留生成内容，数据库无新增口语热身记录。
19. 后端默认模型缺失、AI 超时、AI 返回格式异常时有明确错误。
20. 小程序和后端关键路径有可执行的测试或人工验收记录。

---

## 3. 任务总览

### Phase 0：现状确认与边界锁定

### Phase 1：后端学习中心 AI 能力补齐

### Phase 2：后端真实语音转文字实现与验证

### Phase 3：小程序 API 封装与页面注册

### Phase 4：小程序首页入口替换

### Phase 5：小程序口语热身主题列表页

### Phase 6：小程序口语热身详情页

### Phase 7：小程序模拟练习语音/文字输入与 AI 点评

### Phase 8：错误处理、状态管理与体验打磨

### Phase 9：测试、联调与验收

### Phase 10：文档同步与上线准备

---

## 4. Phase 0：现状确认与边界锁定

### 4.1 阅读后端现有学习中心能力

任务：

- 阅读：
  - `src/main/java/com/xiaoyouyingyu/controller/LearningController.java`
  - `src/main/java/com/xiaoyouyingyu/service/AiService.java`
  - `src/main/java/com/xiaoyouyingyu/entity/AiModel.java`
  - `src/main/java/com/xiaoyouyingyu/repository/AiModelRepository.java`
  - `src/main/java/com/xiaoyouyingyu/controller/TopicController.java`
  - `src/main/java/com/xiaoyouyingyu/repository/TopicRepository.java`
  - `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
- 确认现有接口：
  - `POST /api/learning/warmup`
  - `POST /api/learning/vocabulary`
  - `POST /api/learning/expressions`
  - `POST /api/learning/tasks`
  - `POST /api/learning/review`
- 确认 `AiService.callAi(...)` 的默认模型解析逻辑：
  - `modelId == null` 时是否优先读取 `ai_models.is_default = true`。
  - 默认模型不存在时是否有清晰失败路径。

产出：

- 明确需要修改哪些 Prompt 和返回数量。
- 明确句型模板和地道表达是拆新接口，还是给 `expressions` 增加 `type` 参数。
- 明确 `reviewAnswer` 是否需要接收任务描述、输入方式等增强字段。

验收：

- 输出后端缺口清单。
- 确认 V1 不新增数据库表。

### 4.2 阅读小程序现有页面和工具

任务：

- 阅读：
  - `xiaochengxu/miniprogram/app.json`
  - `xiaochengxu/miniprogram/app.js`
  - `xiaochengxu/miniprogram/utils/request.js`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/auth.js`
  - `xiaochengxu/miniprogram/pages/home/index.js`
  - `xiaochengxu/miniprogram/pages/home/index.wxml`
  - `xiaochengxu/miniprogram/pages/home/index.wxss`
  - `xiaochengxu/miniprogram/pages/topics/index.*`
  - `xiaochengxu/miniprogram/pages/learningTopic/index.*`
  - `xiaochengxu/miniprogram/pages/aiDialogChat/index.*`
  - `xiaochengxu/miniprogram/components/loading/*`
  - `xiaochengxu/miniprogram/components/empty-state/*`
- 确认首页“听力练习”入口当前实现位置和点击行为。
- 确认小程序主题列表页是否已有搜索、标签筛选和日期筛选可复用。
- 确认 `learningTopic` 页面是否可直接改造，或需要新建口语热身详情页。
- 确认 `aiDialogChat` 当前录音逻辑是否有真实转写能力。

产出：

- 明确新增页面路径：
  - 推荐 `pages/spokenWarmup/index`
  - 推荐 `pages/spokenWarmupDetail/index`
- 明确可复用组件和样式。
- 明确录音转写技术方案。

验收：

- 输出小程序新增/修改文件清单。
- 确认不影响现有学习中心、AI 对话、每日外刊和单词练习入口。

---

## 5. Phase 1：后端学习中心 AI 能力补齐

### 5.1 统一请求 DTO

建议新增或补齐 DTO，避免继续使用松散 `Map<String, String>` 扩展复杂字段。

建议文件：

- `src/main/java/com/xiaoyouyingyu/dto/LearningGenerateRequest.java`
- `src/main/java/com/xiaoyouyingyu/dto/LearningReviewRequest.java`

`LearningGenerateRequest` 字段：

- `titleEn: String`
- `titleZh: String`
- `mode: String`
- `exclude: String`
- `type: String`

`LearningReviewRequest` 字段：

- `titleEn: String`
- `titleZh: String`
- `mode: String`
- `taskTitle: String`
- `taskDescription: String`
- `answer: String`
- `inputMode: String`

字段规则：

- `mode` 支持 `beginner`、`advanced`。
- `type` 用于表达接口区分 `sentencePatterns` 和 `idiomaticExpressions`，可为空。
- `inputMode` 支持 `voice`、`text`，后端仅用于 Prompt 上下文和日志，不做持久化。

验收：

- Controller 能接收新 DTO。
- 旧小程序或 Web 前端传入的旧字段仍兼容。

### 5.2 调整热身介绍生成

任务：

- 修改 `AiService.generateWarmup(...)` Prompt。
- 确保返回结构固定：

```json
{
  "introduction": "One paragraph...",
  "warmupQuestions": [
    { "en": "Question 1?", "zh": "问题 1？" },
    { "en": "Question 2?", "zh": "问题 2？" },
    { "en": "Question 3?", "zh": "问题 3？" }
  ]
}
```

规则：

- 生成恰好 1 段介绍和 3 个问题。
- 初级中文辅助更多。
- 进阶更偏英文语境。
- `exclude` 不为空时，Prompt 明确避免重复问题角度。

验收：

- 返回数量符合需求。
- `exclude` 出现在 Prompt 去重规则中。

### 5.3 调整核心词汇生成

任务：

- 修改 `AiService.generateVocabulary(...)` Prompt。
- 从当前 12-15 个调整为恰好 10 个。
- 确保返回结构：

```json
{
  "vocabulary": [
    {
      "word": "word or phrase",
      "zh": "中文释义",
      "example": "Example sentence.",
      "exampleZh": "例句中文解释",
      "category": "分类",
      "difficulty": "basic/intermediate/advanced"
    }
  ]
}
```

验收：

- 每次生成 10 个词汇项。
- 初级和进阶难度差异明确。
- 重新生成时避免重复 `exclude` 中词汇。

### 5.4 补齐句型模板生成

推荐方案：

- 新增接口：

```http
POST /api/learning/sentence-patterns
```

- 新增 `AiService.generateSentencePatterns(...)`。

返回结构：

```json
{
  "sentencePatterns": [
    {
      "pattern": "I tend to ... when ...",
      "zh": "我倾向于在……时……",
      "useCase": "表达个人习惯",
      "example": "I tend to plan my trips carefully when I travel abroad.",
      "exampleZh": "我出国旅行时通常会认真规划。"
    }
  ]
}
```

规则：

- 每次恰好生成 6 个。
- 初级模板短、清晰、可替换。
- 进阶模板包含原因、转折、让步、比较、假设等逻辑关系。
- `exclude` 不为空时避免重复模板结构。

验收：

- 接口要求登录。
- 返回 6 个模板。
- JSON 字段与小程序解析一致。

### 5.5 补齐地道表达生成

推荐方案：

- 新增接口：

```http
POST /api/learning/idiomatic-expressions
```

- 新增 `AiService.generateIdiomaticExpressions(...)`。

返回结构：

```json
{
  "idiomaticExpressions": [
    {
      "expression": "It depends on the situation.",
      "zh": "这取决于具体情况。",
      "usage": "用于表达不绝对的观点。",
      "example": "It depends on the situation, but I usually prefer traveling with friends.",
      "exampleZh": "这取决于具体情况，但我通常更喜欢和朋友一起旅行。"
    }
  ]
}
```

规则：

- 每次恰好生成 6 个。
- 表达必须适合口语场景。
- 避免过度书面化或生僻表达。
- `exclude` 不为空时避免重复表达。

验收：

- 接口要求登录。
- 返回 6 个表达。
- 重新生成时 Prompt 包含去重规则。

### 5.6 调整模拟任务生成

任务：

- 修改 `AiService.generateTasks(...)` Prompt。
- 从当前数量调整为恰好 3 个。
- 返回结构建议：

```json
{
  "tasks": [
    {
      "title": "Short Answer",
      "titleZh": "短回答",
      "prompt": "Describe a time when...",
      "promptZh": "描述一次你……的经历。",
      "type": "short_answer",
      "difficulty": "easy",
      "suggestedLength": "3-5 sentences"
    }
  ]
}
```

验收：

- 每次生成 3 个任务。
- 任务适合口语回答。
- 初级任务更具体，进阶任务更开放。

### 5.7 增强 AI 点评

任务：

- 修改 `LearningController.reviewAnswer(...)` 支持 `LearningReviewRequest`。
- 修改 `AiService.reviewAnswer(...)`，或新增重载，接收：
  - `taskTitle`
  - `taskDescription`
  - `answer`
  - `mode`
  - `inputMode`
- 返回结构：

```json
{
  "score": 85,
  "strengths": ["..."],
  "improvements": ["..."],
  "corrections": [
    {
      "original": "I very like travel.",
      "corrected": "I really like traveling.",
      "explanationZh": "like 前通常不用 very 修饰。"
    }
  ],
  "improvedAnswer": "...",
  "encouragement": "..."
}
```

规则：

- 点评基于提交文本，不分析音频本身。
- 初级更鼓励、更易懂。
- 进阶更严格，关注准确性、逻辑和自然度。
- 空回答应返回 400。

验收：

- 返回字段完整。
- 空回答不可提交。
- 旧调用方式不破坏。

### 5.8 默认模型和错误处理

任务：

- 检查 `AiService` 默认模型解析。
- 若默认模型不存在、API URL 为空、API Key 为空、模型名为空，返回明确业务错误。
- AI 超时、HTTP 非 2xx、JSON 解析失败要能被 Controller 转换为可读错误。
- 不要回退到硬编码不安全 Key，除非现有系统明确已有安全配置兜底。

验收：

- 默认模型缺失时接口返回清晰错误。
- 小程序能展示“AI 生成暂不可用，请稍后再试”。

---

## 6. Phase 2：后端真实语音转文字实现与验证

### 6.1 确认可复用能力，但不得降低真实转写要求

任务：

- 阅读 AI 对话相关后端代码：
  - `src/main/java/com/xiaoyouyingyu/controller/AiDialogController.java`
  - `src/main/java/com/xiaoyouyingyu/service/AiDialogService.java`
  - 如存在 ASR/TTS service，一并阅读。
- 阅读小程序：
  - `xiaochengxu/miniprogram/pages/aiDialogChat/index.js`
  - `xiaochengxu/miniprogram/pages/aiDialogChat/index.wxml`
- 确认当前 `api.speechToText(data)` 是否可上传用户本次录制的真实音频文件并返回识别文本。
- 如果当前 AI 对话页只是录音后提示“录音完成，请编辑文本发送”，该能力不满足本模块要求，必须补齐真实 ASR。

产出：

- 明确是否复用 `/api/ai-dialog/speech-to-text`。
- 明确录音文件上传字段、格式、最大时长、失败错误码。
- 明确 ASR 提供方、模型配置来源和失败处理。

验收：

- 在微信开发者工具或真机中完成一次真实录音转文本验证。
- 验证文本必须来自本次录音内容，不能是固定文案、空文本、手动输入占位或假数据。

### 6.2 必须提供可用 ASR 接口

如果 `/api/ai-dialog/speech-to-text` 已经满足真实转写要求，可以复用该接口；否则必须新增学习场景转写接口：

```http
POST /api/learning/speech-to-text
Content-Type: multipart/form-data
```

请求字段：

- `audioFile`
- `topicId` 可选
- `mode` 可选

响应：

```json
{
  "text": "I think traveling helps me learn about different cultures."
}
```

实现规则：

- 接口要求登录。
- 录音文件只用于本次识别，不落库。
- 优先复用已有 AI 对话 ASR service。
- 若没有 ASR 模型配置，返回明确错误。
- 不允许返回固定示例文本。
- 不允许把空识别结果包装成成功。
- 不允许把“请编辑文本”作为语音转文字结果。
- 小程序拿到 `text` 后仍调用 `/api/learning/review` 做点评。

验收：

- 未登录请求被拒绝。
- 成功请求返回 `text`。
- `text` 与测试录音内容基本一致。
- 识别失败返回可读错误。
- 手动上传一段不同内容录音时，返回文本随录音变化。

---

## 7. Phase 3：小程序 API 封装与页面注册

### 7.1 更新 API 封装

修改文件：

- `xiaochengxu/miniprogram/utils/api.js`

建议新增：

```js
function generateSentencePatterns(titleEn, titleZh, mode, exclude) {
  return http.post('/learning/sentence-patterns', {
    titleEn: titleEn,
    titleZh: titleZh,
    mode: mode,
    exclude: exclude || ''
  });
}

function generateIdiomaticExpressions(titleEn, titleZh, mode, exclude) {
  return http.post('/learning/idiomatic-expressions', {
    titleEn: titleEn,
    titleZh: titleZh,
    mode: mode,
    exclude: exclude || ''
  });
}

function reviewWarmupAnswer(data) {
  return http.post('/learning/review', data);
}

function learningSpeechToText(filePath, data) {
  // 必须上传用户本次真实录音文件并返回识别文本；若没有上传封装，需要新增。
}
```

如决定复用 AI 对话转写：

- 保留 `speechToText`，但必须验证它支持真实音频转写。
- 口语热身页面调用同一封装。

验收：

- 新 API 均导出到 `module.exports`。
- 旧学习中心页面不受影响。

### 7.2 注册新增页面

修改文件：

- `xiaochengxu/miniprogram/app.json`

新增页面：

```json
"pages/spokenWarmup/index",
"pages/spokenWarmupDetail/index"
```

验收：

- 微信开发者工具能编译通过。
- 可通过 `wx.navigateTo` 打开新增页面。

---

## 8. Phase 4：小程序首页入口替换

### 8.1 替换首页入口

修改文件：

- `xiaochengxu/miniprogram/pages/home/index.js`
- `xiaochengxu/miniprogram/pages/home/index.wxml`
- `xiaochengxu/miniprogram/pages/home/index.wxss`

任务：

- 找到当前“听力练习”入口配置。
- 将文案改为“口语热身”。
- 将点击行为从提示“听力练习暂未开放”改为跳转：

```js
wx.navigateTo({ url: '/pages/spokenWarmup/index' });
```

- 点击前调用现有登录检查：
  - 未登录跳转 `/pages/login/index`。
  - 已登录进入口语热身主题列表。
- 图标使用适合“开口/对话/练习”的现有图标风格。

验收：

- 首页不显示“听力练习”。
- 首页显示“口语热身”。
- 未登录点击进入登录引导。
- 已登录点击进入列表页。

---

## 9. Phase 5：小程序口语热身主题列表页

### 9.1 新建页面文件

建议新增：

- `xiaochengxu/miniprogram/pages/spokenWarmup/index.js`
- `xiaochengxu/miniprogram/pages/spokenWarmup/index.wxml`
- `xiaochengxu/miniprogram/pages/spokenWarmup/index.wxss`
- `xiaochengxu/miniprogram/pages/spokenWarmup/index.json`

页面状态：

- `keyword`
- `selectedTag`
- `startDate`
- `endDate`
- `topics`
- `page`
- `size`
- `hasMore`
- `loading`
- `loadingMore`
- `error`
- `tagStats`

### 9.2 实现搜索、标签和日期筛选

任务：

- 复用 `api.getTopics(params)`。
- 搜索框输入后可点击搜索；如现有主题页有 debounce，可复用。
- 标签来源优先用 `api.getTagStats()`。
- 日期筛选使用小程序 picker 或现有日期选择模式。
- 筛选条件变化时重置 `page = 0` 并重新加载。
- 支持下拉刷新。
- 支持触底分页。

列表项展示：

- 英文标题。
- 中文标题。
- 标签。
- 日期。

点击行为：

```js
wx.navigateTo({
  url: '/pages/spokenWarmupDetail/index?id=' + topic.id
});
```

验收：

- 主题列表能加载。
- 搜索、标签、日期能组合生效。
- 空结果展示“暂无匹配主题”。
- 加载失败有重试。
- 触底加载不重复追加。

---

## 10. Phase 6：小程序口语热身详情页

### 10.1 新建页面文件

建议新增：

- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.js`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.wxml`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.wxss`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.json`

可参考：

- `xiaochengxu/miniprogram/pages/learningTopic/index.*`

但需要调整：

- 去掉会员学习中心语义。
- 增加句型模板、地道表达两个独立模块。
- 模拟练习输入默认语音。
- 重新生成应保留本次全部批次用于 `exclude`，不能只传最近一次。

### 10.2 页面状态设计

建议状态：

```js
data: {
  topicId: null,
  topic: null,
  tagList: [],
  loading: true,
  mode: 'beginner',

  expanded: {
    warmup: true,
    vocabulary: false,
    sentencePatterns: false,
    idiomaticExpressions: false,
    tasks: false
  },

  loadingMap: {
    warmup: false,
    vocabulary: false,
    sentencePatterns: false,
    idiomaticExpressions: false,
    tasks: false,
    review: false,
    speech: false
  },

  currentContent: {
    warmup: null,
    vocabulary: null,
    sentencePatterns: null,
    idiomaticExpressions: null,
    tasks: null
  },

  selectedTask: null,
  inputMode: 'voice',
  recording: false,
  transcribing: false,
  answerText: '',
  reviewData: null,
  errorMap: {}
}
```

页面实例字段：

```js
this.generatedBatches = {
  beginner: {
    warmup: [],
    vocabulary: [],
    sentencePatterns: [],
    idiomaticExpressions: [],
    tasks: []
  },
  advanced: {
    warmup: [],
    vocabulary: [],
    sentencePatterns: [],
    idiomaticExpressions: [],
    tasks: []
  }
};
```

验收：

- 页面退出后缓存自然丢失。
- 切换难度不混用内容。
- 重新生成能构造完整 `exclude`。

### 10.3 主题加载和难度切换

任务：

- 使用 `api.getLearningTopic(id)`，失败时可 fallback 到 `api.getTopic(id)`。
- 解析 tags，复用 `utils/util` 的 tag 处理能力。
- 默认 `mode = 'beginner'`。
- 切换模式时：
  - 当前展示内容切换到对应模式缓存。
  - 清空当前任务、回答和点评。

验收：

- 主题加载成功。
- 主题不存在有错误状态。
- 初级/进阶切换稳定。

### 10.4 模块生成方法

建议抽象：

```js
generateSection(section, apiCall, isRefresh) {
  // 1. 防重复点击
  // 2. 设置当前 section loading
  // 3. isRefresh 时基于 generatedBatches[mode][section] 生成 exclude
  // 4. 调 API
  // 5. parseAiContent
  // 6. 写 currentContent
  // 7. push 到 generatedBatches
  // 8. 清 loading
}
```

模块映射：

- `warmup` -> `api.generateWarmup`
- `vocabulary` -> `api.generateVocabulary`
- `sentencePatterns` -> `api.generateSentencePatterns`
- `idiomaticExpressions` -> `api.generateIdiomaticExpressions`
- `tasks` -> `api.generateTasks`

验收：

- 首次点击生成。
- 重新生成带 `exclude`。
- 每个模块独立 loading 和错误。
- AI 返回解析失败时模块展示错误。

### 10.5 内容展示

展示要求：

- 热身介绍：
  - introduction。
  - 3 个问题。
- 核心词汇：
  - word、zh、category、difficulty、example、exampleZh。
- 句型模板：
  - pattern、zh、useCase、example、exampleZh。
- 地道表达：
  - expression、zh、usage、example、exampleZh。
- 模拟任务：
  - title、titleZh、prompt、promptZh、suggestedLength。
  - 选择任务后显示回答区。

验收：

- 长文本自动换行。
- 空字段不展示占位垃圾文本。
- 中英文排版清晰。

---

## 11. Phase 7：小程序模拟练习语音/文字输入与 AI 点评

### 11.1 输入方式切换

任务：

- 进入模拟任务回答区时默认：

```js
inputMode: 'voice'
```

- 提供“语音 / 文字”切换。
- 切换输入方式不清空已有 `answerText`，除非用户主动清空。
- 文字输入展示多行文本框。
- 语音输入展示录音按钮、录音状态、识别状态和识别结果编辑区。

验收：

- 默认语音输入。
- 可切换文字输入。
- 已识别文本可编辑。

### 11.2 录音与转写

任务：

- 使用 `wx.getRecorderManager()`。
- 录音参数建议：

```js
{
  duration: 60000,
  format: 'mp3'
}
```

- 处理事件：
  - `onStart`
  - `onStop`
  - `onError`
- `onStop` 后调用语音转文字接口。
- 转写期间显示“识别中”。
- 转写成功后把文本写入 `answerText`。
- 转写失败时保留语音输入区，提示可重录或切换文字。

权限处理：

- 首次录音前调用 `wx.authorize({ scope: 'scope.record' })` 或通过失败回调引导用户授权。
- 权限拒绝时展示 modal，引导进入设置或切换文字输入。

验收：

- 录音开始/结束状态正确。
- 权限拒绝有提示。
- 识别成功得到文本。
- 识别失败可重试或切换文字。
- 不保存录音文件。

### 11.3 提交 AI 点评

任务：

- 用户选择任务并输入或识别出文本后，启用“提交点评”。
- 提交请求：

```js
api.reviewWarmupAnswer({
  titleEn: topic.title,
  titleZh: topic.titleZh || '',
  mode: mode,
  taskTitle: selectedTask.title || selectedTask.titleZh,
  taskDescription: selectedTask.prompt || selectedTask.promptZh || '',
  answer: answerText.trim(),
  inputMode: inputMode
})
```

- 返回后解析 `content`。
- 展示：
  - score。
  - strengths。
  - improvements。
  - corrections。
  - improvedAnswer。
  - encouragement。

验收：

- 空回答不能提交。
- 点评 loading 清晰。
- 成功后结构完整展示。
- 失败后可重试。

---

## 12. Phase 8：错误处理、状态管理与体验打磨

### 12.1 错误处理

任务：

- 统一处理 401：
  - 依赖 `utils/request.js` 自动退出和跳转登录。
- 处理 403：
  - 口语热身不应出现会员限制，如出现 403，展示权限错误。
- 处理 AI 错误：
  - 默认模型缺失。
  - AI 超时。
  - AI 返回格式异常。
  - AI 返回空内容。
- 每个模块错误写入 `errorMap[section]`。

验收：

- 某模块失败不影响其他模块。
- 失败模块有重试按钮。
- 页面不白屏。

### 12.2 去重体验

任务：

- `exclude` 来源必须是本次页面会话当前难度、当前模块所有历史批次。
- 不要只传最近一次。
- 对过长 `exclude` 做截断，避免请求过大。
- 建议截断策略：
  - 每个模块最多保留最近 3 批用于 `exclude`。
  - 或序列化后最多 4000 字符。

验收：

- 连续重新生成 2 次，请求都包含之前批次。
- 请求体不会无限增长。

### 12.3 UI 体验

任务：

- 保持现有小程序 Apple/iOS 风格入口和卡片视觉。
- 模块按钮使用清晰动词：
  - “生成”
  - “重新生成”
  - “提交点评”
  - “重录”
  - “切换文字”
- 不在页面写大段功能说明。
- loading 文案具体：
  - “生成词汇中...”
  - “识别语音中...”
  - “AI 点评中...”
- 长文本卡片要换行。

验收：

- 常见手机宽度下按钮文字不溢出。
- 中英文长文本不遮挡。

---

## 13. Phase 9：测试、联调与验收

### 13.1 后端测试

建议覆盖：

- `LearningController` 权限：
  - 未登录访问生成接口被拒绝。
  - 登录用户可访问。
- 生成接口：
  - warmup 返回 1 段 + 3 问题。
  - vocabulary 返回 10 个。
  - sentence-patterns 返回 6 个。
  - idiomatic-expressions 返回 6 个。
  - tasks 返回 3 个。
- 点评接口：
  - 空回答返回 400。
  - 正常回答返回完整字段。
- 默认模型：
  - 默认模型存在时调用成功。
  - 默认模型缺失时返回明确错误。
- `exclude`：
  - 请求传入后 Prompt 包含去重规则。
- ASR：
  - 登录校验。
  - 成功返回真实录音对应的文本。
  - 不同内容录音返回不同文本。
  - 失败返回可读错误。

可运行命令：

```bash
mvn test
```

如项目已有特定测试模块，优先运行相关 controller/service 测试。

### 13.2 小程序人工测试

测试场景：

- 首页入口：
  - 未登录点击。
  - 已登录点击。
- 主题列表：
  - 首屏加载。
  - 搜索。
  - 标签筛选。
  - 日期筛选。
  - 下拉刷新。
  - 触底加载。
  - 空结果。
- 详情页：
  - 主题加载。
  - 初级生成全部模块。
  - 进阶生成全部模块。
  - 初级/进阶切换缓存隔离。
  - 每个模块重新生成。
- 模拟练习：
  - 默认语音输入。
  - 录音权限允许。
  - 录音权限拒绝。
  - 语音识别成功。
  - 语音识别失败。
  - 切换文字输入。
  - 空回答不可提交。
  - 点评成功。
  - 点评失败重试。

### 13.3 联调检查

检查项：

- 小程序请求 URL 是否正确拼接当前环境 baseUrl。
- 生成接口是否全部带 JWT。
- 401 是否能回到登录流程。
- AI 生成耗时较长时小程序不会误判超时或重复提交。
- 后端响应 `content` 是字符串时小程序能解析。
- 后端响应已是对象时小程序也能兼容。

---

## 14. Phase 10：文档同步与上线准备

### 14.1 文档同步

实现完成后更新：

- `doc/miniapp.md`
  - 首页学习入口将“听力练习”改为“口语热身”。
  - 新增 `pages/spokenWarmup/index`。
  - 新增 `pages/spokenWarmupDetail/index`。
  - 补充语音/文字输入和 AI 点评流程。
- `doc/api-and-data-model.md`
  - 补充新增或调整后的 `/api/learning/*` 接口。
  - 明确 V1 不新增数据库表。
- `doc/backend.md`
  - 补充口语热身 AI 生成逻辑、默认模型规则、`exclude` 去重规则。
- 如实现 ASR 新接口，补充接口说明和失败处理。

### 14.2 上线前检查

检查项：

- 后端生产环境默认 AI 模型可用。
- 生产环境 AI API Key 不在前端或小程序包中出现。
- 小程序体验版能录音授权。
- 小程序体验版能访问后端 HTTPS API。
- 生成接口超时时间足够。
- 录音文件不会保存到数据库或长期存储。
- 首页入口替换不会留下不可用旧入口。

---

## 15. 建议文件清单

### 后端可能修改

- `src/main/java/com/xiaoyouyingyu/controller/LearningController.java`
- `src/main/java/com/xiaoyouyingyu/service/AiService.java`
- `src/main/java/com/xiaoyouyingyu/dto/LearningGenerateRequest.java`
- `src/main/java/com/xiaoyouyingyu/dto/LearningReviewRequest.java`
- 如新增 ASR：
  - `src/main/java/com/xiaoyouyingyu/controller/LearningSpeechController.java`
  - 或在 `LearningController` 中新增 `/speech-to-text`
  - 复用或新增对应 service

### 小程序新增

- `xiaochengxu/miniprogram/pages/spokenWarmup/index.js`
- `xiaochengxu/miniprogram/pages/spokenWarmup/index.wxml`
- `xiaochengxu/miniprogram/pages/spokenWarmup/index.wxss`
- `xiaochengxu/miniprogram/pages/spokenWarmup/index.json`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.js`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.wxml`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.wxss`
- `xiaochengxu/miniprogram/pages/spokenWarmupDetail/index.json`

### 小程序修改

- `xiaochengxu/miniprogram/app.json`
- `xiaochengxu/miniprogram/utils/api.js`
- `xiaochengxu/miniprogram/utils/request.js`，仅当需要新增上传封装时修改
- `xiaochengxu/miniprogram/pages/home/index.js`
- `xiaochengxu/miniprogram/pages/home/index.wxml`
- `xiaochengxu/miniprogram/pages/home/index.wxss`

### 文档修改

- `doc/miniapp.md`
- `doc/api-and-data-model.md`
- `doc/backend.md`

---

## 16. 风险与注意事项

- 语音转文字是 V1 硬性要求。当前 AI 对话页已有录音入口，但如果不能真实转写，必须补齐 ASR；不要只做“录音完成，请编辑文本”的假语音输入。
- `exclude` 不能无限增长，否则 AI 请求会变慢且更易失败。需要截断或限制批次数。
- 现有学习中心接口可能同时被 Web 前端和小程序使用，调整 Prompt 和返回数量时要确认是否影响旧页面展示。
- 如果新增 `/sentence-patterns` 和 `/idiomatic-expressions`，小程序实现更清晰；如果复用 `/expressions?type=...`，要保证旧 `generateExpressions` 调用不受影响。
- 默认模型缺失不能静默失败，也不能暴露 API Key。
- 小程序录音权限在 iOS 和 Android 上表现可能不同，需要真机或微信开发者工具分别验证。
- V1 不保存内容，所以刷新页面后内容丢失是预期行为；UI 不要承诺历史回看。
