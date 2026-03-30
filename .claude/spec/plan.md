英语口语主题管理系统 (English Oral Topic CMS) 需求规格说明书1. 项目背景本项目旨在构建一个极简、优雅的英语口语练习管理系统。通过 AI 驱动的主题生成能力，减轻管理员的内容创作负担，并为用户提供符合 Apple 审美（简约、直观、高质感）的学习体验。2. 技术栈架构 (Tech Stack)2.1 前端 (Frontend)框架: Next.js 14+ (App Router)样式: Tailwind CSS组件库: Shadcn/UI (基于 Radix UI，提供 Apple 风格的细腻交互)状态管理: TanStack Query (React Query)2.2 后端 (Backend)语言: Java 21 (LTS)框架: Spring Boot 3.x依赖管理: Maven安全/权限: Spring Security + JWTAI 集成: Spring AI 或自定义 HttpClient 调用 OpenAI/Claude API2.3 数据库 (Database)类型: MySQL 8.0ORM: Spring Data JPA3. 核心功能模块3.1 用户与权限系统 (RBAC)系统采用三级权限体系：游客 (Guest):仅能访问主页查看标题列表。点击查看详情、使用搜索、使用日历筛选时，系统自动拦截并弹出登录/注册模态框。已注册用户 (User):拥有完整的列表查看、详情查看权限。可使用日历视图查询和高级搜索功能。支持修改个人账户密码。管理员 (Admin):拥有全系统最高权限。管理用户状态（禁用/启用）。使用 AI 生成工具或手动录入、修改、删除口语主题。3.2 AI 主题生成引擎交互逻辑:管理员输入核心需求（如：“面试英语”）。后端调用大模型返回结构化 JSON。支持多轮修正：管理员可输入指令（如“太难了，简单点”），AI 基于上下文重新生成。生成内容:标题、关联日期、分类标签。5-8 个讨论问题（每个问题必须包含：英文描述 + 对应的中文翻译）。3.3 视觉与搜索系统日历试图: 标准 Apple 月视图。带有内容的日期标记小圆点，点击日期加载当日主题卡片。搜索: 全局模糊搜索。支持在标题和问题内容中匹配关键词，支持按日期范围和标签筛选。4. 数据库 Schema (DDL)SQL-- 用户表
CREATE TABLE `users` (
`id` BIGINT PRIMARY KEY AUTO_INCREMENT,
`username` VARCHAR(50) UNIQUE NOT NULL COMMENT '账号',
`password` VARCHAR(255) NOT NULL COMMENT '加密密码',
`role` ENUM('ADMIN', 'USER') DEFAULT 'USER' COMMENT '角色',
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 主题表
CREATE TABLE `topics` (
`id` BIGINT PRIMARY KEY AUTO_INCREMENT,
`title` VARCHAR(200) NOT NULL COMMENT '主题标题',
`tags` VARCHAR(255) COMMENT '分类标签，逗号分隔',
`event_date` DATE NOT NULL COMMENT '关联日期（用于日历展示）',
`questions` JSON NOT NULL COMMENT '存储格式: [{"en": "Question?", "zh": "问题内容"}]',
`creator_id` BIGINT,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX `idx_event_date` (`event_date`),
FULLTEXT INDEX `idx_search` (`title`) -- 提升模糊搜索性能
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
5. UI/UX 设计规范 (Apple Style Guide)元素设计规范字体优先调用系统 SF Pro，后备使用 Inter。背景色全局背景 #F5F5F7，内容卡片 #FFFFFF。磨砂效果导航栏及 Modal 采用 backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.7);。圆角容器/按钮统一使用 12px - 16px 大圆角。交互动画点击反馈使用轻微的 scale(0.98)。页面转场使用 opacity 渐变。6. 后端核心接口 (API Definition)6.1 认证接口POST /api/auth/register - 用户注册POST /api/auth/login - 登录并获取 Token6.2 主题接口GET /api/topics - 分页获取列表（游客仅返回标题）GET /api/topics/{id} - 获取详细内容（已注册用户/管理员）GET /api/topics/calendar - 按月份筛选数据（返回日期与标题映射）6.3 管理员接口POST /api/admin/ai/generate - 发送 Prompt 生成 JSON 主题数据POST /api/admin/topics - 提交保存新主题DELETE /api/admin/users/{id} - 管理员注销用户7. AI Prompt 模板 (示例)Role: 专业英语教育专家Task: 根据输入内容生成一个结构化的口语主题。Input: {input_text}Output Format:JSON{
   "title": "主题标题",
   "tags": ["标签1", "标签2"],
   "questions": [
   { "en": "English Question", "zh": "中文对应问题" }
   ]
   }
   下一步建议：如果你准备好了，我可以先为你生成该系统的 后端核心 Java 实体类 (Entity) 和 数据库 Repository 的代码实现。英语口语主题管理系统 (English Oral Topic CMS) 需求规格说明书1. 项目背景本项目旨在构建一个极简、优雅的英语口语练习管理系统。通过 AI 驱动的主题生成能力，减轻管理员的内容创作负担，并为用户提供符合 Apple 审美（简约、直观、高质感）的学习体验。2. 技术栈架构 (Tech Stack)2.1 前端 (Frontend)框架: Next.js 14+ (App Router)样式: Tailwind CSS组件库: Shadcn/UI (基于 Radix UI，提供 Apple 风格的细腻交互)状态管理: TanStack Query (React Query)2.2 后端 (Backend)语言: Java 21 (LTS)框架: Spring Boot 3.x依赖管理: Maven安全/权限: Spring Security + JWTAI 集成: Spring AI 或自定义 HttpClient 调用 OpenAI/Claude API2.3 数据库 (Database)类型: MySQL 8.0ORM: Spring Data JPA3. 核心功能模块3.1 用户与权限系统 (RBAC)系统采用三级权限体系：游客 (Guest):仅能访问主页查看标题列表。点击查看详情、使用搜索、使用日历筛选时，系统自动拦截并弹出登录/注册模态框。已注册用户 (User):拥有完整的列表查看、详情查看权限。可使用日历视图查询和高级搜索功能。支持修改个人账户密码。管理员 (Admin):拥有全系统最高权限。管理用户状态（禁用/启用）。使用 AI 生成工具或手动录入、修改、删除口语主题。3.2 AI 主题生成引擎交互逻辑:管理员输入核心需求（如：“面试英语”）。后端调用大模型返回结构化 JSON。支持多轮修正：管理员可输入指令（如“太难了，简单点”），AI 基于上下文重新生成。生成内容:标题、关联日期、分类标签。5-8 个讨论问题（每个问题必须包含：英文描述 + 对应的中文翻译）。3.3 视觉与搜索系统日历试图: 标准 Apple 月视图。带有内容的日期标记小圆点，点击日期加载当日主题卡片。搜索: 全局模糊搜索。支持在标题和问题内容中匹配关键词，支持按日期范围和标签筛选。4. 数据库 Schema (DDL)SQL-- 用户表
   CREATE TABLE `users` (
   `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
   `username` VARCHAR(50) UNIQUE NOT NULL COMMENT '账号',
   `password` VARCHAR(255) NOT NULL COMMENT '加密密码',
   `role` ENUM('ADMIN', 'USER') DEFAULT 'USER' COMMENT '角色',
   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 主题表
CREATE TABLE `topics` (
`id` BIGINT PRIMARY KEY AUTO_INCREMENT,
`title` VARCHAR(200) NOT NULL COMMENT '主题标题',
`tags` VARCHAR(255) COMMENT '分类标签，逗号分隔',
`event_date` DATE NOT NULL COMMENT '关联日期（用于日历展示）',
`questions` JSON NOT NULL COMMENT '存储格式: [{"en": "Question?", "zh": "问题内容"}]',
`creator_id` BIGINT,
`created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
INDEX `idx_event_date` (`event_date`),
FULLTEXT INDEX `idx_search` (`title`) -- 提升模糊搜索性能
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
5. UI/UX 设计规范 (Apple Style Guide)元素设计规范字体优先调用系统 SF Pro，后备使用 Inter。背景色全局背景 #F5F5F7，内容卡片 #FFFFFF。磨砂效果导航栏及 Modal 采用 backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.7);。圆角容器/按钮统一使用 12px - 16px 大圆角。交互动画点击反馈使用轻微的 scale(0.98)。页面转场使用 opacity 渐变。6. 后端核心接口 (API Definition)6.1 认证接口POST /api/auth/register - 用户注册POST /api/auth/login - 登录并获取 Token6.2 主题接口GET /api/topics - 分页获取列表（游客仅返回标题）GET /api/topics/{id} - 获取详细内容（已注册用户/管理员）GET /api/topics/calendar - 按月份筛选数据（返回日期与标题映射）6.3 管理员接口POST /api/admin/ai/generate - 发送 Prompt 生成 JSON 主题数据POST /api/admin/topics - 提交保存新主题DELETE /api/admin/users/{id} - 管理员注销用户7. AI Prompt 模板 (示例)Role: 专业英语教育专家Task: 根据输入内容生成一个结构化的口语主题。Input: {input_text}Output Format:JSON{
   "title": "主题标题",
   "tags": ["标签1", "标签2"],
   "questions": [
   { "en": "English Question", "zh": "中文对应问题" }
   ]
   }
   下一步建议：如果你准备好了，我可以先为你生成该系统的 后端核心 Java 实体类 (Entity) 和 数据库 Repository 的代码实现。