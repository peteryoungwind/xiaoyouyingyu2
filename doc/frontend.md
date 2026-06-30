# PC 前端说明

> 最后更新：2026-05-25

## 代码位置

PC 前端位于 `frontend`，使用 Next.js App Router。

```text
frontend/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── src/
    ├── app/
    ├── components/
    └── lib/
```

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- TanStack React Query
- Radix UI
- Lucide React
- qrcode.react

## 运行脚本

```bash
cd frontend
npm install
npm run dev
npm run build
npm run start
```

## API 访问方式

统一封装位于 `frontend/src/lib/api.ts`。

请求基地址：

- 默认使用 `/api`，由 `next.config.js` rewrite 到后端。
- 部分接口通过 `direct: true` 直接访问后端基础地址。
- 开发环境后端地址为 `http://localhost:8080/api`。
- 生产环境后端地址为 `https://xiaoyou-ky.top/api`。

请求封装能力：

- 自动携带 `Content-Type: application/json`。
- 从 `localStorage` 读取 token 并加入 `Authorization`。
- 统一解析 JSON。
- 401 时清空本地登录态，并派发 `auth:expired` 事件。
- 抛出后端返回的 `error` 或 `message`。

## 认证状态

认证上下文位于 `frontend/src/lib/auth.tsx`。

保存字段：

- `token`
- `username`
- `role`
- `membershipExpireAt`
- `membershipActive`
- `hasPassword`

对外能力：

- `login(data)`：写入本地存储并更新 React 状态。
- `logout()`：清空登录态。
- `refreshMembership()`：刷新会员状态。
- `isAdmin`：是否管理员。
- `isPremium`：管理员或会员。

## 全局布局

核心文件：

- `frontend/src/app/layout.tsx`
- `frontend/src/components/providers.tsx`
- `frontend/src/components/sidebar.tsx`
- `frontend/src/components/top-bar.tsx`

布局特点：

- 左侧固定导航栏。
- 顶部用户状态栏。
- `Providers` 注入 React Query 和 Auth Context。
- 管理员菜单按 `isAdmin` 条件显示。

## 页面说明

| 路由 | 文件 | 功能 |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | 首页仪表盘，展示主题总数、坚持天数、分类、最近主题 |
| `/topics` | `src/app/topics/page.tsx` | 话题列表，支持标签、关键词、分页、跳页 |
| `/topic/[id]` | `src/app/topic/[id]/page.tsx` | 话题详情，管理员可编辑，会员可进入学习中心 |
| `/calendar` | `src/app/calendar/page.tsx` | 日历/日期视图，展示按日期筛选的主题 |
| `/learning-center` | `src/app/learning-center/page.tsx` | 学习中心主题列表，非会员提示开通 |
| `/learning-center/topic/[id]` | `src/app/learning-center/topic/[id]/page.tsx` | 单主题学习中心，AI 生成热身、词汇、表达、任务、点评 |
| `/admin` | `src/app/admin/page.tsx` | 管理后台，AI 生成、手动创建、主题管理、用户管理、模型管理 |
| `/admin/word-books` | `src/app/admin/word-books/page.tsx` | 单词训练后台，单词本、单词、AI 场景生成 |
| `/admin/daily-articles` | `src/app/admin/daily-articles/page.tsx` | 每日外刊后台，库存维护、音频上传和今日推送 |
| `/admin/topic-submissions` | `src/app/admin/topic-submissions/page.tsx` | 用户提交话题后台，查看小程序提交、详情和采纳状态 |
| `/admin/membership-plans` | `src/app/admin/membership-plans/page.tsx` | 会员套餐管理，支持普通时长、永久会员、价格、折扣和上下架 |
| `/admin/membership-orders` | `src/app/admin/membership-orders/page.tsx` | 会员订单管理，支持状态、订单号和用户筛选，查看套餐快照 |
| `/users` | `src/app/users/page.tsx` | 用户管理与会员操作 |
| `/redeem-codes` | `src/app/redeem-codes/page.tsx` | 卡密生成、查询、禁用 |
| `/settings` | `src/app/settings/page.tsx` | 修改密码、会员状态、卡密兑换、开通联系信息 |

## 组件说明

