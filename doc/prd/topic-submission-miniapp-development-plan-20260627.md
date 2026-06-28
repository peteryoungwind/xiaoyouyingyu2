# 小程序用户提交话题功能开发计划

> 日期：2026-06-27  
> 依据文档：`doc/prd/topic-submission-miniapp-requirements-20260627.md`  
> 参考原型：`prototype/topic-submission-entry/`  
> 目标读者：后续负责实现的 AI 编码代理或开发者

---

## 1. 实施原则

- 在改代码前先阅读：
  - `AGENTS.md`
  - `doc/frontend.md`
  - `doc/prd/topic-submission-miniapp-requirements-20260627.md`
  - `prototype/topic-submission-entry/pages/01-miniapp-home-entry.html`
  - `prototype/topic-submission-entry/pages/02-miniapp-topics-entry.html`
  - `prototype/topic-submission-entry/pages/03-miniapp-submit-flow.html`
  - `prototype/topic-submission-entry/pages/05-admin-submissions.html`
- 后端沿用 Java 21、Spring Boot 3.2.5、Spring Security、Spring Data JPA、MySQL、Lombok。
- PC 管理后台沿用现有 Next.js 14、React、TypeScript、Tailwind CSS、TanStack React Query。
- 小程序沿用原生 WXML/WXSS/JS，通过 `xiaochengxu/miniprogram/utils/api.js` 和 `utils/request.js` 调用 Spring Boot API。
- 首页只允许把现有 `hero-card` 改为两张轮播图；首页其它模块、顺序、条件展示逻辑必须保持不变：
  - 四个学习入口
  - 统计卡片
  - 热门标签
  - 最新主题
  - 会员提示
  - 底部提示
- V1 不实现“我的提交记录”。
- V1 不限制提交频率。
- V1 不支持游客提交。
- V1 不在管理员采纳后自动创建正式主题。
- V1 不向用户发送采纳通知。
- 管理后台只显示提交人的用户名，不显示用户 ID、密码哈希、token 等敏感信息。
- 实现完成后同步更新相关文档：
  - `doc/frontend.md`
  - 如项目存在后端/API 汇总文档，也同步补充接口和数据表说明。

---

## 2. 交付目标

### V1 完成标志

1. 首页顶部封面变成两张轮播，默认展示当前 Daily Practice。
2. 第二张轮播图展示提交话题入口，视觉与首页和谐，不像硬广告。
3. 首页除封面区域外，其它模块布局和数据展示保持原样。
4. 未登录用户点击“提交话题”进入登录引导。
5. 已登录用户点击“提交话题”进入提交话题页面。
6. 主题列表页展示“没有找到想练的话题？”辅助入口。
7. 已登录用户可提交话题标题、原因、分类、补充说明。
8. 标题为空时不能提交。
9. 提交成功后提示“提交成功，如被采纳会出现在主题库”。
10. 数据库保存用户提交记录，默认状态为 `PENDING`。
11. PC 管理后台新增“用户提交话题”入口。
12. 管理员可查看提交列表和详情。
13. 管理员可标记为 `ACCEPTED` 或 `REJECTED`。
14. 管理员采纳后只更新状态，不自动创建正式主题。
15. 普通用户和游客不能访问后台提交管理接口。
16. 后端、小程序、PC 后台关键路径完成测试或人工验收记录。

---

## 3. 任务总览

### Phase 0：现状确认与边界锁定

### Phase 1：数据库与后端领域模型

### Phase 2：后端用户提交 API

### Phase 3：后端管理员管理 API

### Phase 4：小程序 API 封装与页面注册

### Phase 5：小程序首页轮播改造

### Phase 6：小程序主题页辅助入口

### Phase 7：小程序提交话题页面

### Phase 8：PC 管理后台页面与导航

### Phase 9：权限、错误处理与体验打磨

### Phase 10：测试、联调与验收

### Phase 11：文档同步与上线准备

---

## 4. Phase 0：现状确认与边界锁定

### 4.1 阅读后端现有结构

任务：

