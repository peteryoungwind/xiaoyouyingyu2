# 每日外刊精读升级开发计划

> 日期：2026-06-26
> 依据文档：
> - `doc/prd/daily-articles-intensive-reading-requirements-20260626.md`
> - `doc/prototypes/daily-articles-intensive-reading/index.html`
> 目标读者：后续负责实现的 AI 编码代理或开发者

---

## 1. 实施原则

- 本计划基于现有「每日外刊」基础版做升级，不从零重建模块。
- 在改代码前先阅读：
  - `doc/README.md`
  - `doc/repository-overview.md`
  - `doc/backend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`
  - `doc/prd/daily-articles-requirements-20260602.md`
  - `doc/prd/daily-articles-development-plan-20260602.md`
  - `doc/prd/daily-articles-intensive-reading-requirements-20260626.md`
  - `doc/prototypes/daily-articles-intensive-reading/index.html`
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- 小程序端沿用原生 WXML/WXSS/JS，通过 `xiaochengxu/miniprogram/utils/api.js` 和 `utils/request.js` 访问 Spring Boot REST API。
- 详情页视觉必须对齐现有系统蓝色主题：主色 `#007AFF`、浅蓝 `#E5F1FF`、卡片白底、浅灰页面背景。
- V1 不做 PC 管理后台改造、不做普通 Web 阅读页、不改首页入口。
- V1 对列表页只做轻量视觉升级：文章卡片增加封面露出，不展示时间/日期标签，不新增筛选、搜索或列表元信息。
- V1 不做会员门槛，所有已登录用户均可阅读完整精读内容。
- V1 不做句子级音频高亮、用户笔记、收藏、AI 生成精读内容、跟读评测。
- 素材通过脚本导入；导入脚本必须支持单篇完整精读 JSON，并直接引用文章自带 `audioUrl`。
- 后端接口必须兼容旧数据：旧外刊没有星级、字数、来源、长难句等字段时，小程序不报错、不渲染空壳。
- 音频播放必须使用真正的 `wx.createInnerAudioContext()` 迷你播放器，并在页面离开时释放实例。
- 实现完成后同步更新：
  - `doc/backend.md`
  - `doc/miniapp.md`
  - `doc/api-and-data-model.md`

---

## 2. 当前代码现状

### 2.1 已存在的基础能力

后端已存在：

- `DailyArticle`
- `DailyArticleParagraph`
- `DailyArticleRead`
- `DailyArticleStatus`
- `DailyArticleController`
- `AdminDailyArticleController`
- `DailyArticleService`
- `DailyArticlePublishScheduler`
- `DailyArticleRepository`
- `DailyArticleParagraphRepository`
- `DailyArticleReadRepository`
- `dto/dailyarticle/*`

小程序已存在：

- `pages/dailyArticles/index`
- `pages/dailyArticleDetail/index`
- `utils/api.js` 中的 `getDailyArticles()` / `getDailyArticle()`
- `utils/audio.js` 中的 `resolveAudioUrl()` / 简单 `play()`
- 首页和学习中心每日外刊入口

已有行为：

- 登录用户可进入每日外刊列表。
- 列表支持未读 / 已读 tab。
- 列表卡片当前是基础文字卡片；最新原型要求增加左侧封面，并移除卡片内时间/日期标签。
- 打开详情会标记已读。
- 详情可展示标题、段落、全局中文开关、总结、重点词汇、表达句型。
- 当前详情音频只是简单“播放音频”按钮，不是真正迷你播放器。

### 2.2 本次升级替换点

- 后端 `DailyArticle` 新增精读元信息字段。
- `GET /api/daily-articles/{id}` 返回精读所需新字段。
- 小程序 `pages/dailyArticleDetail` 从基础详情升级为精读详情。
- 小程序 `pages/dailyArticles` 从纯文字卡片升级为封面卡片，但不展示日期标签。
- 翻译交互从单个全局 `showZh` 升级为“逐段 showZh + 顶部全显/全隐”。
- 音频从 `utils/audio.play()` 简单播放升级为详情页内真实播放器状态机。
- 词汇展示升级为支持英/美音标、词性、释义、例句。
- 新增长难句解析模块。
- 新增或改造导入脚本，支持完整精读 JSON 写入数据库。

---

## 3. 交付目标

### 3.1 V1 完成标志

1. `daily_articles` 表支持 `difficulty_stars`、`word_count`、`source_name`、`key_sentences`。
2. `GET /api/daily-articles/{id}` 返回 `difficultyStars`、`wordCount`、`sourceName`、`keySentences`。
3. 旧文章缺少新字段时详情页正常展示，不报错。
4. 小程序列表页卡片展示左侧封面、英文标题、中文标题和进入箭头，不展示时间/日期标签。
5. 小程序详情页模块顺序为：英雄标题区 → 元信息条 → 迷你播放器 → 正文 → 总结 → 重点词汇 → 长难句解析 → 表达句型。
6. 元信息条正确展示难度星级、字数、来源、推送日期，缺字段时隐藏对应项。
7. 正文默认只显示英文；每段可单独展开 / 收起中文。
8. 顶部可以一键显示全部中文 / 隐藏全部中文。
9. 全显后单段仍可独立收起；全隐会覆盖所有单段状态。
10. 迷你播放器支持播放、暂停、当前时间、总时长、进度拖动、播放结束复位。
11. 倍速支持 `0.75 / 1.0 / 1.25 / 1.5 / 2.0`，默认 `1.0`。
12. 无 `audioUrl` 时显示“暂无音频”禁用态，不报错。
13. 音频加载失败 toast「音频播放失败」，播放器回到可重试状态。
14. 页面 `onHide` / `onUnload` 停止并销毁音频实例，无后台续播。
15. 重点词汇支持 `word / phoneticUk / phoneticUs / pos / meaning / example / exampleZh`。
16. 旧词汇结构仍可展示，至少兼容 `word / zh / example / exampleEn`。
17. 长难句解析支持多条 `sentence / translation / analysis`，无数据时整段隐藏。
18. 表达句型维持现状渲染，不补例句翻译。
19. 单篇精读 JSON 可通过脚本导入主表和段落表。
20. 导入脚本成功后打印 `IMPORT_OK` 和 `articleId`。
21. 使用微信开发者工具或真机完成播放器、翻译、列表封面、空状态、错误态验收。