| 组件 | 文件 | 说明 |
| --- | --- | --- |
| `Sidebar` | `components/sidebar.tsx` | 左侧主导航，按管理员权限显示管理入口 |
| `TopBar` | `components/top-bar.tsx` | 用户头像、角色/会员状态、登录/退出入口 |
| `AuthModal` | `components/auth-modal.tsx` | PC 登录/注册/微信扫码登录弹窗 |
| `Calendar` | `components/calendar.tsx` | 首页日历组件 |
| `TopicCard` | `components/topic-card.tsx` | 话题卡片展示 |
| `ToastProvider` | `components/toast-provider.tsx` | Toast 通知上下文 |
| `Navbar` | `components/navbar.tsx` | 旧版/辅助导航组件 |

`Sidebar` 的选中态按可见导航项做路径边界匹配，并选择最长匹配路径作为唯一高亮项。这样 `/admin`、`/admin/membership-plans`、`/admin/membership-orders` 等管理入口在侧边栏中保持同层级互斥高亮，同时详情类子路由仍归属到对应父入口。

## 会员支付管理

PC 后台新增两个管理员页面：

- `/admin/membership-plans`：维护会员套餐。金额输入以元展示，提交时转为整数分；支持普通天数套餐、永久会员套餐、限时折扣、排序和上下架。新增/编辑弹窗按“基础信息、价格与时长、折扣与上架”分组展示字段，必填项包含套餐名称、原价、现价、套餐类型、套餐状态；普通时长套餐还必须填写会员天数。页面会在提交前校验金额格式、现价不能高于原价、普通套餐天数大于 0、折扣结束时间晚于开始时间。
- `/admin/membership-orders`：查看小程序支付订单，展示订单号、用户、金额、状态、微信交易号、创建时间和套餐快照。

`/users` 用户管理页保留原有会员追加和设置到期时间能力，并新增“设置为永久会员”。新版操作调用 `/api/admin/membership/users/{id}/grant`，要求填写操作原因。

`frontend/src/lib/auth.tsx` 新增保存 `membershipPermanent`，但前端展示只作为体验优化，最终会员权限以后端动态判断为准。

## 话题列表功能

`/topics` 页面通过 `api.getTopics` 获取分页数据。

支持：

- 分类标签筛选。
- 登录后关键词搜索。
- 分页切换。
- 跳页输入。
- 会员用户可直接进入学习中心。

游客限制：

- 后端允许游客浏览列表，但不允许关键词搜索。
- 关键词搜索失败时前端会展示登录引导。

## 话题详情功能

`/topic/[id]` 负责：

- 展示英文/中文标题。
- 展示分类标签、日期、讨论问题。
- 管理员可直接编辑标题、标签、日期和问题。
- 会员用户可进入学习中心。

问题字段处理：

- 后端返回的 `questions` 可能是 JSON 字符串。
- 前端会在页面内 `JSON.parse` 后渲染。

## 学习中心功能

`/learning-center/topic/[id]` 负责完整学习闭环。

学习模式：

- `beginner`：初级模式，展示更多中文辅助。
- `advanced`：进阶模式，强调表达升级。

内容模块：

- 热身内容。
- 主题词汇。
- 表达模板。
- 练习任务。
- AI 点评。

缓存策略：

- 页面内用 React state 缓存当前主题、当前模式下的生成结果。
- 点击“换一批”时，会把已有内容作为 `exclude` 传给后端，要求 AI 去重。

权限：

- 非会员用户直接展示开通/兑换入口。

## 每日外刊管理后台

每日外刊的用户使用端在微信小程序，PC 前端不提供普通用户阅读列表和详情页。

PC 管理端：

- `/admin/daily-articles` 在侧边栏中显示为“外刊管理”，仅管理员可见。
- 左侧支持按状态和是否已推送筛选外刊库存。
- 右侧表单支持新增/编辑英文标题、中文标题、音频 URL、状态、段落、总结、词汇 JSON 和句型 JSON。
- 支持上传音频文件，上传成功后把返回的 `/uploads/daily-articles/...` URL 写回音频 URL。
- 支持启用、禁用、删除外刊，以及手动触发“生成今日外刊”。

## 管理后台功能

`/admin` 有 5 个 tab：

- AI 生成：输入提示词，生成 5 个标题，选择标题生成 10 个问题，再设置日期/标签保存。
- 手动创建：手动填写主题标题、中文标题、分类、日期和问题。
- 主题管理：查看并删除主题。
- 用户管理：查看用户、删除用户、修改角色。
- 模型管理：新增、编辑、删除 AI 文本模型和全局 TTS 发音模型，设置默认模型；TTS 模型配置在这里统一维护，不挂在单个单词本下。