- 阅读：
  - `src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
  - `src/main/java/com/xiaoyouyingyu/security/JwtFilter.java`
  - `src/main/java/com/xiaoyouyingyu/controller/TopicController.java`
  - `src/main/java/com/xiaoyouyingyu/controller/AdminController.java`
  - `src/main/java/com/xiaoyouyingyu/controller/ApiExceptionHandler.java`
  - `src/main/java/com/xiaoyouyingyu/entity/User.java`
  - `src/main/java/com/xiaoyouyingyu/repository/UserRepository.java`
  - `src/main/resources/schema.sql`
  - `src/main/resources/application.yml`
- 确认当前项目是否依赖 Hibernate `ddl-auto` 自动建表，还是已有 `schema.sql` 管理结构。
- 确认 Controller 返回结构风格：
  - 直接返回 Entity
  - 返回 DTO
  - 返回 `Map<String, Object>`
- 确认异常处理约定：
  - 参数错误使用 400
  - 未登录使用 401
  - 无权限使用 403
  - 找不到记录使用 404

产出：

- 明确后端新增文件清单。
- 明确是否需要手动维护 `schema.sql`。
- 明确接口响应风格，优先使用 DTO，避免向前端暴露 Entity 内部字段。

验收：

- 开发前列出后端改动点。
- 确认不会修改现有 `topics` 表语义。

### 4.2 阅读小程序首页、主题页和登录工具

任务：

- 阅读：
  - `xiaochengxu/miniprogram/app.json`
  - `xiaochengxu/miniprogram/pages/home/index.js`
  - `xiaochengxu/miniprogram/pages/home/index.wxml`
  - `xiaochengxu/miniprogram/pages/home/index.wxss`
  - `xiaochengxu/miniprogram/pages/topics/index.js`
  - `xiaochengxu/miniprogram/pages/topics/index.wxml`
  - `xiaochengxu/miniprogram/pages/topics/index.wxss`
  - `xiaochengxu/miniprogram/pages/login/index.*`
  - `xiaochengxu/miniprogram/utils/api.js`
  - `xiaochengxu/miniprogram/utils/request.js`
  - `xiaochengxu/miniprogram/utils/auth.js`
- 确认首页当前 `hero-card` 的点击行为是 `goToLearning`。
- 确认未登录跳转登录页的现有写法。
- 确认 `request.js` 是否自动带 token，以及未登录/401 的处理方式。

产出：

- 明确小程序新增页面路径，推荐：
  - `pages/topicSubmit/index`
- 明确首页只改 `hero-card` 区域，不动其它模块。
- 明确主题页横幅插入位置。

验收：

- 输出小程序新增/修改文件清单。
- 确认首页统计卡片和热门标签不会被删改。

### 4.3 阅读 PC 管理后台结构

任务：

- 阅读：
  - `frontend/src/app/admin/page.tsx`
  - `frontend/src/app/layout.tsx`
  - `frontend/src/components/sidebar.tsx`
  - `frontend/src/components/top-bar.tsx`
  - `frontend/src/lib/api.ts`
  - `frontend/src/lib/auth.tsx`
  - `frontend/src/components/toast-provider.tsx`
  - 已有后台子页面，例如：
    - `frontend/src/app/admin/daily-articles/page.tsx`
    - `frontend/src/app/admin/word-books/page.tsx`
    - `frontend/src/app/users/page.tsx`
- 确认后台导航添加入口的位置。
- 确认管理员权限在前端如何判断。
- 确认列表、分页、弹窗或详情页的既有模式。

产出：

- 明确 PC 新增页面路径，推荐：
  - `frontend/src/app/admin/topic-submissions/page.tsx`
- 明确 API 客户端新增方法。
- 明确是否使用弹窗详情还是单独详情页。V1 推荐列表内详情弹窗或右侧详情面板。

验收：

- 输出 PC 前端新增/修改文件清单。
- 确认非管理员入口不可见或访问时有权限提示。

---

## 5. Phase 1：数据库与后端领域模型

### 5.1 新增状态枚举

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/TopicSubmissionStatus.java`

枚举值：