---

## 4. 任务总览

### Phase 0：现状确认与范围冻结

### Phase 1：后端数据模型与 DTO 扩展

### Phase 2：后端 Service 映射与兼容处理

### Phase 3：导入 JSON 结构与脚本

### Phase 4：小程序详情页数据归一化

### Phase 5：小程序迷你音频播放器

### Phase 6：小程序列表封面卡片

### Phase 7：小程序精读详情 UI

### Phase 8：异常态、空态与兼容兜底

### Phase 9：测试与联调

### Phase 10：文档同步与上线准备

---

## 5. Phase 0：现状确认与范围冻结

### 5.1 阅读后端现有实现

任务：

- 阅读：
  - `src/main/java/com/xiaoyouyingyu/entity/DailyArticle.java`
  - `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/DailyArticleDetailResponse.java`
  - `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/DailyArticleSaveRequest.java`
  - `src/main/java/com/xiaoyouyingyu/service/DailyArticleService.java`
  - `src/main/java/com/xiaoyouyingyu/controller/DailyArticleController.java`
  - `src/main/java/com/xiaoyouyingyu/controller/AdminDailyArticleController.java`
  - `src/main/java/com/xiaoyouyingyu/repository/DailyArticleRepository.java`
  - `src/main/java/com/xiaoyouyingyu/repository/DailyArticleParagraphRepository.java`

产出：

- 确认本次只扩展基础每日外刊，不新增新业务模块。
- 确认用户端详情接口仍为 `GET /api/daily-articles/{id}`。
- 确认列表接口不增加 FR-7 元信息字段，也不新增封面字段。
- 确认 PC 管理页本轮不做 UI 改造。

验收：

- 不新增新的 controller 路径。
- 不改变阅读记录、列表未读/已读、每日推送逻辑。
- 列表封面卡片由小程序端基于现有列表项生成视觉，不依赖后端新字段。

### 5.2 阅读小程序现有实现

任务：

- 阅读：
  - `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.js`
  - `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxml`
  - `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxss`
  - `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.json`
  - `xiaochengxu/miniprogram/pages/dailyArticles/index.*`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/audio.js`
  - `xiaochengxu/miniprogram/app.wxss`

产出：

- 确认详情页为本次主改造对象。
- 确认列表页纳入轻量视觉改造：卡片左侧增加封面，不展示时间/日期标签。
- 确认主色使用 `app.wxss` 的 `--primary: #007AFF`。

验收：

- 首页入口和学习中心入口不改。
- `app.json` 页面注册不改。
- 列表 tab、分页、下拉刷新、触底加载逻辑不改。

### 5.3 阅读原型并建立页面映射

任务：

- 阅读：
  - `doc/prototypes/daily-articles-intensive-reading/index.html`
  - `doc/prototypes/daily-articles-intensive-reading/pages/01-list-context.html`
  - `doc/prototypes/daily-articles-intensive-reading/pages/02-detail-reading.html`
  - `doc/prototypes/daily-articles-intensive-reading/pages/03-detail-playing.html`
  - `doc/prototypes/daily-articles-intensive-reading/pages/04-study-modules.html`
  - `doc/prototypes/daily-articles-intensive-reading/pages/05-states.html`

页面映射：

| 原型页面 | 实现目标 |
| --- | --- |
| `01-list-context.html` | `pages/dailyArticles` 列表封面卡片，不显示时间/日期标签 |
| `02-detail-reading.html` | `pages/dailyArticleDetail` 默认态 |
| `03-detail-playing.html` | `pages/dailyArticleDetail` 播放中、全译、倍速态 |
| `04-study-modules.html` | 详情页下半部分学习模块 |
| `05-states.html` | 详情页 loading、error、无音频态 |

验收：

- 实现阶段不额外发散新的页面结构。
- 列表封面只用于视觉识别，不引入筛选、搜索或更多列表字段。
- 详情页视觉以原型蓝色版为准。

---

## 6. Phase 1：后端数据模型与 DTO 扩展

### 6.1 扩展 DailyArticle 实体

修改文件：

- `src/main/java/com/xiaoyouyingyu/entity/DailyArticle.java`

新增字段：

```java
@Column(name = "difficulty_stars")
private Integer difficultyStars;

@Column(name = "word_count")
private Integer wordCount;

@Column(name = "source_name", length = 200)
private String sourceName;

@Column(name = "key_sentences", columnDefinition = "json")
private String keySentences;
```

实现要求：

- `difficultyStars` 可空；非空时业务上按 1-5 使用。
- `wordCount` 可空；非空时应为正整数。
- `sourceName` 可空。
- `keySentences` 可空，存 JSON 数组字符串。
- 保留 `vocabulary` / `expressions` 现有 JSON 字段，只升级内部结构约定。
- 当前项目使用 `ddl-auto: update`，数据库由 Hibernate 自动加列。

验收：

- 后端启动后 `daily_articles` 表有新列。
- 老记录新字段为 `null` 时服务正常启动。

### 6.2 扩展 DailyArticleDetailResponse

修改文件：

- `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/DailyArticleDetailResponse.java`

新增字段：

```java
private Integer difficultyStars;
private Integer wordCount;
private String sourceName;
private String keySentences;
```

验收：

- 用户端和管理端详情响应都包含新字段。
- 字段为 `null` 时 JSON 正常返回。

### 6.3 扩展 DailyArticleSaveRequest（谨慎）

