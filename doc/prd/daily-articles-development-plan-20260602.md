# 每日外刊模块开发计划

> 日期：2026-06-02
> 依据文档：`doc/prd/daily-articles-requirements-20260602.md`
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
  - `doc/prd/daily-articles-requirements-20260602.md`
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- 小程序端沿用原生 WXML/WXSS/JS，通过 `xiaochengxu/miniprogram/utils/api.js` 和 `utils/request.js` 直连 Spring Boot REST API。
- PC 端只实现管理后台，沿用 Next.js App Router、React Query、Tailwind CSS、Radix UI、Lucide React。
- 认证沿用现有 JWT 和 `SecurityConfig`。
- 文件访问沿用现有 `/uploads/**` 静态资源映射和 `app.upload.dir` 配置。
- 长文本按段落拆表存储，不把整篇正文塞入主表 JSON。
- 音频文件不存数据库 BLOB，只保存外部 URL 或上传后的访问 URL。
- 功能使用端是微信小程序：首页入口、学习中心入口、列表页、详情页。
- PC 不新增普通用户阅读页；PC 只新增管理员外刊管理页。
- 每日推送逻辑集中放在 service，定时任务和手动触发复用同一方法。

---

## 2. 交付目标

### V1 完成标志

1. 小程序首页存在“每日外刊”入口。
2. 小程序学习中心存在“每日外刊”入口。
3. 未登录用户点击入口会进入登录引导或登录页。
4. 登录用户可以进入小程序每日外刊列表页。
5. 外刊列表默认展示未读文章。
6. 外刊列表可以切换已读文章。
7. 外刊列表展示英文标题、中文标题和更新日期，并按更新日期倒序排列。
8. 外刊列表支持下拉刷新和触底分页。
9. 用户进入外刊详情页后，该文章被标记为已读。
10. 外刊详情页顶部展示音频播放器；无音频时不展示空播放器。
11. 外刊详情页按段落展示英文正文。
12. 中文翻译按钮可以显示和隐藏逐段中文翻译。
13. 文章总结、重点词汇和表达句型展示在正文下方；空字段不展示对应区块。
14. 相对音频 URL 在小程序中能补全为可播放地址。
15. PC 管理员可以新增、编辑、启用、禁用外刊。
16. PC 管理员可以填写音频 URL，或上传音频文件并保存上传后的 URL。
17. PC 管理员可以手动触发今日外刊。
18. 后端每天早上 6 点自动随机推送一篇未推送且启用的外刊。
19. 今日已有外刊时，定时任务和手动触发都不会重复推送。
20. 没有候选外刊时，任务正常结束并给出明确日志或提示。

---

## 3. 任务总览

### Phase 0：现状确认与实施边界

### Phase 1：后端数据模型与 DTO

### Phase 2：后端 Repository 与核心 Service

### Phase 3：后端小程序用户端 API

### Phase 4：后端 PC 管理端 API 与音频上传

### Phase 5：每日推送定时任务

### Phase 6：小程序 API 封装与页面注册

### Phase 7：小程序首页和学习中心入口

### Phase 8：小程序外刊列表页

### Phase 9：小程序外刊详情页

### Phase 10：PC 管理后台页面

### Phase 11：测试、联调与体验验收

### Phase 12：文档同步与上线准备

---

## 4. Phase 0：现状确认与实施边界

### 4.1 阅读后端结构

任务：