```java
PENDING,
ACCEPTED,
REJECTED
```

规则：

- 新提交默认 `PENDING`。
- 管理员只在 V1 中更新为 `ACCEPTED` 或 `REJECTED`。
- `REJECTED` 在前端展示为“未采纳”或“未采纳 / 忽略”。

验收：

- 枚举值与 API 文档一致。
- 非法状态请求返回 400。

### 5.2 新增实体 `TopicSubmission`

建议文件：

- `src/main/java/com/xiaoyouyingyu/entity/TopicSubmission.java`

字段：

- `id: Long`
- `userId: Long`
- `username: String`
- `title: String`
- `reason: String`
- `category: String`
- `extraInfo: String`
- `status: TopicSubmissionStatus`
- `createdAt: LocalDateTime`
- `updatedAt: LocalDateTime`

实现要求：

- 表名：`topic_submissions`
- `title` 必填，长度建议 100。
- `reason` 和 `extraInfo` 建议 500 或 `TEXT`，按数据库策略决定。
- 保存 `username` 快照，后台列表直接展示用户名。
- `createdAt` 创建后不可更新。
- `updatedAt` 每次状态更新时刷新。

验收：

- JPA 能正常映射。
- 新增记录时 `status = PENDING`。
- 新增记录时写入 `userId` 和 `username`。

### 5.3 新增 Repository

建议文件：

- `src/main/java/com/xiaoyouyingyu/repository/TopicSubmissionRepository.java`

需要能力：

- 按 `createdAt DESC` 分页查询。
- 按 `status` 筛选分页查询。
- 按关键词搜索 `title`、`reason`、`extraInfo`。
- 组合条件：`status + keyword + pageable`。

推荐方法：

```java
@Query("""
  select ts from TopicSubmission ts
  where (:status is null or ts.status = :status)
    and (:keyword is null or :keyword = ''
      or lower(ts.title) like lower(concat('%', :keyword, '%'))
      or lower(ts.reason) like lower(concat('%', :keyword, '%'))
      or lower(ts.extraInfo) like lower(concat('%', :keyword, '%')))
  order by ts.createdAt desc
""")
Page<TopicSubmission> search(
  @Param("status") TopicSubmissionStatus status,
  @Param("keyword") String keyword,
  Pageable pageable
);
```

验收：

- 空条件返回全部分页。
- 状态筛选正确。
- 关键词能匹配标题、原因、补充说明。

### 5.4 数据库结构

如果项目使用 `schema.sql`：

- 在 `src/main/resources/schema.sql` 增加 `topic_submissions` 建表语句。

建议 SQL：

```sql
CREATE TABLE IF NOT EXISTS topic_submissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  username VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  reason VARCHAR(500),
  category VARCHAR(50),
  extra_info VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_topic_submission_status_created_at (status, created_at),
  INDEX idx_topic_submission_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

如果项目依赖 `ddl-auto: update`：

- 仍建议在开发计划或数据库说明文档中记录建表 SQL，便于生产环境迁移。

验收：

- 本地启动后表可创建或手动建表成功。
- 索引存在。

---

## 6. Phase 2：后端用户提交 API

### 6.1 新增 DTO

建议目录：

- `src/main/java/com/xiaoyouyingyu/dto/topicsubmission/`

建议文件：

- `TopicSubmissionCreateRequest.java`
- `TopicSubmissionCreateResponse.java`
- `TopicSubmissionDetailResponse.java`
- `TopicSubmissionListItemResponse.java`
- `TopicSubmissionStatusUpdateRequest.java`

`TopicSubmissionCreateRequest` 字段：

- `title: String`
- `reason: String`
- `category: String`
- `extraInfo: String`

校验：

- `title` 必填，trim 后长度 2-100。
- `reason` 最长 500。
- `category` 最长 50。
- `extraInfo` 最长 500。

验收：

- 请求 DTO 使用 Bean Validation。
- 响应 DTO 不返回用户敏感信息。

### 6.2 新增用户提交 Controller

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/TopicSubmissionController.java`

接口：

- `POST /api/topic-submissions`
- 权限：登录用户