修改文件：

- `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/DailyArticleSaveRequest.java`

建议新增字段：

```java
private Integer difficultyStars;
private Integer wordCount;
private String sourceName;
private String keySentences;
```

注意：

- 虽然 V1 不改 PC 管理页，但已有 `AdminDailyArticleController` 使用该 request。
- 如果直接在 `apply()` 中用 request 的 null 覆盖实体，PC 管理页保存旧表单时可能清空新字段。
- 推荐策略：
  - 方案 A：本轮不扩展 `DailyArticleSaveRequest`，只让脚本直接写库，新字段只通过详情接口读出。
  - 方案 B：扩展 request，同时更新 PC 管理页表单一起维护新字段。
  - 方案 C：扩展 request，并在 update 场景中只对显式传入字段更新；但 Java DTO 无法区分“未传”和“传 null”，实现复杂度较高。
- 本计划推荐方案 A，最符合“素材脚本导入，不需要后台”的范围。

验收：

- PC 旧管理页编辑文章时不破坏脚本导入的新字段。

### 6.4 字段校验与边界处理

建议在 `DailyArticleService` 映射详情时做轻量归一化：

- `difficultyStars < 1` 按 1 返回。
- `difficultyStars > 5` 按 5 返回。
- `wordCount <= 0` 返回 `null`。
- `sourceName` 空串返回 `null`。
- `keySentences` 空串返回 `null`。

验收：

- 异常数据不导致小程序渲染错误。
- 元信息分隔符不出现悬空。

---

## 7. Phase 2：后端 Service 映射与兼容处理

### 7.1 扩展 DailyArticleService.toDetail()

修改文件：

- `src/main/java/com/xiaoyouyingyu/service/DailyArticleService.java`

当前 `toDetail()` 需要增加：

```java
.difficultyStars(normalizeDifficultyStars(article.getDifficultyStars()))
.wordCount(normalizeWordCount(article.getWordCount()))
.sourceName(blankToNull(article.getSourceName()))
.keySentences(blankToNull(article.getKeySentences()))
```

建议新增私有方法：

```java
private Integer normalizeDifficultyStars(Integer value)
private Integer normalizeWordCount(Integer value)
```

验收：

- `GET /api/daily-articles/{id}` 返回新字段。
- `getAdminDetail()` 同样返回新字段，方便调试。

### 7.2 保持列表接口不变

修改文件：

- 暂不修改 `DailyArticleListItemResponse`
- 暂不修改 `toUserListItem()`

原因：

- 最新原型的列表封面是视觉升级，不需要后端提供封面 URL。
- FR-7 中的难度星级、字数、是否有音频标记仍不纳入 v1。
- 避免列表 payload 增大。

验收：

- `GET /api/daily-articles` 响应结构不因本次升级变化。
- 小程序列表页可基于现有 `title/titleZh/id` 生成封面视觉。
- 小程序列表卡片不展示时间/日期标签。

### 7.3 权限与发布逻辑不变

保持：

- `/api/daily-articles/**` 仍要求登录。
- 非管理员不能读取未发布文章。
- 进入详情仍标记已读。
- `DailyArticlePublishScheduler` 仍按现有逻辑推送。

验收：

- 普通用户访问未发布外刊仍返回 404。
- 管理员通过管理接口仍可查看未发布详情。

---

## 8. Phase 3：导入 JSON 结构与脚本

### 8.1 新增导入脚本

建议新增文件：

- `scripts/import_daily_article_intensive_reading.java`

不建议改造 `scripts/import_daily_english_wordbook.java`：

- 该脚本目前用于单词本，和每日外刊无直接关系。
- 新增独立脚本更清晰，避免破坏已有导入链路。

默认输入文件：

- `doc/generated/daily-article-intensive-reading.json`

命令建议：

```bash
javac -cp "target/classes:<mysql-driver>:<jackson-jars>" scripts/import_daily_article_intensive_reading.java
java scripts/import_daily_article_intensive_reading
java scripts/import_daily_article_intensive_reading verify <articleId>
```

实际命令可按项目现有脚本运行方式调整。

### 8.2 导入 JSON 格式

脚本必须支持需求文档定义的单篇结构：

```json
{
  "title": "Why are more older Americans getting divorced?",
  "titleZh": "为什么越来越多的美国老年人选择离婚？",
  "audioUrl": "https://.../gray-divorce.mp3",
  "difficultyStars": 3,
  "wordCount": 670,
  "sourceName": "纽约时报",
  "summary": "本文讨论美国 50 岁以上人群离婚率上升的原因……",
  "status": "ENABLED",
  "publishedDate": null,
  "paragraphs": [
    { "sortOrder": 1, "contentEn": "Americans age 50 and older...", "contentZh": "在美国，50岁及以上人群……" }
  ],
  "vocabulary": [
    {
      "word": "separation",
      "phoneticUk": "ˌsepəˈreɪʃn",
      "phoneticUs": "ˌsepəˈreɪʃn",
      "pos": "n.",
      "meaning": "分开；分居；离析",
      "example": "The couple agreed to a trial separation.",
      "exampleZh": "这对夫妻同意试行分居。"
    }
  ],
  "expressions": [
    { "expression": "stare down the barrel of", "meaning": "直面（困境/危险）", "example": "..." }
  ],
  "keySentences": [
    {
      "sentence": "Nearly 40% of all divorces nationwide are among couples 50 years and older.",
      "translation": "全美约40%的离婚发生在50岁及以上的夫妻之间。",
      "analysis": "主句 Nearly 40% ... are among ...；among 引出范围状语……"
    }
  ]
}
```

### 8.3 写入规则

写入 `daily_articles`：

- `title`
- `title_zh`
- `audio_url`
- `difficulty_stars`
- `word_count`
- `source_name`
- `summary`
- `vocabulary`
- `expressions`
- `key_sentences`
- `status`
- `published_date`
- `created_at`
- `updated_at`