- 阅读安全与上传配置：
  - `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
  - `src/main/java/com/xiaoyouyingyu/config/WebMvcConfig.java`
  - `src/main/resources/application.yml`
- 阅读现有模块分层：
  - `src/main/java/com/xiaoyouyingyu/controller/WordPracticeController.java`
  - `src/main/java/com/xiaoyouyingyu/controller/AdminWordBookController.java`
  - `src/main/java/com/xiaoyouyingyu/service/WordBookService.java`
  - `src/main/java/com/xiaoyouyingyu/entity/WordBook.java`
  - `src/main/java/com/xiaoyouyingyu/repository/WordBookRepository.java`
- 阅读异常处理：
  - `src/main/java/com/xiaoyouyingyu/controller/ApiExceptionHandler.java`

产出：

- 明确用户端建议使用 `DailyArticleController`。
- 明确管理端建议使用 `AdminDailyArticleController`。
- 明确上传音频复用现有 `uploads` 目录。
- 明确需要对 `Application.java` 增加 `@EnableScheduling`。

### 4.2 阅读小程序结构

任务：

- 阅读：
  - `xiaochengxu/miniprogram/app.json`
  - `xiaochengxu/miniprogram/app.js`
  - `xiaochengxu/miniprogram/utils/request.js`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/auth.js`
  - `xiaochengxu/miniprogram/utils/audio.js`
  - `xiaochengxu/miniprogram/pages/home/*`
  - `xiaochengxu/miniprogram/pages/learning/*`
  - `xiaochengxu/miniprogram/pages/wordBooks/*`
  - `xiaochengxu/miniprogram/pages/wordDetail/*`
  - `xiaochengxu/miniprogram/components/loading/*`
  - `xiaochengxu/miniprogram/components/empty-state/*`

产出：

- 明确小程序入口卡片放在首页和学习中心哪个区域。
- 明确每日外刊页面注册路径：
  - `pages/dailyArticles/index`
  - `pages/dailyArticleDetail/index`
- 明确音频播放复用 `utils/audio.js`，还是使用页面内 `wx.createInnerAudioContext`。

### 4.3 阅读 PC 管理后台结构

任务：

- 阅读：
  - `frontend/src/lib/api.ts`
  - `frontend/src/lib/auth.tsx`
  - `frontend/src/app/admin/page.tsx`
  - `frontend/src/app/admin/word-books/page.tsx`
  - `frontend/src/components/sidebar.tsx`
  - `frontend/src/components/toast-provider.tsx`

产出：

- 明确管理入口使用独立路由 `/admin/daily-articles`。
- 确认不新增 PC 普通用户阅读页面。

验收：

- 输出当前实现所需新增文件清单。
- 确认小程序是功能使用端，PC 是管理端。

---

## 5. Phase 1：后端数据模型与 DTO

### 5.1 新增枚举

建议新增：

- `DailyArticleStatus`
  - `DRAFT`
  - `ENABLED`
  - `DISABLED`

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/DailyArticleStatus.java`

### 5.2 新增实体：DailyArticle

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/DailyArticle.java`

建议字段：

- `id: Long`
- `title: String`
- `titleZh: String`
- `audioUrl: String`
- `summary: String`
- `vocabulary: String`
- `expressions: String`
- `status: DailyArticleStatus`
- `publishedDate: LocalDate`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

字段建议：

- `title` 映射 `VARCHAR(300)`。
- `titleZh` 映射 `VARCHAR(300)`。
- `audioUrl` 映射 `VARCHAR(1000)`。
- `summary` 使用 `@Lob` 或 `TEXT`。
- `vocabulary` 和 `expressions` 可先用 `@Column(columnDefinition = "json") String`，保持与现有 JSON 字符串处理风格兼容。
- `status` 使用 `@Enumerated(EnumType.STRING)`，默认 `DRAFT`。
- `createdAt` 创建时写入。
- `updatedAt` 创建和更新时写入。

索引建议：

- `published_date`
- `status, published_date`

验收：

- JPA 能创建或更新 `daily_articles` 表。
- 主表不包含正文长文本字段。
- 音频只保存 URL。

### 5.3 新增实体：DailyArticleParagraph

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/DailyArticleParagraph.java`

建议字段：

- `id: Long`
- `articleId: Long`
- `sortOrder: Integer`
- `contentEn: String`
- `contentZh: String`

索引建议：

- `article_id, sort_order`

验收：

- 段落按 `articleId` 和 `sortOrder` 可稳定排序。
- 英文段落和中文翻译在同一条记录中保存。

### 5.4 新增实体：DailyArticleRead

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/DailyArticleRead.java`

建议字段：

- `id: Long`
- `articleId: Long`
- `userId: Long`
- `readAt: LocalDateTime`

约束建议：

- `article_id + user_id` 唯一。
- `user_id` 建索引。

验收：

- 同一用户重复进入同一篇外刊详情时不会生成重复阅读记录。
- 不同用户阅读状态互不影响。