处理逻辑：

1. 从 `SecurityContextHolder` 获取当前用户。
2. 从认证详情或 `UserRepository` 获取用户 ID 与用户名。
3. 校验请求字段。
4. 创建 `TopicSubmission`。
5. 默认状态 `PENDING`。
6. 返回创建后的简要响应。

成功响应示例：

```json
{
  "id": 1,
  "title": "面试时介绍自己的项目经历",
  "status": "PENDING",
  "createdAt": "2026-06-27T10:00:00"
}
```

错误处理：

- 未登录：401。
- 标题为空或过长：400。
- 用户不存在：401 或 400，按项目现有认证约定处理。

验收：

- 登录用户可创建提交记录。
- 未登录用户不能创建。
- 标题为空返回 400。
- 快速重复点击时前端会禁用按钮；后端 V1 不做去重。

---

## 7. Phase 3：后端管理员管理 API

### 7.1 新增管理员 Controller

建议文件：

- `src/main/java/com/xiaoyouyingyu/controller/AdminTopicSubmissionController.java`

接口：

- `GET /api/admin/topic-submissions`
- `GET /api/admin/topic-submissions/{id}`
- `PUT /api/admin/topic-submissions/{id}/status`

权限：

- 仅 `ROLE_ADMIN`。
- 如 `SecurityConfig` 已配置 `/api/admin/**` 需要管理员权限，则沿用即可。

### 7.2 列表接口

`GET /api/admin/topic-submissions`

查询参数：

- `page`：默认 0。
- `size`：默认 20。
- `status`：可选，`PENDING` / `ACCEPTED` / `REJECTED`。
- `keyword`：可选。

返回字段：

- `id`
- `title`
- `username`
- `category`
- `status`
- `createdAt`
- `updatedAt`

验收：

- 默认按 `createdAt DESC`。
- 能按状态筛选。
- 能按关键词搜索。
- 不返回 `userId`、密码、token。

### 7.3 详情接口

`GET /api/admin/topic-submissions/{id}`

返回字段：

- `id`
- `title`
- `username`
- `category`
- `reason`
- `extraInfo`
- `status`
- `createdAt`
- `updatedAt`

验收：

- 存在记录返回详情。
- 不存在返回 404。

### 7.4 状态更新接口

`PUT /api/admin/topic-submissions/{id}/status`

请求体：

```json
{
  "status": "ACCEPTED"
}
```

业务规则：

- 允许状态：`ACCEPTED`、`REJECTED`。
- 不建议后台手动改回 `PENDING`，除非后续需求明确。
- 状态更新后刷新 `updatedAt`。
- V1 不自动创建 `topics`。
- V1 不通知用户。

验收：

- 管理员可更新状态。
- 非管理员返回 403。
- 非法状态返回 400。
- 不存在记录返回 404。

---

## 8. Phase 4：小程序 API 封装与页面注册

### 8.1 API 封装

建议修改：

- `xiaochengxu/miniprogram/utils/api.js`

新增方法：

- `createTopicSubmission(data)`

请求：

- `POST /api/topic-submissions`

参数：

- `title`
- `reason`
- `category`
- `extraInfo`

验收：

- 自动带 token。
- 401 场景能被页面识别并引导登录。

### 8.2 页面注册

建议新增页面：

- `xiaochengxu/miniprogram/pages/topicSubmit/index.js`
- `xiaochengxu/miniprogram/pages/topicSubmit/index.wxml`
- `xiaochengxu/miniprogram/pages/topicSubmit/index.wxss`
- `xiaochengxu/miniprogram/pages/topicSubmit/index.json`

修改：

- `xiaochengxu/miniprogram/app.json`

新增页面路径：

```json
"pages/topicSubmit/index"
```

验收：

- 微信开发者工具中页面可打开。
- 路由路径稳定，首页和主题页能跳转。

---

## 9. Phase 5：小程序首页轮播改造

### 9.1 WXML 改造

目标：

- 只替换顶部 `hero-card` 区域。
- 不删除、不重排首页下方模块。

建议修改：