写入 `daily_article_paragraphs`：

- `article_id`
- `sort_order`
- `content_en`
- `content_zh`

业务规则：

- `title` 必填。
- `paragraphs` 至少一条，除非明确允许导入草稿。
- `difficultyStars` 缺省可空；非空裁剪到 1-5。
- `wordCount` 缺省可空；非正数写 null。
- `audioUrl` 是完整外链时原样写入。
- `vocabulary`、`expressions`、`keySentences` 以合法 JSON 数组字符串写入。
- `status` 缺省为 `ENABLED`。
- `publishedDate` 为 null 时交给现有每日推送任务；非 null 时直接作为已发布文章。

### 8.4 事务与校验

脚本要求：

- 单篇导入使用事务。
- 主表插入成功后再插入段落。
- 任一段落插入失败必须回滚主表。
- 插入完成后查询校验：
  - 主表记录存在。
  - 段落数量等于有效段落数量。
  - `key_sentences` 是合法 JSON。
  - `vocabulary` 是合法 JSON。
  - `status` 正确。

成功输出：

```text
IMPORT_OK
articleId=<id>
paragraphs=<count>
vocabulary=<count>
keySentences=<count>
status=<status>
publishedDate=<date-or-null>
```

验收：

- 使用一篇完整 JSON 导入成功。
- 使用 `verify <articleId>` 可打印标题、段落数、词汇数、长难句数。
- 导入后的文章可通过接口和小程序详情页正常展示。

---

## 9. Phase 4：小程序详情页数据归一化

### 9.1 扩展页面 data

修改文件：

- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.js`

建议 data：

```js
data: {
  id: null,
  article: null,
  paragraphs: [],
  vocabulary: [],
  expressions: [],
  keySentences: [],
  allZhVisible: false,
  loading: true,
  error: '',

  audioUrl: '',
  audioReady: false,
  audioLoading: false,
  audioPlaying: false,
  audioCurrentTime: 0,
  audioDuration: 0,
  audioCurrentText: '00:00',
  audioDurationText: '00:00',
  audioProgress: 0,
  audioRate: 1.0,
  showRateMenu: false,
  rateOptions: [0.75, 1.0, 1.25, 1.5, 2.0],
  seeking: false
}
```

### 9.2 段落归一化

当前 `paragraphs` 直接使用接口数据。本次改为：

```js
function normalizeParagraphs(paragraphs) {
  return (paragraphs || []).map(function (item, index) {
    return {
      id: item.id || index,
      sortOrder: item.sortOrder || index + 1,
      contentEn: item.contentEn || '',
      contentZh: item.contentZh || '',
      showZh: false
    };
  }).filter(function (item) {
    return item.contentEn || item.contentZh;
  });
}
```

验收：

- 单段显示中文只影响该段。
- 无中文段落不显示“点击查看翻译”。

### 9.3 词汇归一化

当前 `normalizeStudyItem()` 过于简单，需要保留新结构。

建议新增：

```js
function normalizeVocabularyItem(item) {
  return {
    word: item.word || item.title || '',
    phoneticUk: item.phoneticUk || item.uk || '',
    phoneticUs: item.phoneticUs || item.us || '',
    pos: item.pos || item.partOfSpeech || '',
    meaning: item.meaning || item.zh || item.titleZh || '',
    example: item.example || item.exampleEn || '',
    exampleZh: item.exampleZh || ''
  };
}
```

过滤规则：

- `word` 和 `meaning` 至少有一个存在才展示。
- 音标、词性、例句缺省时隐藏对应行。

### 9.4 表达归一化

表达句型维持现状，兼容旧字段：

```js
function normalizeExpressionItem(item) {
  return {
    title: item.expression || item.template || item.word || item.en || item.title || '',
    meaning: item.meaning || item.zh || item.titleZh || '',
    example: item.example || item.exampleEn || '',
    note: item.category || item.difficulty || ''
  };
}
```

### 9.5 长难句归一化

新增：

```js
function normalizeKeySentenceItem(item) {
  return {
    sentence: item.sentence || item.en || '',
    translation: item.translation || item.zh || '',
    analysis: item.analysis || item.note || ''
  };
}
```

过滤规则：

- `sentence` 和 `analysis` 至少有一个存在才展示。
- `analysis` 多行需要在 WXML/WXSS 中 `white-space: pre-wrap`。

### 9.6 元信息计算

建议在 `loadDetail()` 后计算：

- `difficultyStars`: 长度为 5 的数组，如 `[true,true,true,false,false]`。
- `hasMeta`: 星级、字数、来源、日期任一存在。
- `wordCountText`: `670 词`。
- `sourceName`: 空串转空。

验收：

- 缺字段时不出现多余分隔符。
- 星级超出范围时裁剪。

---

## 10. Phase 5：小程序迷你音频播放器

### 10.1 播放器生命周期

修改文件：

- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.js`

建议在页面实例上保存：

```js
audioContext: null
```

生命周期要求：

- `onLoad` 只加载数据，不立即播放。
- 有 `audioUrl` 时可在数据加载后初始化音频上下文。
- `onHide` 调用 `destroyAudio()`.
- `onUnload` 调用 `destroyAudio()`.

实现函数：

- `initAudio(url)`
- `destroyAudio()`
- `toggleAudio()`
- `playAudio()`
- `pauseAudio()`
- `onAudioSeekChanging(e)`
- `onAudioSeekChange(e)`
- `toggleRateMenu()`
- `selectRate(e)`
- `resetAudioState()`
- `formatTime(seconds)`

### 10.2 createInnerAudioContext 事件

`initAudio(url)`：