### 5.5 新增 DTO

建议目录：

- `src/main/java/com/xiaoyouyingyu/dto/dailyarticle/`

建议 DTO：

- `DailyArticleListItemResponse`
- `DailyArticleDetailResponse`
- `DailyArticleParagraphRequest`
- `DailyArticleParagraphResponse`
- `DailyArticleSaveRequest`
- `DailyArticleStatusRequest`
- `AdminDailyArticleListItemResponse`
- `DailyArticlePublishResponse`
- `DailyArticleAudioUploadResponse`

验收：

- 小程序列表 DTO 不返回未推送管理字段。
- 小程序详情 DTO 返回段落、总结、词汇、句型和 `read`。
- 管理端 DTO 返回状态、是否已推送、创建时间、更新时间等管理字段。

---

## 6. Phase 2：后端 Repository 与核心 Service

### 6.1 新增 Repository

建议文件：

- `src/main/java/com/xiaoyouyingyu/repository/DailyArticleRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/DailyArticleParagraphRepository.java`
- `src/main/java/com/xiaoyouyingyu/repository/DailyArticleReadRepository.java`

建议查询能力：

`DailyArticleRepository`：

- 按 `publishedDate IS NOT NULL` 分页倒序查询。
- 按阅读状态查询当前用户未读或已读文章。
- 查询今日是否已有外刊。
- 查询候选文章：`status = ENABLED AND publishedDate IS NULL`。
- 管理端按状态、是否已推送分页查询。

`DailyArticleParagraphRepository`：

- 按 `articleId` 查询并按 `sortOrder ASC` 排序。
- 删除某文章的全部段落。

`DailyArticleReadRepository`：

- 判断 `articleId + userId` 是否存在。
- 按 `articleId + userId` 查询。
- 保存阅读记录。

验收：

- 列表分页查询可区分已读和未读。
- 候选推送查询不包含草稿、禁用和已推送文章。

### 6.2 新增 Service：DailyArticleService

建议文件：

- `src/main/java/com/xiaoyouyingyu/service/DailyArticleService.java`

建议方法：

- `Page<DailyArticleListItemResponse> listForUser(username, readStatus, pageable)`
- `DailyArticleDetailResponse getDetailForUser(username, articleId)`
- `Page<AdminDailyArticleListItemResponse> listForAdmin(status, published, pageable)`
- `DailyArticleDetailResponse getDetailForAdmin(articleId)`
- `DailyArticleDetailResponse create(DailyArticleSaveRequest request)`
- `DailyArticleDetailResponse update(Long id, DailyArticleSaveRequest request)`
- `void updateStatus(Long id, DailyArticleStatus status)`
- `DailyArticlePublishResponse publishTodayManually()`
- `DailyArticlePublishResponse publishTodayIfNeeded(String triggerSource)`
- `String saveAudio(MultipartFile file)`

关键业务规则：

- 小程序用户端只能访问 `publishedDate IS NOT NULL` 的文章。
- 用户进入详情时写入阅读记录。
- 阅读记录写入必须幂等。
- 管理端保存段落时建议整体替换该文章段落，再按请求顺序写入。
- 保存段落时重新整理 `sortOrder`，避免前端传入重复或跳号顺序。
- `publishTodayIfNeeded` 要检查今日是否已有外刊。
- `publishTodayIfNeeded` 只从 `ENABLED` 且 `publishedDate IS NULL` 中随机选择。
- `publishTodayIfNeeded` 使用事务。

验收：

- 用户无法查看未推送文章详情。
- 管理员可以编辑已推送文章内容，但不会清空 `publishedDate`。
- 手动触发和定时任务复用同一推送方法。

---

## 7. Phase 3：后端小程序用户端 API