- `xiaochengxu/miniprogram/pages/home/index.wxml`

实现方式：

- 使用小程序 `swiper` 和 `swiper-item`。
- 第一张保留当前 Daily Practice 内容与点击行为。
- 第二张展示提交话题入口。

结构建议：

```xml
<swiper class="hero-swiper" current="{{heroCurrent}}" indicator-dots="{{true}}" circular="{{true}}" autoplay="{{false}}" bindchange="onHeroSwiperChange">
  <swiper-item>
    <view class="hero-card" bindtap="goToLearning">
      <!-- 保留当前 Daily Practice 内容 -->
    </view>
  </swiper-item>
  <swiper-item>
    <view class="hero-card submit-hero-card" bindtap="goToTopicSubmit">
      <!-- 提交话题内容 -->
    </view>
  </swiper-item>
</swiper>
```

注意：

- 默认展示第一张。
- 如果使用 `autoplay`，仍必须默认第一张，且切换间隔不能过短。V1 推荐不自动播放或使用较慢自动播放。
- 第二张点击区域应进入提交话题流程。

验收：

- 首页打开默认第一张。
- 第二张可手动滑动看到。
- 第二张点击“提交话题”进入提交页或登录页。
- 下方学习入口、统计卡片、热门标签、最新主题保持原样。

### 9.2 JS 逻辑

建议修改：

- `xiaochengxu/miniprogram/pages/home/index.js`

新增：

- `heroCurrent: 0`
- `onHeroSwiperChange(e)`
- `goToTopicSubmit()`

`goToTopicSubmit` 逻辑：

1. 检查登录态。
2. 未登录：跳转 `pages/login/index`，可携带 redirect 参数。
3. 已登录：跳转 `pages/topicSubmit/index`。

验收：

- 未登录点击第二张进入登录引导。
- 已登录点击第二张进入提交页。
- 第一张原有 `goToLearning` 不受影响。

### 9.3 WXSS 样式

建议修改：

- `xiaochengxu/miniprogram/pages/home/index.wxss`

要求：

- `hero-swiper` 高度与原 `hero-card` 外观匹配，不造成首页首屏跳动。
- 第一张视觉尽量沿用原样。
- 第二张使用柔和浅蓝/浅绿背景。
- 第二张按钮可使用蓝色或蓝绿色，但需与首页风格协调。
- 不使用过重阴影、强广告渐变或突兀大图。

验收：

- iPhone 常见宽度下无文字溢出。
- 两张 slide 高度一致。
- indicator dots 不遮挡内容。

---

## 10. Phase 6：小程序主题页辅助入口

### 10.1 WXML 插入横幅

建议修改：

- `xiaochengxu/miniprogram/pages/topics/index.wxml`

插入位置：

- 搜索框、标签筛选、日历入口之后。
- 主题列表之前。

文案：

- 标题：`没有找到想练的话题？`
- 说明：`告诉我们你想聊什么，我们会优先整理高频需求。`
- 按钮：`提交`

验收：

- 横幅不遮挡搜索和筛选。
- 横幅在有结果和无结果时都可见，或至少在搜索区域下方稳定可见。
- 点击逻辑与首页第二张一致。

### 10.2 JS 与 WXSS

建议修改：

- `xiaochengxu/miniprogram/pages/topics/index.js`
- `xiaochengxu/miniprogram/pages/topics/index.wxss`

新增：

- `goToTopicSubmit()`

复用登录检查逻辑：

- 如果已有通用 `auth` 工具，抽取或复用，避免首页和主题页写两套不一致逻辑。

验收：

- 未登录用户点击进入登录引导。
- 已登录用户点击进入提交页。
- 横幅样式与主题页现有卡片体系协调。

---

## 11. Phase 7：小程序提交话题页面

### 11.1 页面结构

新增：

- `xiaochengxu/miniprogram/pages/topicSubmit/index.wxml`

字段：

- 话题标题，必填。
- 想练原因，选填。
- 分类标签，选填。
- 补充说明，选填。

分类建议：

- V1 可使用固定选项：
  - 职场
  - 旅行
  - 日常生活
  - 兴趣爱好
  - 学习考试
  - 其他

