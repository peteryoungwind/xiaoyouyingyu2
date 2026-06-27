# 每日外刊精读升级（小程序）需求规格

> 版本：1.0 | 最后更新：2026-06-26 | 状态：定稿
> 关联：本规格是对 `daily-articles-requirements-20260602.md` 中「每日外刊」基础版的精读升级。

---

## 1. 项目概述

- 产品类型：微信小程序内的英语精读学习模块（升级现有「每日外刊」）。
- 一句话目标：把现有「每日外刊」详情页升级为对标公众号「外刊精读」格式的沉浸式精读体验，包含逐段对译、迷你音频播放器、带音标词性的重点词汇、长难句解析。
- 目标用户：已登录的小程序学习用户（普通 + 会员）。
- 主要场景：用户从首页「每日外刊」入口进入列表，点开一篇文章，边听音频边读中英对照正文，逐句查看翻译，学习重点词汇和长难句。
- 平台：仅微信小程序（无 PC、无管理后台）。
- 成功定义：详情页呈现参考文章的全部精读要素，迷你播放器可播放/暂停/拖动/变速，逐段翻译与全局翻译开关协同工作，长难句解析正常展示；内容全部由导入脚本写入，无需任何后台操作。

---

## 2. 目标与非目标

### 目标
- 升级 `pages/dailyArticleDetail` 为精读详情页（本次工作主体）。
- 扩展后端 `DailyArticle` 数据模型与 `/api/daily-articles/{id}` 响应，承载新字段。
- 定义一套导入用 JSON 结构 + 数据库字段，并提供/更新导入脚本。

### 非目标（明确不做）
- 不改造首页入口（保持现有「每日外刊」磁贴与跳转）。
- 不做管理后台、不做任何 PC 端页面。
- 不做句子级音频高亮（未选时间戳同步方案）。
- 不做用户笔记、收藏、跟读评测、AI 生成精读内容。
- 不改动列表页 `pages/dailyArticles` 的交互（FR-7 已移出 v1，归入 Later）。
- 「表达句型」维持现状，不补例句翻译。

---

## 3. 用户与角色

### 主要用户
- 登录用户：可浏览外刊列表、阅读精读详情、使用全部精读功能。

### 角色与权限
- 游客（未登录）：进入「每日外刊」会被现有逻辑拦截跳登录页，维持现状。
- 普通用户 / 会员（USER / PREMIUM）：均可阅读精读详情，**无会员门槛**（已确认）。

---

## 4. 范围

### V1 必做（Must）
- FR-1 精读详情页布局升级
- FR-2 文章元信息条（难度星级、字数、来源、推送日期）
- FR-3 逐段「点击查看翻译」+ 顶部一键全显/全隐
- FR-4 迷你音频播放器（播放/暂停、进度拖动、倍速含 2.0）
- FR-5 重点词汇升级（英/美音标、词性、释义、例句）
- FR-6 长难句解析模块
- FR-8 后端数据模型与接口扩展
- FR-9 导入 JSON 结构与脚本

### 以后 / 可选（Later）
- FR-7 列表卡片信息增强（难度星级、字数、音频标记）。
- 后台音频自动断点续播、跨页悬浮播放条。

### 明确不做
- 见第 2 节非目标。

---

## 5. 核心用户流程

### Flow 1：进入并阅读精读
- 入口：首页「每日外刊」磁贴 → 列表页 → 点击某篇。
- 步骤：进入详情 → 接口标记已读 → 展示元信息条 + 迷你播放器 → 阅读中英对照正文 → 逐段点译或顶部全显 → 下滑看重点词汇/长难句解析。
- 成功：精读全要素正确渲染，音频可播放。
- 异常：接口失败显示错误态可重试；无音频时播放器降级为「暂无音频」占位；登录态失效跳登录页。

### Flow 2：听音频精读
- 入口：详情页迷你播放器。
- 步骤：点播放 → 进度条随播放推进 → 拖动进度跳转 → 切换倍速（0.75/1.0/1.25/1.5/2.0）→ 暂停/继续。
- 成功：音频播放状态与 UI 实时同步。
- 异常：加载失败 toast「音频播放失败」，按钮回到可重试的暂停态；离开页面自动停止并释放音频实例。

---

## 6. 功能需求