“模型管理”页新增 AI 对话配置区块：

- 配置小程序 AI 对话启用状态。
- 选择文本 AI 模型和 TTS 模型；不选时使用后端默认模型。
- 配置 TTS 音色、语音提供方说明、温度、单次最大轮数和每日发送轮数。
- 编辑四套提示词：教学初级、教学进阶、练习初级、练习进阶。
- 支持恢复默认提示词。

### 单词训练后台

`/admin/word-books` 是新增的单词练习管理页面，侧边栏入口名称为“单词训练”。

当前能力：

- 创建单词本入口拆分为三个独立 tab：手动创建、AI 创建、根据主题创建。
- 手动创建只创建空单词本，填写名称、描述、适用场景。
- AI 创建会先创建单词本，再按场景、数量、难度、AI 模型和 TTS 模型生成单词。
- 根据主题创建会先创建单词本，再从选中的口语主题生成初级/进阶单词。
- 单词本详情仅在点击左侧单词本后展示；页面初始不自动展开任一单词本。
- 编辑单词本名称、描述、适用场景和状态。
- 查看单词本状态与初级/进阶/已发布词数统计。
- 发布、下架、软删除单词本。
- 手动新增单词，维护难度、状态、音标、词性、释义、句型、例句和来源场景。
- 编辑单词详情，支持修改释义、例句、状态、来源场景，并可对单词重新生成音频。
- 按关键词、难度、状态筛选单词。
- 调用后端 AI 按场景生成单词并保存。
- 选择一个或多个口语主题，按初级/进阶数量生成主题相关单词。
- 勾选单词后批量发布、下架、删除、重新生成音频、按当前顺序写入排序。
- 手动新增、AI 生成和重新生成音频时均可选择全局 TTS 模型；不选时使用默认 TTS 模型。
- 管理后台创建口语主题成功后，会弹窗询问是否补充该主题相关词汇，支持选择目标单词本、初级/进阶数量和 AI 模型。

新增接口封装位于 `frontend/src/lib/api.ts`，包括管理端单词本 API、单词 API、批量操作 API，以及用户端单词练习 API。

每日外刊 PC 管理接口也位于 `frontend/src/lib/api.ts`：

- `getAdminDailyArticles(params)`
- `getAdminDailyArticle(id)`
- `createDailyArticle(data)`
- `updateDailyArticle(id, data)`
- `updateDailyArticleStatus(id, status)`
- `deleteDailyArticle(id)`
- `publishTodayDailyArticle()`
- `uploadDailyArticleAudio(file)`

用户提交话题 PC 管理接口也位于 `frontend/src/lib/api.ts`：

- `getAdminTopicSubmissions(params)`
- `getAdminTopicSubmission(id)`
- `updateAdminTopicSubmissionStatus(id, status)`

`/admin/topic-submissions` 仅管理员可见。页面支持按状态筛选、关键词搜索、查看详情，并可将提交标记为已采纳或未采纳。采纳只更新提交状态，不自动创建正式主题。

AI 对话配置接口也位于 `frontend/src/lib/api.ts`：

- `getAiDialogConfig()`
- `updateAiDialogConfig(data)`
- `resetAiDialogPrompts()`

## 标签系统

标签工具位于 `frontend/src/lib/tag-colors.ts`。

后端支持的固定分类：

- 自我成长
- 情绪心理
- 人际沟通
- 生活习惯
- 学习方法
- 职场发展
- 文化旅行
- 兴趣娱乐
- 消费科技

前端会：

- 按固定顺序展示分类。
- 为分类匹配颜色。
- 兼容解析逗号分隔标签字符串。

## 样式说明

样式入口：

- `frontend/src/app/globals.css`
- `frontend/tailwind.config.js`

设计风格：

- 浅色后台应用风格。
- 固定侧边栏 + 顶栏。
- 卡片、列表、表单、标签和按钮主要由 Tailwind 类实现。
- 图标来自 `lucide-react`。

## 维护建议

- 统一 `api.ts` 中 `direct` 与 rewrite 的使用策略，减少跨域和部署差异。
- 将 API 域名抽成环境变量，例如 `NEXT_PUBLIC_API_BASE_URL`。
- 对 `JSON.parse(topic.questions)` 增加容错，避免异常内容导致页面崩溃。
- 后台模型表单不要在普通展示中完整暴露 API Key，可考虑脱敏显示。