按钮：

- `提交给管理员`

成功态：

- 文案：`提交成功，如被采纳会出现在主题库`
- 操作：
  - `继续浏览主题`
  - `返回首页`

验收：

- 页面符合原型 `03-miniapp-submit-flow.html`。
- 标题为空时不发请求。
- 提交中按钮不可重复点击。
- 提交失败保留已填内容。

### 11.2 页面逻辑

新增：

- `xiaochengxu/miniprogram/pages/topicSubmit/index.js`

状态：

- `title`
- `reason`
- `category`
- `extraInfo`
- `submitting`
- `submitted`
- `error`

逻辑：

1. `onLoad` 检查登录态。
2. 未登录时跳转登录。
3. 输入字段双向更新。
4. 点击提交时 trim 标题。
5. 标题为空显示 toast。
6. 调用 `api.createTopicSubmission`。
7. 成功后切换成功态。
8. 失败显示 toast 或错误区。

验收：

- 快速连续点击不会重复提交。
- 401 时跳转登录。
- 400 时显示服务端错误。
- 500 或网络失败时提示重试。

### 11.3 页面样式

新增：

- `xiaochengxu/miniprogram/pages/topicSubmit/index.wxss`

要求：

- 与现有小程序页面卡片风格一致。
- 表单控件触控区域足够大。
- 成功态醒目但克制。
- 移动端小屏文本不溢出。

验收：

- 微信开发者工具常见机型预览无布局错乱。
- 长话题标题输入不会撑破布局。

---

## 12. Phase 8：PC 管理后台页面与导航

### 12.1 API 客户端

修改：

- `frontend/src/lib/api.ts`

新增类型：

- `TopicSubmissionStatus`
- `TopicSubmissionListItem`
- `TopicSubmissionDetail`
- `TopicSubmissionPage`

新增方法：

- `getAdminTopicSubmissions(params)`
- `getAdminTopicSubmission(id)`
- `updateAdminTopicSubmissionStatus(id, status)`

验收：

- 自动带 token。
- 403 可被页面处理。
- 分页结构与 Spring Page 响应匹配。

### 12.2 管理后台页面

新增：

- `frontend/src/app/admin/topic-submissions/page.tsx`

页面内容：

- 标题：`用户提交话题`
- 说明：`查看小程序用户提交的口语练习需求，并决定是否采纳。`
- 统计卡片：
  - 待处理数量
  - 已采纳数量或本页已采纳数量
  - 未采纳数量或本页未采纳数量
- 筛选：
  - 状态：全部、待处理、已采纳、未采纳
  - 关键词搜索
- 列表字段：
  - 话题
  - 用户名
  - 分类
  - 状态
  - 提交时间
  - 操作
- 操作：
  - 查看
  - 标记已采纳
  - 标记未采纳

详情展示：

- V1 推荐使用弹窗或右侧面板，不必新增详情路由。
- 展示：
  - 话题标题
  - 用户名
  - 分类
  - 想练原因
  - 补充说明
  - 状态
  - 创建时间
  - 更新时间

验收：

- 管理员可加载列表。
- 可筛选状态。
- 可搜索关键词。
- 可打开详情。
- 可更新状态。
- 更新成功后列表刷新。

### 12.3 后台导航

修改：

- `frontend/src/components/sidebar.tsx`

新增入口：

- 文案：`用户提交话题`
- 路由：`/admin/topic-submissions`
- 仅管理员可见，或沿用后台整体权限判断。

验收：

- 管理员可从侧边栏进入页面。
- 普通用户不可见或进入后提示无权限。

---

## 13. Phase 9：权限、错误处理与体验打磨

### 13.1 权限

后端：

- `POST /api/topic-submissions` 需要登录。
- `/api/admin/topic-submissions/**` 需要管理员。

小程序：

- 入口可见。
- 点击提交动作时检查登录。
- 未登录跳登录页。

PC：

- 页面请求 403 时显示无权限提示。
- 不在前端暴露用户敏感字段。

验收：