### FR-1 精读详情页布局升级
- 目标：把详情页重排为「英雄标题区 → 元信息条 → 迷你播放器 → 正文 → 总结 → 重点词汇 → 长难句解析 → 表达句型」的精读结构。
- 触发：进入 `pages/dailyArticleDetail`。
- 输入：`GET /api/daily-articles/{id}` 返回的详情对象。
- 输出：完整精读页面。
- 业务规则：各模块在对应数据为空时整段隐藏（保持现有 `wx:if` 风格）。
- 状态：loading / error（可重试）/ 正常。
- 验收：
  - [ ] 模块顺序与上面一致，空数据模块不渲染空壳。
  - [ ] 沿用现有系统蓝色视觉（`#007AFF` 主色、白底圆角卡片、`page-container safe-bottom`）。
  - [ ] 不破坏现有「已读」标记逻辑。

### FR-2 文章元信息条
- 目标：展示难度星级、字数、来源、推送日期。
- 输入字段：`difficultyStars`(1-5)、`wordCount`(int)、`sourceName`(string)、`publishedDate`。
- 输出：标题下方一行 chips/图标信息（如 ★★☆ · 670 词 · 纽约时报）。
- 业务规则：字段缺省时隐藏对应项；难度星级用实心/空心星渲染。
- 边界：`difficultyStars` 超出 1-5 时按边界裁剪；`wordCount` 缺省不显示「词」。
- 验收：
  - [ ] 星级按 1-5 正确渲染实心/空心。
  - [ ] 任一字段为空时不出现「· 」悬空分隔符。

### FR-3 逐段翻译 + 全局开关
- 目标：每个段落可独立「点击查看翻译 / 收起翻译」，顶部提供「全部显示中文 / 全部隐藏中文」。
- 输入：段落 `contentEn` / `contentZh`。
- 输出：默认仅英文；点段落下方「查看翻译」展开该段中文；顶部全局开关一次性展开/收起所有段落。
- 业务规则：
  - 全局「全显」后，单段仍可单独收起；全局「全隐」覆盖所有单段状态。
  - 段落无 `contentZh` 时不显示该段的「查看翻译」入口。
  - 段内交互状态用每段 `showZh` 布尔维护，全局开关批量 setData。
- 状态：单段已展开/未展开；全局已全显/未全显。
- 边界：纯中文缺失文章退化为只读英文。
- 验收：
  - [ ] 单段点击只切换本段，不影响其它段。
  - [ ] 全局开关正确批量切换并与单段状态同步。
  - [ ] 无中文段落不显示翻译入口。

### FR-4 迷你音频播放器
- 目标：替换当前「点一下就播」为常驻迷你播放器。
- 控件：播放/暂停按钮、当前时间 / 总时长、可拖动进度条、倍速切换（0.75 / 1.0 / 1.25 / 1.5 / 2.0，默认 1.0）。
- 输入：`audioUrl`（外链 url，经 `utils/audio.js` 的 `resolveAudioUrl` 解析，绝对 url 原样返回）。
- 输出：实时同步的播放 UI。
- 业务规则：
  - 用 `wx.createInnerAudioContext()`，监听 `onPlay/onPause/onTimeUpdate/onEnded/onError/onCanplay`。
  - 拖动 `slider` 调用 `seek()`；倍速调用 `playbackRate`（需在 `play` 后设置）。
  - 页面 `onHide`/`onUnload` 必须 `stop()` + `destroy()` 释放实例，避免后台续播。
  - 无 `audioUrl` 时播放器降级为禁用占位「暂无音频」。
- 状态：未加载 / 加载中 / 播放中 / 暂停 / 播放结束（回到起点）/ 错误。
- 边界：音频加载失败 toast 并复位；快速连点不产生多实例。
- 验收：
  - [ ] 播放/暂停、进度随播放推进、拖动跳转、倍速切换（含 2.0）均生效。
  - [ ] 离开页面音频停止且实例释放，无后台续播。
  - [ ] 无音频时不报错且显示占位。

### FR-5 重点词汇升级
- 目标：词汇项支持英式/美式音标、词性、释义、例句。
- 数据结构（`vocabulary` JSON 数组，每项）：
  - `word`(string, 必填)
  - `phoneticUk`(string, 可空)
  - `phoneticUs`(string, 可空)
  - `pos`(string, 词性如 n./adj./v.，可空)
  - `meaning`(string, 中文释义，必填)
  - `example`(string, 英文例句，可空)
  - `exampleZh`(string, 例句翻译，可空)