### 7.1 新增 Controller：DailyArticleController

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/DailyArticleController.java`

接口：

- `GET /api/daily-articles`
- `GET /api/daily-articles/{id}`

权限：

- `SecurityConfig` 中增加：
  - `/api/daily-articles/**`：`authenticated()`

注意：

- 当前 `.anyRequest().authenticated()` 已能兜底，但仍建议显式添加，便于后续维护。
- 该接口主要供小程序调用，也可被其他登录端复用。

### 7.2 GET `/api/daily-articles`

查询参数：

- `status`: `unread` 或 `read`，默认 `unread`。
- `page`: 默认 `0`。
- `size`: 默认 `10`。

实现要点：

- 从 `Authentication` 读取 username。
- 通过 `UserRepository` 找到当前用户 ID。
- 只返回 `publishedDate IS NOT NULL` 的文章。
- 按 `publishedDate DESC` 排序。
- `unread` 查询无阅读记录文章。
- `read` 查询有阅读记录文章。

验收：

- 未登录返回 401。
- 登录用户默认看到未读。
- 已读和未读互斥。

### 7.3 GET `/api/daily-articles/{id}`

实现要点：

- 从 `Authentication` 读取 username。
- 检查文章存在且 `publishedDate IS NOT NULL`。
- 写入阅读记录。
- 返回详情和 `read = true`。
- 按 `sortOrder ASC` 返回段落。

验收：

- 首次进入详情会新增阅读记录。
- 重复进入详情不会重复插入。
- 未推送文章对普通用户不可见。

---

## 8. Phase 4：后端 PC 管理端 API 与音频上传

### 8.1 新增 Controller：AdminDailyArticleController

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/AdminDailyArticleController.java`

接口：

- `GET /api/admin/daily-articles`
- `GET /api/admin/daily-articles/{id}`
- `POST /api/admin/daily-articles`
- `PUT /api/admin/daily-articles/{id}`
- `PUT /api/admin/daily-articles/{id}/status`
- `POST /api/admin/daily-articles/upload-audio`
- `POST /api/admin/daily-articles/publish-today`

权限：

- 复用现有 `/api/admin/**` 的 `ROLE_ADMIN` 限制。

### 8.2 管理端列表

查询参数：

- `status`: 可选，`DRAFT` / `ENABLED` / `DISABLED`。
- `published`: 可选，`true` / `false`。
- `page`
- `size`

返回字段：

- `id`
- `title`
- `titleZh`
- `status`
- `published`
- `publishedDate`
- `createdAt`
- `updatedAt`

验收：

- 管理员可按状态筛选。
- 管理员可区分未推送和已推送。

### 8.3 新增与编辑

实现要点：

- 请求体允许字段为空。
- `status` 为空时默认保存为 `DRAFT`。
- 段落数组为空时允许保存。
- 保存时将段落按数组顺序写入，`sortOrder` 从 1 开始。
- `vocabulary` 和 `expressions` 可按 JSON 字符串保存，后端不做复杂语义校验。
- 若启用时没有英文标题或英文段落，可给出警告型提示；如果接口没有警告机制，可先不阻止保存。

验收：

- 管理员能保存不完整草稿。
- 管理员能编辑段落并保持顺序。
- 已推送文章编辑后仍保留原 `publishedDate`。

### 8.4 音频上传

实现要点：

- 上传目录建议：`${app.upload.dir}/daily-articles/`。
- 访问 URL 建议：`/uploads/daily-articles/<filename>`。
- 允许类型建议：
  - `audio/mpeg`
  - `audio/mp3`
  - `audio/wav`
  - `audio/x-wav`
  - `audio/mp4`
  - `audio/aac`
- 文件大小建议先限制为 50 MB。
- 文件名使用时间戳、随机字符串或 UUID，不直接使用用户原文件名。

验收：

- 上传成功返回 `audioUrl`。
- 非管理员上传返回 403。
- 非音频文件上传失败。
- 超出大小限制上传失败。

### 8.5 手动触发今日外刊

实现要点：

- 调用 `DailyArticleService.publishTodayIfNeeded("MANUAL")`。
- 今日已有外刊时返回“今日外刊已存在”。
- 无候选外刊时返回“没有可推送的外刊”。
- 成功时返回文章 ID 和发布日期。

验收：

- 管理员可触发。
- 非管理员不可触发。
- 不会重复生成今日外刊。

---

## 9. Phase 5：每日推送定时任务

### 9.1 启用调度

任务：

- 在 `src/main/java/com/xiaoyouyingyu/Application.java` 增加 `@EnableScheduling`。
- 保留现有 `@EnableAsync`。

验收：

- 应用启动后 Spring 能扫描并执行 `@Scheduled` 任务。

### 9.2 新增定时任务类

建议文件：

- `src/main/java/com/xiaoyouyingyu/service/DailyArticlePublishScheduler.java`

实现：

```java
@Scheduled(cron = "0 0 6 * * *", zone = "Asia/Shanghai")
public void publishToday() {
    dailyArticleService.publishTodayIfNeeded("SCHEDULED");
}
```

日志要求：

- 今日已有外刊。
- 无候选文章。
- 推送成功。
- 推送失败。

验收：

- Cron 表达式和时区正确。
- 调度方法不直接写复杂业务逻辑。

---

## 10. Phase 6：小程序 API 封装与页面注册

### 10.1 扩展 `xiaochengxu/miniprogram/utils/api.js`

新增方法：

- `getDailyArticles(params)`
- `getDailyArticle(id)`

建议参数：

- `getDailyArticles({ status = 'unread', page = 0, size = 10 })`

实现要点：

- 复用 `utils/request.js`。
- 不在页面里直接写 `wx.request`。
- 401 由现有 request 封装处理并跳转登录。

验收：

- 小程序页面只调用 `api.js`。
- token 自动携带。

### 10.2 注册小程序页面

修改文件：

- `xiaochengxu/miniprogram/app.json`

新增页面：

- `pages/dailyArticles/index`
- `pages/dailyArticleDetail/index`

新增文件：

- `xiaochengxu/miniprogram/pages/dailyArticles/index.js`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.wxml`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.wxss`
- `xiaochengxu/miniprogram/pages/dailyArticles/index.json`
- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.js`
- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxml`
- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.wxss`
- `xiaochengxu/miniprogram/pages/dailyArticleDetail/index.json`

验收：

- 页面可通过 `wx.navigateTo` 打开。
- 页面标题正确。

### 10.3 音频 URL 补全工具

建议：

- 在 `utils/audio.js` 或 `utils/util.js` 增加 `resolveMediaUrl(url)`。
- 如果 URL 以 `http://` 或 `https://` 开头，直接返回。
- 如果 URL 以 `/uploads/` 开头，使用 `app.globalData.baseUrl` 去掉末尾 `/api` 后拼接。

示例：

```text
baseUrl = https://xiaoyou-ky.top/api
audioUrl = /uploads/daily-articles/a.mp3
resolved = https://xiaoyou-ky.top/uploads/daily-articles/a.mp3
```

验收：

- 外部 URL 可播放。
- 后端上传返回的相对 URL 可播放。

---

## 11. Phase 7：小程序首页和学习中心入口

### 11.1 首页入口

修改文件：

- `xiaochengxu/miniprogram/pages/home/index.js`
- `xiaochengxu/miniprogram/pages/home/index.wxml`
- `xiaochengxu/miniprogram/pages/home/index.wxss`

实现要点：

- 增加“每日外刊”入口卡片或功能按钮。
- 使用现有首页视觉风格。
- 点击时先检查登录。
- 未登录跳转 `pages/login/index` 或使用现有登录引导方式。
- 已登录跳转 `pages/dailyArticles/index`。

验收：

- 首页能看到每日外刊入口。
- 未登录点击不能进入列表。
- 已登录点击跳转正确。

### 11.2 学习中心入口

修改文件：

- `xiaochengxu/miniprogram/pages/learning/index.js`
- `xiaochengxu/miniprogram/pages/learning/index.wxml`
- `xiaochengxu/miniprogram/pages/learning/index.wxss`

实现要点：

- 增加“每日外刊”入口。
- 注意每日外刊只要求登录，不要求会员。
- 不复用学习中心学习详情的会员拦截逻辑。

验收：

- 普通登录用户能从学习中心进入每日外刊。
- 非会员用户不会被拦截。

---

## 12. Phase 8：小程序外刊列表页

### 12.1 页面状态

建议 data：

- `activeTab: 'unread' | 'read'`
- `articles: []`
- `page: 0`
- `size: 10`
- `totalPages: 0`
- `loading: false`
- `loadingMore: false`
- `refreshing: false`
- `error: ''`
- `hasMore: true`

### 12.2 加载逻辑

实现要点：

- `onLoad` 默认加载未读。
- tab 切换时重置 `page` 和 `articles`。
- 下拉刷新重新加载当前 tab 第一页。
- 触底加载下一页。
- 接口失败时保留当前数据并展示错误提示。

### 12.3 列表 UI

展示字段：

- 英文标题。
- 中文标题。
- 更新日期。

交互：

- 点击列表项跳转：
  - `pages/dailyArticleDetail/index?id=<articleId>`
- 详情页返回后，列表页需要刷新当前 tab，确保已读状态变化。
  - 可在 `onShow` 中根据标记刷新。
  - 或详情页返回时通过事件通道通知。

验收：

- 默认展示未读 tab。
- 切换已读 tab 后展示已读列表。
- 点击进入详情后返回，文章从未读移动到已读。
- 空状态正确。
- 下拉刷新和分页正确。

---

## 13. Phase 9：小程序外刊详情页

### 13.1 页面状态

建议 data：

- `id`
- `article`
- `paragraphs`
- `showTranslation: false`
- `audioUrl`
- `loading`
- `error`
- `vocabulary`
- `expressions`

### 13.2 详情加载

实现要点：

- `onLoad` 读取 `id`。
- 调用 `api.getDailyArticle(id)`。
- 后端返回成功即已标记已读。
- 解析 `vocabulary` 和 `expressions`：
  - 如果后端返回数组，直接使用。
  - 如果后端返回字符串，尝试 `JSON.parse`。
  - 解析失败时置为空数组，不影响正文。
- 补全 `audioUrl`。

验收：

- 详情加载成功。
- 阅读记录已写入。
- 词汇和句型解析失败时页面不崩。

### 13.3 音频播放

实现选择：

- 可使用原生 `<audio>` 组件。
- 也可复用现有 `utils/audio.js` 播放工具。

要求：

- 音频显示在正文上方。
- 无音频时不显示播放器。
- 播放失败时提示“音频暂时无法播放”，正文仍可阅读。

验收：

- 外部音频 URL 可播放。
- `/uploads/...` 相对 URL 可播放。

### 13.4 翻译切换

实现要点：

- 页面右上方提供“中文翻译”按钮。
- 默认隐藏中文翻译。
- 点击后，在每段英文下方显示对应 `contentZh`。
- 再次点击隐藏翻译。
- 某段没有中文翻译时，该段不展示中文区域。

验收：

- 翻译默认隐藏。
- 翻译切换稳定。
- 翻译不遮挡英文正文。

### 13.5 学习内容展示

展示顺序：

1. 文章总结。
2. 重点词汇。
3. 表达句型。

空字段规则：

- `summary` 为空时不展示总结区块。
- `vocabulary` 为空数组时不展示重点词汇区块。
- `expressions` 为空数组时不展示表达句型区块。

验收：

- 内容完整时展示正确。
- 空内容时页面仍自然。

---

## 14. Phase 10：PC 管理后台页面

### 14.1 PC API 封装

修改文件：

- `frontend/src/lib/api.ts`

新增类型：

- `DailyArticleParagraph`
- `DailyArticleDetail`
- `DailyArticleSavePayload`
- `AdminDailyArticleListItem`
- `DailyArticlePublishResult`

新增方法：

- `adminGetDailyArticles(params)`
- `adminGetDailyArticle(id)`
- `adminCreateDailyArticle(payload)`
- `adminUpdateDailyArticle(id, payload)`
- `adminUpdateDailyArticleStatus(id, status)`
- `adminUploadDailyArticleAudio(file)`
- `adminPublishTodayDailyArticle()`

注意：

- PC 不需要新增普通用户 `getDailyArticles` 页面方法，除非前端管理页复用详情类型。
- 上传接口使用 `FormData`，不要设置 JSON `Content-Type`。

### 14.2 新增管理路由

建议文件：

- `frontend/src/app/admin/daily-articles/page.tsx`

修改文件：

- `frontend/src/components/sidebar.tsx`

新增管理员导航项：

- `href: '/admin/daily-articles'`
- `label: '外刊管理'`
- `adminOnly: true`

验收：

- 管理员可以从侧边栏进入外刊管理。
- 非管理员看不到该入口。

### 14.3 管理端列表

实现要点：

- 表格展示：
  - 英文标题
  - 中文标题
  - 状态
  - 是否已推送
  - 更新日期
  - 创建时间
  - 操作
- 支持状态筛选：
  - 全部
  - 草稿
  - 启用
  - 禁用
- 支持推送筛选：
  - 全部
  - 未推送
  - 已推送
- 操作：
  - 新增外刊
  - 编辑
  - 启用
  - 禁用
  - 生成今日外刊

验收：

- 管理员能看到外刊列表。
- 筛选条件能生效。
- 点击编辑能加载详情表单。

### 14.4 新增/编辑表单

字段：

- 英文标题。
- 中文标题。
- 音频 URL。
- 音频上传按钮。
- 状态。
- 正文段落列表：
  - 英文段落。
  - 中文翻译段落。
  - 新增段落。
  - 删除段落。
  - 上移/下移。
- 文章总结。
- 重点词汇。
- 表达句型。

推荐 v1 表单策略：

- 段落使用结构化列表编辑。
- 重点词汇和表达句型可以先用结构化小表单。
- 如果工期紧，词汇和句型可先使用 JSON textarea，但必须提供格式提示和解析校验。

验收：

- 保存草稿不要求字段完整。
- 上传音频后自动回填音频 URL。
- 编辑段落顺序后保存正确。
- 启用和禁用状态可保存。

### 14.5 手动触发今日外刊

实现要点：

- 在列表页顶部提供“生成今日外刊”按钮。
- 点击后弹出确认。
- 成功后刷新列表。
- 今日已有外刊时 toast 提示。
- 无候选外刊时 toast 提示。

验收：

- 成功触发后列表出现今日更新。
- 重复触发不会新增第二篇。

---

## 15. Phase 11：测试、联调与体验验收

### 15.1 后端测试

重点测试：

- `DailyArticleService.publishTodayIfNeeded`
  - 今日已有外刊。
  - 无候选外刊。
  - 单个候选外刊。
  - 多个候选外刊。
  - 草稿和禁用文章不入候选。
  - 已推送文章不入候选。
- `DailyArticleService.getDetailForUser`
  - 首次进入写阅读记录。
  - 重复进入不重复写记录。
  - 未推送文章不可访问。
- Controller 权限：
  - 游客访问 `/api/daily-articles` 返回 401。
  - 登录用户访问用户端接口成功。
  - 普通用户访问 `/api/admin/daily-articles` 返回 403。
  - 管理员访问管理端接口成功。

验收：

- 后端核心业务规则有测试覆盖。
- Maven 测试通过或记录不可运行原因。

### 15.2 小程序联调

建议流程：

1. 管理员登录 PC。
2. 新增 3 篇外刊，其中 2 篇启用，1 篇禁用。
3. 手动触发今日外刊。
4. 普通用户登录小程序。
5. 从小程序首页进入每日外刊。
6. 确认未读列表有今日文章。
7. 进入详情。
8. 确认音频、英文正文、翻译按钮、总结、词汇、句型展示正确。
9. 返回列表。
10. 确认该文章进入已读 tab。
11. 从小程序学习中心进入每日外刊。
12. 确认普通登录用户不被会员权限拦截。
13. 管理员重复触发今日外刊。
14. 确认提示今日外刊已存在。

验收：

- 完成一轮端到端闭环。
- 小程序页面无明显布局溢出。
- 空状态和错误状态可见。
- 音频可播放。

### 15.3 PC 管理后台联调

检查页面：

- `/admin/daily-articles`

检查重点：

- 表格布局不溢出。
- 长标题显示合理。
- 段落编辑可用。
- 上传音频后 URL 回填。
- 手动触发结果 toast 清楚。

---

## 16. Phase 12：文档同步与上线准备

### 16.1 文档同步

实现完成后同步更新：

- `doc/backend.md`
  - 增加 `DailyArticleController`
  - 增加 `AdminDailyArticleController`
  - 增加 `DailyArticleService`
  - 增加定时任务说明
- `doc/frontend.md`
  - 只增加 PC 管理后台 `/admin/daily-articles`
  - 明确 PC 不提供普通用户外刊阅读页
- `doc/miniapp.md`
  - 增加 `pages/dailyArticles/index`
  - 增加 `pages/dailyArticleDetail/index`
  - 增加首页和学习中心入口说明
  - 增加 `utils/api.js` 每日外刊接口封装
- `doc/api-and-data-model.md`
  - 增加 `daily_articles`
  - 增加 `daily_article_paragraphs`
  - 增加 `daily_article_reads`
  - 增加用户端和管理端 API
- `doc/prd/daily-articles-requirements-20260602.md`
  - 如实现中调整了接口或字段，需要回写最终版本。

### 16.2 上线前检查

检查项：

- `app.upload.dir` 在生产环境可写。
- `/uploads/**` 在生产环境可访问。
- 小程序合法域名包含后端接口域名和音频资源域名。
- 上传音频大小限制符合服务器配置。
- 服务器时区或定时任务 zone 确认为 `Asia/Shanghai`。
- 数据库 schema 已生成或迁移完成。
- `@EnableScheduling` 已启用。
- PC 管理员能看到外刊管理入口。
- 小程序 `app.json` 页面注册正确。

---

## 17. 推荐实现顺序

1. 后端实体、Repository、DTO。
2. `DailyArticleService` 保存、列表、详情、阅读记录。
3. 小程序用户端 Controller。
4. PC 管理端 Controller。
5. 音频上传。
6. 手动触发今日外刊。
7. 定时任务和 `@EnableScheduling`。
8. 小程序 `utils/api.js` 方法和页面注册。
9. 小程序首页、学习中心入口。
10. 小程序外刊列表页。
11. 小程序外刊详情页。
12. PC 管理后台 API 封装。
13. PC 管理后台外刊列表和编辑表单。
14. 后端测试。
15. 小程序联调和 PC 管理后台联调。
16. 文档同步。

---

## 18. 风险与处理建议

### 18.1 学习中心会员拦截误伤

风险：

- 当前学习中心部分功能限制会员，每日外刊要求所有登录用户可用。

建议：

- 每日外刊独立页面和独立接口使用 `authenticated()`。
- 学习中心入口点击时只判断登录，不判断会员。

### 18.2 小程序音频 URL 播放失败

风险：

- 后端上传返回 `/uploads/...` 相对路径，小程序不能直接播放相对路径。

建议：

- 小程序统一做媒体 URL 补全。
- 上线前确认资源域名在微信小程序合法域名中。

### 18.3 阅读状态查询复杂度

风险：

- 未读和已读列表需要结合当前用户阅读记录，查询写法容易出现分页不准。

建议：

- Repository 使用明确的 JPQL 或 native query。
- 用集成测试覆盖同一用户、不同用户、已读和未读的分页结果。

### 18.4 定时任务重复发布

风险：

- 手动触发和定时任务同时执行时，可能同一天发布两篇。

建议：

- 推送方法加事务。
- 方法开始和更新前双重检查今日文章。
- 如未来要求更强一致性，再增加 `published_date` 唯一约束或数据库锁。

### 18.5 PC 管理表单过长

风险：

- 外刊正文、翻译、词汇、句型都在一个表单里，页面容易笨重。

建议：

- 分区展示：基础信息、音频、正文段落、学习内容。
- 段落编辑使用可增删的重复块。
- 词汇和句型 v1 可先结构化列表或 JSON textarea，后续再优化编辑体验。

---

## 19. 最小可交付切片

如果需要先快速上线一个最小版本，建议按以下切片交付：

1. 后端三张表、用户端列表/详情、阅读记录。
2. PC 管理端新增/编辑外刊，只支持音频 URL，不做上传。
3. 手动触发今日外刊。
4. 小程序 `utils/api.js`、首页入口、列表页、详情页。
5. 再补学习中心入口、音频上传和每日 6 点定时任务。

该切片可以先验证小程序阅读闭环，但完整 v1 仍必须补齐学习中心入口、音频上传和定时任务。