- 游客不能提交。
- 普通用户不能访问后台接口。
- 管理员可以完整处理。

### 13.2 错误与空状态

小程序：

- 提交页标题为空：toast。
- 提交中：按钮 loading。
- 提交失败：toast 或错误提示，保留表单。
- 提交成功：成功态，不跳转消失。

PC：

- 列表空状态：`暂无用户提交的话题`。
- 加载失败：显示重试。
- 状态更新失败：toast 错误，不乐观更新为成功。

后端：

- 参数错误返回明确消息。
- 非法状态返回 400。
- 找不到记录返回 404。

验收：

- 关键失败路径都有可见反馈。

---

## 14. Phase 10：测试、联调与验收

### 14.1 后端测试

建议测试：

- `TopicSubmissionControllerTest`
- `AdminTopicSubmissionControllerTest`
- `TopicSubmissionRepositoryTest`

覆盖：

- 登录用户创建提交成功。
- 未登录创建提交失败。
- 空标题创建失败。
- 管理员查询列表成功。
- 管理员按状态筛选成功。
- 管理员按关键词搜索成功。
- 管理员查看详情成功。
- 不存在详情返回 404。
- 管理员更新状态成功。
- 非法状态返回 400。
- 非管理员访问后台接口返回 403。

可执行命令：

```bash
mvn test
```

### 14.2 小程序手工验收

场景：

1. 未登录打开首页，滑到第二张轮播，点击提交。
2. 已登录打开首页，滑到第二张轮播，点击提交。
3. 检查首页下方学习入口、统计卡片、热门标签、最新主题均存在。
4. 进入主题页，点击辅助入口。
5. 提交页标题为空，点击提交。
6. 填写完整表单，提交成功。
7. 模拟网络失败，确认表单内容保留。

验收记录：

- 建议在 PR 或开发记录中附首页截图、主题页截图、提交成功截图。

### 14.3 PC 后台手工验收

场景：

1. 管理员登录后台。
2. 进入“用户提交话题”。
3. 查看刚提交的数据。
4. 按状态筛选。
5. 搜索关键词。
6. 打开详情。
7. 标记已采纳。
8. 标记未采纳。
9. 普通用户访问后台接口或页面。

验收记录：

- 建议附后台列表、详情、状态更新截图。

### 14.4 端到端联调

流程：

1. 后端启动。
2. 小程序登录用户提交话题。
3. 数据库确认出现 `PENDING` 记录。
4. PC 后台刷新列表看到记录。
5. 管理员标记 `ACCEPTED`。
6. 数据库状态变为 `ACCEPTED`。
7. PC 后台列表和详情同步更新。

验收：

- 端到端链路闭环。

---

## 15. Phase 11：文档同步与上线准备

### 15.1 文档同步

需要更新：

- `doc/frontend.md`
  - 补充小程序首页轮播、提交页、主题页辅助入口。
  - 补充 PC 后台用户提交话题页面。
- API 文档位置如果存在：
  - 补充用户提交 API。
  - 补充管理员 API。
- 数据模型文档位置如果存在：
  - 补充 `topic_submissions` 表。

验收：

- 文档能说明新增入口、接口、表结构和后台页面。

### 15.2 上线前检查

检查项：

- 数据库表已创建。
- 后端接口权限正确。
- 小程序页面路径已加入 `app.json`。
- 首页轮播默认第一张。
- 首页其它模块未丢失。
- PC 后台导航可进入。
- 管理员账号可处理提交。
- 普通用户不能访问后台接口。
- 提交接口无频率限制，但前端能防重复点击。

### 15.3 回滚方案

如上线后出现问题：

- 小程序：
  - 可临时隐藏第二张轮播或将点击行为关闭。
  - 可保留原首页第一张 Daily Practice。
- PC 后台：
  - 可隐藏侧边栏入口。
- 后端：
  - 保留表结构不影响现有业务。
  - 如接口异常，可临时在前端关闭提交入口。

---

## 16. 预计文件清单

### 16.1 后端新增