- 先调用 `destroyAudio()`，避免多实例。
- 使用 `audio.resolveAudioUrl(url)` 获取真实 URL。
- 创建 `wx.createInnerAudioContext()`。
- 设置：
  - `ctx.src`
  - `ctx.obeyMuteSwitch = false`（如项目需要）
  - `ctx.playbackRate = this.data.audioRate`
- 监听：
  - `onCanplay`
  - `onPlay`
  - `onPause`
  - `onTimeUpdate`
  - `onEnded`
  - `onError`

状态规则：

- `onCanplay` 设置 `audioReady=true`，并尝试读取 `duration`。
- `onPlay` 设置 `audioPlaying=true`、`audioLoading=false`。
- `onPause` 设置 `audioPlaying=false`。
- `onTimeUpdate` 更新当前时间、总时长、进度百分比。
- `onEnded` 暂停态、进度归零、当前时间归零。
- `onError` toast「音频播放失败」，复位播放态。

### 10.3 播放 / 暂停

`toggleAudio()`：

- 无 `audioUrl`：toast「暂无音频」。
- 未初始化：调用 `initAudio()`。
- 正在播放：调用 `pauseAudio()`。
- 未播放：调用 `playAudio()`。

`playAudio()`：

- 设置 `audioLoading=true`。
- 调用 `ctx.play()`。
- 微信小程序部分环境需在 `play()` 后再次设置 `ctx.playbackRate`，切换倍速也要同理处理。

### 10.4 拖动进度

WXML 使用 `slider` 或自定义进度条均可。

推荐用小程序原生 `slider`：

- `value="{{audioProgress}}"`
- `bindchanging="onAudioSeekChanging"`
- `bindchange="onAudioSeekChange"`
- `activeColor="#007AFF"`
- `backgroundColor="#D8E9FF"`
- `block-color="#FFFFFF"`

`onAudioSeekChanging(e)`：

- 设置 `seeking=true`。
- 只更新 UI，不立即 `seek()`。

`onAudioSeekChange(e)`：

- 根据百分比计算目标秒数。
- 调用 `ctx.seek(targetSeconds)`。
- 设置 `seeking=false`。

验收：

- 拖动不会被 `onTimeUpdate` 抢回。
- 无 duration 时 slider 禁用或不执行 seek。

### 10.5 倍速切换

倍速档位：

- `0.75`
- `1.0`
- `1.25`
- `1.5`
- `2.0`

`selectRate(e)`：

- 获取 `rate`。
- 更新 `audioRate`。
- 如果 `audioContext` 存在，设置 `audioContext.playbackRate = rate`。
- 如果正在播放，必要时在 `play()` 后再次设置。
- 关闭倍速菜单。

验收：

- `2.0` 档位可见且可选。
- 选中态正确。
- 切换倍速不重建音频实例。

### 10.6 utils/audio.js 处理

当前 `utils/audio.js` 的 `resolveAudioUrl()` 可复用。

建议：

- 保留 `play()` 给单词音频等旧场景使用。
- 不把详情页完整播放器状态机塞进 `utils/audio.js`，避免影响其它调用方。
- 可以导出 `resolveAudioUrl()` 给详情页使用。

验收：

- 其它页面调用 `audio.play()` 不受影响。

---

## 11. Phase 6：小程序列表封面卡片

### 11.1 改造范围

修改文件：

- `xiaochengxu/miniprogram/pages/dailyArticles/index.wxml`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.wxss`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.js`（仅当需要封面辅助字段时修改）

不修改：

- `GET /api/daily-articles`
- `DailyArticleListItemResponse`
- `DailyArticleService.toUserListItem()`
- 首页入口、学习中心入口、列表 tab、分页、刷新逻辑

目标：

- 将现有纯文字列表卡片升级为左侧封面 + 右侧标题信息。
- 列表卡片不展示时间/日期标签。
- 不展示难度星级、字数、是否有音频等 FR-7 元信息。

### 11.2 列表卡片结构

参考原型：

- `doc/prototypes/daily-articles-intensive-reading/pages/01-list-context.html`

建议 WXML 结构：

```text
article-row
  article-cover
    cover-kicker
    cover-title
    cover-mark
  article-row-main
    article-row-title
    article-row-zh
  arrow
```

展示内容：

- 封面：前端生成，不依赖后端字段。
- 英文标题：`item.title`。
- 中文标题：`item.titleZh` 有值才展示。
- 箭头：保留进入详情的 affordance。

明确不展示：

- `publishedDate`
- `06-26` 等日期 chip
- 任何时间标签

验收：

- 列表每张卡片有封面。
- 卡片里没有日期或时间标签。
- 点击卡片仍进入 `pages/dailyArticleDetail/index?id=<articleId>`。
- 未读 / 已读 tab 逻辑不受影响。

### 11.3 封面生成规则

推荐在小程序端根据文章内容生成稳定封面：

```js
function buildArticleCover(article, index) {
  var title = article.title || '';
  var words = title.split(/\s+/).filter(Boolean);
  var coverTitle = words.slice(0, 2).join('\n').toUpperCase();
  return {
    kicker: inferCoverKicker(article, index),
    title: coverTitle || 'DAILY\nREAD',
    mark: inferCoverMark(article, index),
    theme: 'theme-' + (index % 3)
  };
}
```

可选规则：

- `kicker` 可由来源推断；列表接口当前无 `sourceName`，因此可用 `DAILY`、`READ`、`NEWS`、`CITY` 等前端常量轮换。
- `mark` 不使用日期；可使用 `READ`、`A1`、`50+`、`TOPIC` 等非时间标签。
- `theme` 使用 3-5 个固定 CSS 类轮换，保持视觉丰富度。

注意：

- 不要把日期格式化成封面 mark。
- 不要为了封面新增数据库字段。
- 如果未来真的需要运营上传封面图，应另立需求，不混入本次 v1。

### 11.4 列表样式

WXSS 要求：