- 输出：词汇卡片（单词 + 音标行 `英 /../ 美 /.../` + 词性 + 释义 + 例句）。
- 业务规则：兼容旧数据（旧字段 `zh`→`meaning`），缺字段则隐藏对应行。
- 验收：
  - [ ] 音标、词性、例句各自可缺省且布局不塌陷。
  - [ ] 旧格式词汇仍能正常展示（向后兼容）。

### FR-6 长难句解析模块
- 目标：新增「长难句解析」板块。
- 数据结构（`keySentences` JSON 数组，每项）：
  - `sentence`(string, 英文原句，必填)
  - `translation`(string, 中文翻译，可空)
  - `analysis`(string, 结构/语法解析，必填)
- 输出：每条一个卡片（原句 → 翻译 → 解析），解析支持多行 `white-space: pre-wrap`。
- 业务规则：数组为空整段隐藏。
- 验收：
  - [ ] 多条长难句按顺序渲染，解析多行正常换行。
  - [ ] 无数据时不渲染该模块。

### FR-7 列表卡片信息增强（Later，不纳入 v1）
- 目标：列表卡片增加难度星级、字数、是否有音频的标记。
- 输入：`DailyArticleListItemResponse` 增补 `difficultyStars`、`wordCount`、`hasAudio`。
- 状态：本次不实现，留作后续迭代。

### FR-8 后端数据模型与接口扩展
- 目标：承载新字段并向小程序返回。
- `DailyArticle` 新增列：
  - `difficulty_stars` TINYINT 可空
  - `word_count` INT 可空
  - `source_name` VARCHAR(200) 可空
  - `key_sentences` JSON 可空
  - （沿用现有 `vocabulary` / `expressions` JSON 字段，仅升级其内部结构约定）
- `DailyArticleDetailResponse` 增补：`difficultyStars`、`wordCount`、`sourceName`、`keySentences`。
- 业务规则：`ddl-auto: update` 自动加列（与现有约定一致）；旧记录新字段为 null，前端按缺省处理。
- 验收：
  - [ ] `GET /api/daily-articles/{id}` 返回全部新字段。
  - [ ] 现有列表/已读/推送逻辑不受影响。

### FR-9 导入 JSON 结构与脚本
- 目标：定义并实现把一篇精读文章写入库的脚本流程（沿用 `import_daily_english_wordbook.java` + `doc/generated/*.json` 范式）。
- 业务规则：脚本读取 JSON → 写入 `daily_articles` 主表 + `daily_article_paragraphs` 段落表 → 打印校验结果；`status` 默认 `ENABLED`，由现有定时任务挑选推送，或脚本直接写 `publishedDate`。
- 导入 JSON 结构（单篇）：

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
    { "expression": "stare down the barrel of", "meaning": "直面（困境/危险）", "example": "...", "exampleZh": "..." }
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

- 验收：
  - [ ] 脚本对单篇 JSON 完成主表 + 段落表写入并打印 `IMPORT_OK` 及 articleId。
  - [ ] 字段缺省可容忍（音频、星级、来源等可空）。
  - [ ] `vocabulary`/`expressions`/`keySentences` 以合法 JSON 字符串写入。

---

## 7. 界面与 UI/UX

### 视觉方向
- 风格关键词：克制、专业、沉浸式阅读，与现有「每日外刊」一致。
- 主色：`#007AFF`；浅底 `#E5F1FF`；卡片白底 + `#ECECF0` 描边 + 约 `30-34rpx` 圆角。
- 字体层级：英文正文 `~31rpx` 行高 `1.85`；中文译文置于浅灰底块 `#F5F7FA`。
- 交互基调：轻量，无夸张动效；翻译展开用简单显隐。

### 屏幕清单

#### Screen A：精读详情页（`pages/dailyArticleDetail`，主改造对象）
- 目的：完整呈现一篇精读。
- 关键信息：标题（中/英）、元信息条、迷你播放器、中英正文、总结、重点词汇、长难句、表达句型。
- 主操作：播放控制、逐段/全局翻译切换。
- 次操作：拖动进度、切换倍速。
- 空状态：各模块按数据有无独立隐藏。
- 加载态：复用现有 `loading-spinner`。
- 错误态：复用现有「外刊不存在 + 重试」。
- 响应式：rpx 自适应；长单词/长音标不撑破卡片（必要时换行）。

#### Screen B：列表页（`pages/dailyArticles`）
- 本次维持现状，不改动。

### 无障碍 / 健壮性
- 触控目标：播放/暂停、倍速、翻译入口不小于 `64rpx` 高。
- 内容长度健壮性：音标、词性、例句缺省不塌陷；超长英文正文自动换行。
- 对比度：正文文字与背景保持现有可读对比。