- `src/main/java/com/xiaoyouyingyu/entity/TopicSubmission.java`
- `src/main/java/com/xiaoyouyingyu/entity/TopicSubmissionStatus.java`
- `src/main/java/com/xiaoyouyingyu/repository/TopicSubmissionRepository.java`
- `src/main/java/com/xiaoyouyingyu/controller/TopicSubmissionController.java`
- `src/main/java/com/xiaoyouyingyu/controller/AdminTopicSubmissionController.java`
- `src/main/java/com/xiaoyouyingyu/dto/topicsubmission/TopicSubmissionCreateRequest.java`
- `src/main/java/com/xiaoyouyingyu/dto/topicsubmission/TopicSubmissionCreateResponse.java`
- `src/main/java/com/xiaoyouyingyu/dto/topicsubmission/TopicSubmissionListItemResponse.java`
- `src/main/java/com/xiaoyouyingyu/dto/topicsubmission/TopicSubmissionDetailResponse.java`
- `src/main/java/com/xiaoyouyingyu/dto/topicsubmission/TopicSubmissionStatusUpdateRequest.java`

### 16.2 后端修改

- `src/main/resources/schema.sql`
- 如需要：`src/main/java/com/xiaoyouyingyu/config/SecurityConfig.java`
- 如需要：`src/main/java/com/xiaoyouyingyu/controller/ApiExceptionHandler.java`

### 16.3 小程序新增

- `xiaochengxu/miniprogram/pages/topicSubmit/index.js`
- `xiaochengxu/miniprogram/pages/topicSubmit/index.wxml`
- `xiaochengxu/miniprogram/pages/topicSubmit/index.wxss`
- `xiaochengxu/miniprogram/pages/topicSubmit/index.json`

### 16.4 小程序修改

- `xiaochengxu/miniprogram/app.json`
- `xiaochengxu/miniprogram/utils/api.js`
- `xiaochengxu/miniprogram/pages/home/index.js`
- `xiaochengxu/miniprogram/pages/home/index.wxml`
- `xiaochengxu/miniprogram/pages/home/index.wxss`
- `xiaochengxu/miniprogram/pages/topics/index.js`
- `xiaochengxu/miniprogram/pages/topics/index.wxml`
- `xiaochengxu/miniprogram/pages/topics/index.wxss`

### 16.5 PC 前端新增

- `frontend/src/app/admin/topic-submissions/page.tsx`

### 16.6 PC 前端修改

- `frontend/src/lib/api.ts`
- `frontend/src/components/sidebar.tsx`
- 如后台首页需要待处理卡片，可修改：
  - `frontend/src/app/admin/page.tsx`

### 16.7 文档新增 / 修改

- 新增：`doc/prd/topic-submission-miniapp-development-plan-20260627.md`
- 已有：`doc/prd/topic-submission-miniapp-requirements-20260627.md`
- 建议修改：`doc/frontend.md`

---

## 17. 风险与注意事项

- **首页误改风险**：开发时容易把原首页模块删减成原型简化版。必须以现有 `home/index.wxml` 为准，只替换顶部封面区域。
- **权限风险**：用户提交接口必须要求登录；后台接口必须要求管理员。
- **敏感信息风险**：后台列表只显示用户名，不返回用户密码或 token。
- **状态语义风险**：`ACCEPTED` 只是采纳状态，不代表已经创建正式主题。
- **重复提交风险**：V1 不限制频率，前端仍要防止单次快速重复点击。
- **数据库迁移风险**：如果生产环境不使用 `ddl-auto: update`，必须提前执行建表 SQL。
- **文案一致性风险**：成功提示必须使用“提交成功，如被采纳会出现在主题库”。

---

## 18. 推荐实施顺序

1. 后端表、Entity、Repository。
2. 后端用户提交 API。
3. 后端管理员 API。
4. 后端测试。
5. 小程序提交页与 API 封装。
6. 小程序首页轮播。
7. 小程序主题页辅助入口。
8. PC 管理后台页面与导航。
9. 全链路联调。
10. 文档同步。

这个顺序可以先把数据闭环打通，再做入口和后台体验，减少前端页面写完后等接口的空转。