- 卡片白底、圆角、轻阴影。
- 左侧封面固定尺寸，不能被标题挤压。
- 标题区域 `min-width: 0`，长英文自动换行。
- 中文标题最多自然换行，不覆盖箭头。
- 使用系统蓝 `#007AFF` 作为主封面色，可搭配少量金色/深蓝形成区分。

建议尺寸：

- 封面宽 `140rpx` 左右，高 `170rpx` 左右。
- 卡片内边距 `26-30rpx`。
- 封面圆角 `32-36rpx`。

验收：

- iPhone 宽度下封面、标题、箭头不重叠。
- 三条以上列表卡片高度稳定。
- 去掉时间标签后标题垂直对齐自然。

---

## 12. Phase 7：小程序精读详情 UI

### 12.1 WXML 结构

修改文件：

- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxml`

建议结构：

```text
page-container safe-bottom detail-page
  loading
  error
  normal
    article-hero
      date chip
      title
      titleZh
      meta bar
    mini-player / no-audio-player
    read-mode
    content-card paragraphs
    summary section
    vocabulary section
    key-sentences section
    expressions section
```

模块显隐：

- `article.titleZh` 有值才展示中文标题。
- `hasMeta` 为 true 才展示元信息条。
- `article.audioUrl` 有值展示播放器，否则展示禁用态。
- `paragraphs.length > 0` 才展示正文卡片。
- `article.summary` 有值才展示总结。
- `vocabulary.length > 0` 才展示重点词汇。
- `keySentences.length > 0` 才展示长难句。
- `expressions.length > 0` 才展示表达句型。

### 12.2 英雄标题与元信息条

参考原型：

- `02-detail-reading.html`
- `03-detail-playing.html`

展示字段：

- `publishedDate`
- 英文标题
- 中文标题
- 难度星级
- 字数
- 来源

星级渲染：

- 使用 `wx:for="{{difficultyStars}}"` 渲染 5 个星。
- 实心星使用 `★`，空星也可使用 `★` + 弱化色。

验收：

- `difficultyStars=3` 展示 3 个实心、2 个灰色星。
- 无 `wordCount` 时不展示“词”。
- 无 `sourceName` 时不展示来源。

### 12.3 迷你播放器 WXML

参考原型：

- `03-detail-playing.html`

建议结构：

```text
mini-player
  player-top
    play button
    player-info
      label
      slider
  player-bottom
    time
    rate button
    rate menu
```

无音频：

```text
player-disabled
  disabled icon
  暂无音频
```

验收：

- 播放态按钮显示暂停符号。
- 暂停态按钮显示播放符号。
- loading 态可显示“加载中”或按钮弱化。

### 12.4 翻译控制

顶部全局开关：

- 按原型显示两个 pill：
  - `隐藏全部中文`
  - `显示全部中文`

也可以在小程序中简化为一个 segmented control，但必须表达清楚当前状态。

事件：

- `showAllTranslations()`
- `hideAllTranslations()`
- `toggleParagraphTranslation(e)`

段落：

- 英文正文始终展示。
- 有中文时展示按钮：
  - 未展开：`点击查看翻译`
  - 已展开：`收起翻译`
- 中文译文使用浅灰底块。

验收：

- 单段切换不影响其它段。
- 全显 / 全隐批量改变每段 `showZh`。

### 12.5 重点词汇

WXML 字段：

- `item.word`
- `item.pos`
- `item.phoneticUk`
- `item.phoneticUs`
- `item.meaning`
- `item.example`
- `item.exampleZh`

展示规则：

- 单词和词性同一行。
- 英美音标单独一行，缺哪个隐藏哪个。
- 释义必显，若无释义但有旧字段则展示兼容后的 meaning。
- 英文例句显示在释义下方。
- 例句翻译有则显示。

验收：

- 长音标不会撑破卡片。
- 缺音标时布局不留空洞。

### 12.6 长难句解析

WXML 字段：

- `item.sentence`
- `item.translation`
- `item.analysis`

展示规则：

- 原句加粗或保持英文正文风格。
- 翻译使用中文辅助色。
- 解析使用浅蓝底块，支持多行。

WXSS：

```css
.sentence-analysis {
  white-space: pre-wrap;
}
```

验收：

- 多条长难句按 JSON 顺序展示。
- 无长难句时不渲染模块标题。

### 12.7 表达句型

维持现状：

- 不新增例句翻译要求。
- 只做视觉上与新卡片系统协调。

验收：

- 旧 expressions JSON 仍能展示。

---

## 13. Phase 8：异常态、空态与兼容兜底

### 13.1 Loading 态

保留当前：

- `loading-spinner`
- `加载中...`

视觉按系统蓝调整：

- spinner 顶部颜色改为 `#007AFF` 或 `var(--primary)`。

### 13.2 Error 态

当前错误态可复用：

- 标题：`外刊不存在`
- 描述：接口错误信息
- 操作：`重试`

要求：

- 401 登录失效沿用现有请求层逻辑。
- 非 401 显示 toast 并保留错误态。

### 13.3 无音频态

新增禁用播放器：

- 显示“暂无音频”
- 不展示可拖动 slider
- 点击不报错，或 toast「暂无音频」

### 13.4 空模块显隐

模块为空时整段隐藏：

- 无 summary：隐藏文章总结。
- 无 vocabulary：隐藏重点词汇。
- 无 keySentences：隐藏长难句解析。
- 无 expressions：隐藏表达句型。
- 无 contentZh：对应段落不显示翻译按钮。

验收：

- 页面不会出现只有标题没有内容的空卡片。

---

## 14. Phase 9：测试与联调

### 14.1 后端单元测试

建议新增：

- `src/test/java/com/xiaoyouyingyu/service/DailyArticleServiceIntensiveReadingTest.java`

覆盖：

- `toDetail()` 返回新字段。
- `difficultyStars` 小于 1、大于 5、null 的归一化。
- `wordCount` 非正数返回 null。
- 旧数据 `keySentences=null` 不报错。