---

## 8. 数据模型

### Entity: DailyArticle（扩展）
- 现有：id, title, titleZh, audioUrl, summary, vocabulary(JSON), expressions(JSON), status, publishedDate, createdAt, updatedAt。
- 新增：difficultyStars(TINYINT,可空), wordCount(INT,可空), sourceName(VARCHAR200,可空), keySentences(JSON,可空)。
- 校验：title 非空；difficultyStars 取值 1-5。

### Entity: DailyArticleParagraph（不变）
- id, articleId, sortOrder, contentEn, contentZh。

### JSON 子结构约定
- vocabulary 项：word, phoneticUk, phoneticUs, pos, meaning, example, exampleZh。
- expressions 项：expression, meaning, example, exampleZh（维持现状渲染）。
- keySentences 项：sentence, translation, analysis。
- 兼容规则：前端 `normalizeStudyItem` 升级为兼容新旧字段。

---

## 9. 集成与外部服务
- 音频：`audioUrl` 为文章自带的完整外链 url，小程序 `wx.createInnerAudioContext` 播放，`resolveAudioUrl` 对绝对 url 原样返回。失败时 toast 并复位，无重试风暴。
- 无第三方实时依赖。

---

## 10. 技术偏好与约束
- 前端：原生微信小程序（WXML/WXSS/JS），沿用现有组件与 `utils/api.js`、`utils/audio.js` 风格，新增播放器逻辑内联在页面或抽到 `utils`。
- 后端：Spring Boot 3.2.5 + JPA，`ddl-auto: update` 自动加列。
- 数据库：MySQL，JSON 列存数组字段。
- 部署目标：现有后端服务，不新增基础设施。
- 鉴权：沿用 JWT；详情接口要求登录。
- 禁止：不新增管理后台、不引入新前端框架。
- 复用：`import_daily_english_wordbook.java` 的导入脚本范式、`doc/generated` 的 JSON 落盘约定。

---

## 11. 非功能需求
- 性能：详情页单次请求加载，正文长度可达千词级需流畅滚动；音频边下边播。
- 可靠性：音频实例在页面销毁时必须释放，杜绝后台续播与多实例。
- 安全：详情接口校验登录态；新增字段不引入敏感数据。
- 兼容：旧外刊数据（无新字段）必须正常展示，不报错。
- 设备：微信小程序主流机型，rpx 适配。

---

## 12. 运营
- 内容运营：全部走脚本导入，无后台。
- 推送：沿用 `DailyArticlePublishScheduler` 每日挑选 `ENABLED` 且未推送的文章；脚本也可直接写 `publishedDate`。

---

## 13. 验收与测试

### 功能级验收
- 精读详情六大模块按数据有无正确显隐。
- 逐段翻译与全局开关协同正确。
- 迷你播放器播放/暂停/拖动/倍速（含 2.0）/释放全部达标。
- 重点词汇与长难句新结构正确渲染且向后兼容。
- 导入脚本写入一篇完整精读并通过校验。

### 建议测试覆盖
- 单元（后端）：DailyArticleService 详情组装含新字段；JSON 序列化。
- 集成（后端）：`GET /api/daily-articles/{id}` 返回新字段；旧数据 null 安全。
- 端到端（小程序）：手动用真机/模拟器验证播放器生命周期与翻译交互（小程序无自动化测试框架时以手测为准并记录）。

---

## 14. 假设
- 详情对所有登录用户开放，不加会员门槛（已确认）。
- 段落级翻译状态用每段 `showZh` 维护，全局开关批量切换。
- 音频为整段外链文件，不做句子级时间戳同步。
- 导入沿用「JSON 文件 + Java 脚本」范式，由内容方维护 JSON 产出。
- `ddl-auto: update` 可安全添加新列（与现有工程一致）。

---

## 15. 待确认问题
- 无（第 15 节问题已全部确认关闭）。

---

## 附录：已确认决策记录
- 核心目标：升级详情/精读页，首页入口保持现状。
- 翻译交互：逐段点击 + 顶部一键全显/全隐。
- 音频：真正的迷你播放器，倍速含 2.0，引用文章自带 url。
- 附加模块：长难句解析纳入 v1。
- 表达句型：维持现状。
- 列表卡片增强（FR-7）：移出 v1，归入 Later。
- 会员门槛：不需要。
- 数据格式：由本规格定义 JSON 与数据库字段。