如果 `toDetail()` 是 private，可通过 `getAdminDetail()` 或 service 公共方法间接验证。

### 14.2 后端接口测试

建议新增：

- `src/test/java/com/xiaoyouyingyu/controller/DailyArticleControllerIntensiveReadingTest.java`

覆盖：

- 登录用户请求已发布文章详情返回新字段。
- 普通用户请求未发布文章仍 404。
- 旧文章无新字段时响应字段为 null 或缺省安全。

### 14.3 导入脚本验证

准备样例：

- `doc/generated/daily-article-intensive-reading.example.json`

验证：

- 脚本导入成功。
- `verify <articleId>` 成功。
- 数据库 JSON 字段合法。
- 接口返回字段与 JSON 一致。

### 14.4 小程序手动验收

设备：

- 微信开发者工具 iPhone 模拟器。
- 至少一台真机。

路径：

1. 登录。
2. 首页进入每日外刊。
3. 检查列表卡片有封面、英文标题、中文标题和箭头。
4. 确认列表卡片不展示任何时间/日期标签。
5. 打开一篇带完整精读数据的文章。
6. 检查元信息条。
7. 单段展开翻译。
8. 全部显示中文。
9. 全部隐藏中文。
10. 播放音频。
11. 暂停音频。
12. 拖动进度。
13. 切换 `2.0` 倍速。
14. 离开页面确认无后台续播。
15. 打开无音频文章，确认禁用态。
16. 打开旧数据文章，确认兼容。

### 14.5 构建检查

后端：

```bash
mvn test
```

小程序：

- 使用微信开发者工具编译。
- 控制台无 JS 报错。
- 页面无明显样式溢出。

---

## 15. Phase 10：文档同步与上线准备

### 15.1 更新后端文档

修改：

- `doc/backend.md`
- `doc/api-and-data-model.md`

补充：

- `DailyArticle` 新字段。
- `DailyArticleDetailResponse` 新字段。
- 导入脚本说明。

### 15.2 更新小程序文档

修改：

- `doc/miniapp.md`

补充：

- 每日外刊详情升级后的模块顺序。
- 迷你播放器生命周期。
- 翻译交互规则。
- 旧数据兼容规则。

### 15.3 上线前数据准备

准备至少三类文章：

- 完整精读文章：有音频、元信息、词汇、长难句。
- 无音频文章：验证禁用态。
- 旧结构文章：验证兼容。

上线前检查：

- 数据库新列已存在。
- 小程序线上域名可访问外链音频。
- 外链音频满足微信小程序网络域名配置要求。
- 导入脚本环境变量不使用硬编码生产密码。

---

## 16. 文件级改动清单

### 16.1 后端必须修改

- `src/main/java/com/xiaoyouyingyu/entity/DailyArticle.java`
- `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/DailyArticleDetailResponse.java`
- `src/main/java/com/xiaoyouyingyu/service/DailyArticleService.java`

### 16.2 后端视方案修改

- `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/DailyArticleSaveRequest.java`
- `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/AdminDailyArticleListItemResponse.java`
- `frontend/src/app/admin/daily-articles/page.tsx`
- `frontend/src/lib/api.ts`

说明：

- 因 V1 明确“不需要后台”，以上 PC 管理相关文件不建议纳入本轮。
- 如果决定让 PC 管理页也维护新字段，必须同步修改 request、service apply、PC 表单，不能只改其中一处。

### 16.3 小程序必须修改

- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.js`
- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxml`
- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxss`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.js`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.wxml`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.wxss`

### 16.4 小程序视方案修改

- `xiaochengxu/miniprogram/utils/audio.js`

说明：

- 推荐只复用 `resolveAudioUrl()`。
- 不建议改变 `audio.play()` 现有行为。

### 16.5 脚本与样例

建议新增：

- `scripts/import_daily_article_intensive_reading.java`
- `doc/generated/daily-article-intensive-reading.example.json`

### 16.6 测试建议新增

- `src/test/java/com/xiaoyouyingyu/service/DailyArticleServiceIntensiveReadingTest.java`
- `src/test/java/com/xiaoyouyingyu/controller/DailyArticleControllerIntensiveReadingTest.java`

### 16.7 文档同步

- `doc/backend.md`
- `doc/miniapp.md`
- `doc/api-and-data-model.md`

---

## 17. 数据库字段清单

表：`daily_articles`

| 字段 | 类型 | 可空 | 说明 |
| --- | --- | --- | --- |
| `difficulty_stars` | TINYINT / INT | 是 | 难度星级，业务范围 1-5 |
| `word_count` | INT | 是 | 英文词数 |
| `source_name` | VARCHAR(200) | 是 | 来源名称，如 纽约时报 |
| `key_sentences` | JSON | 是 | 长难句解析数组 |

兼容：

- 旧记录新字段均为 null。
- 小程序按空值隐藏对应 UI。

---

## 18. API 响应目标

`GET /api/daily-articles/{id}` 响应在现有基础上新增：

```json
{
  "id": 1,
  "title": "Why are more older Americans getting divorced?",
  "titleZh": "为什么越来越多的美国老年人选择离婚？",
  "audioUrl": "https://.../gray-divorce.mp3",
  "difficultyStars": 3,
  "wordCount": 670,
  "sourceName": "纽约时报",
  "summary": "本文讨论……",
  "vocabulary": "[...]",
  "expressions": "[...]",
  "keySentences": "[...]",
  "publishedDate": "2026-06-26",
  "read": true,
  "paragraphs": [
    {
      "id": 1,
      "sortOrder": 1,
      "contentEn": "Americans age 50 and older...",
      "contentZh": "在美国，50岁及以上人群……"
    }
  ]
}
```

注意：

- `vocabulary`、`expressions`、`keySentences` 按当前工程风格继续返回 JSON 字符串。
- 小程序负责 `JSON.parse()` 并兼容异常。

---

## 19. 小程序状态机摘要

### 19.1 列表卡片状态

| 状态 | 条件 | UI |
| --- | --- | --- |
| normal | 有文章列表 | 封面 + 英文标题 + 中文标题 + 箭头 |
| no-title-zh | `!item.titleZh` | 只展示英文标题，中文行隐藏 |
| long-title | 英文标题较长 | 标题自然换行，封面和箭头不被挤压 |
| no-date-label | 任意列表卡片 | 不展示 `publishedDate`、日期 chip 或时间标签 |

### 19.2 页面状态

| 状态 | 条件 | UI |
| --- | --- | --- |
| loading | `loading=true` | spinner + 加载中 |
| error | `error` 非空 | 外刊不存在 + 错误说明 + 重试 |
| normal | 有 article | 精读详情 |
| no-audio | `!article.audioUrl` | 禁用播放器 |

### 19.3 音频状态

| 状态 | 条件 | UI |
| --- | --- | --- |
| idle | 未播放 | 播放按钮、进度 0 |
| loading | 点击播放后等待 | 可显示加载中 |
| playing | `audioPlaying=true` | 暂停按钮、进度推进 |
| paused | 已暂停 | 播放按钮、保留进度 |
| ended | 播放结束 | 回到 0 |
| error | onError | toast + 复位 |

### 19.4 翻译状态

| 操作 | 行为 |
| --- | --- |
| 点击单段翻译 | 只切换该段 `showZh` |
| 显示全部中文 | 所有有中文段落 `showZh=true` |
| 隐藏全部中文 | 所有段落 `showZh=false` |
| 段落无中文 | 不显示翻译入口 |

---

## 20. 风险与规避

### 20.1 PC 管理页覆盖新字段

风险：

- 如果扩展 `DailyArticleSaveRequest` 并在 `apply()` 中写入新字段，而 PC 管理页没有传这些字段，编辑旧表单可能清空脚本导入的新字段。

规避：

- V1 推荐不扩展 save request。
- 或者同步更新 PC 管理页。
- 或者实现 patch 语义，但成本更高。

### 20.2 微信小程序音频域名限制

风险：

- 外链 `audioUrl` 不在小程序合法域名中，真机无法播放。

规避：

- 上线前检查外链域名。
- 必要时将音频转存到项目 uploads 或合规 CDN。

### 20.3 播放器多实例和后台续播

风险：

- 快速进出页面或重复点击播放导致多个 `InnerAudioContext`。

规避：

- 每次初始化前 `destroyAudio()`。
- `onHide` / `onUnload` 必须释放。
- `audioLoading` 防快速连点。

### 20.4 长文本撑破布局

风险：

- 长英文标题、长音标、长句解析撑破卡片。

规避：

- WXSS 使用 `word-break: break-word`。
- 音标行允许换行。
- 正文和解析使用合理行高。

---

## 21. 推荐实施顺序

1. 后端实体新增字段。
2. 后端详情响应新增字段。
3. 后端 service 映射和归一化。
4. 准备一篇本地测试数据或 SQL。
5. 小程序列表页完成封面卡片视觉，并移除卡片时间/日期标签。
6. 小程序详情页先完成数据归一化。
7. 小程序完成精读静态布局。
8. 小程序完成逐段翻译。
9. 小程序完成迷你播放器。
10. 新增导入脚本和样例 JSON。
11. 联调接口与导入数据。
12. 补测试。
13. 同步工程文档。

---

## 22. 最终验收清单

- [ ] `GET /api/daily-articles/{id}` 返回精读新字段。
- [ ] 旧文章详情可正常打开。
- [ ] 列表页卡片展示封面、英文标题、中文标题和箭头。
- [ ] 列表页卡片不展示时间/日期标签。
- [ ] 列表页未读 / 已读 tab、分页、刷新、点击进入详情正常。
- [ ] 详情页使用系统蓝色主题。
- [ ] 模块顺序与原型一致。
- [ ] 元信息条缺字段时无悬空分隔符。
- [ ] 逐段翻译正常。
- [ ] 全显 / 全隐正常。
- [ ] 无中文段落不显示翻译入口。
- [ ] 播放 / 暂停正常。
- [ ] 进度随播放推进。
- [ ] 拖动进度正常 seek。
- [ ] 倍速含 `2.0` 且可切换。
- [ ] 离开页面音频停止并释放。
- [ ] 无音频禁用态正常。
- [ ] 音频错误 toast 并复位。
- [ ] 词汇音标、词性、释义、例句展示正常。
- [ ] 长难句解析展示正常，多行解析换行正常。
- [ ] 表达句型旧数据展示正常。
- [ ] 导入脚本成功写入完整精读文章。
- [ ] `mvn test` 通过。
- [ ] 微信开发者工具编译无错误。
- [ ] `doc/backend.md`、`doc/miniapp.md`、`doc/api-and-data-model.md` 已同步。

---

## 附录：原型链接

- [原型总览](../prototypes/daily-articles-intensive-reading/index.html)
- [01 外刊列表上下文](../prototypes/daily-articles-intensive-reading/pages/01-list-context.html)
- [02 精读详情默认态](../prototypes/daily-articles-intensive-reading/pages/02-detail-reading.html)
- [03 播放与全文翻译态](../prototypes/daily-articles-intensive-reading/pages/03-detail-playing.html)
- [04 学习模块](../prototypes/daily-articles-intensive-reading/pages/04-study-modules.html)
- [05 状态页](../prototypes/daily-articles-intensive-reading/pages/05-states.html)

导入模版：
/Users/admin/code/github/xiaoyouyingyu2/doc/generated/daily-article-intensive-reading.template.json

导入脚本：
/Users/admin/code/github/xiaoyouyingyu2/scripts/import_daily_article_intensive_reading.java