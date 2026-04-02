# 小柚英语 (xiaoyouyingyu) — 系统开发文档

> 版本：1.0-SNAPSHOT | 最后更新：2026-04-02

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [数据库设计](#4-数据库设计)
5. [后端架构](#5-后端架构)
6. [前端架构](#6-前端架构)
7. [API 接口文档](#7-api-接口文档)
8. [认证与安全](#8-认证与安全)
9. [AI 内容生成](#9-ai-内容生成)
10. [构建与部署](#10-构建与部署)
11. [开发指南](#11-开发指南)
12. [待改进事项](#12-待改进事项)

---

## 1. 项目概述

**小柚英语** 是一个英语口语练习话题管理平台，支持：

- 中英双语话题管理（标题、讨论问题均包含中英文）
- 基于 OpenAI GPT-4o 的 AI 智能话题生成（支持多轮对话）
- 用户注册/登录/权限管理（管理员 & 高级用户 & 普通用户）
- 话题按日期、标签分类浏览
- 日历视图查看话题分布
- 坚持天数统计
- 学习中心：围绕主题的口语练习闭环（热身、词汇、表达、任务、AI 点评）

---

## 2. 技术栈

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 21 | 编程语言 |
| Spring Boot | 3.2.5 | 应用框架 |
| Spring Security | - | 认证与授权 |
| Spring Data JPA | - | 数据访问层 (ORM) |
| Spring Validation | - | 请求参数校验 |
| MySQL | 8.0+ | 关系型数据库 |
| HikariCP | - | 数据库连接池 |
| JJWT | 0.12.5 | JWT 令牌生成与解析 |
| Jackson | - | JSON 序列化/反序列化 |
| Lombok | - | 减少样板代码 |
| Maven | - | 构建工具 |

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.0 | React 全栈框架 |
| React | 18.3.0 | UI 库 |
| TypeScript | 5.5.0 | 类型安全 |
| Tailwind CSS | 3.4.0 | 原子化 CSS 框架 |
| TanStack React Query | 5.50.0 | 服务端状态管理 |
| Radix UI | - | 无障碍 UI 组件 |
| Lucide React | 0.400.0 | 图标库 |
| tailwindcss-animate | 1.0.7 | CSS 动画 |

---

## 3. 项目结构

```
xiaoyouyingyu2/
├── pom.xml                                 # Maven 配置
├── src/main/
│   ├── java/com/xiaoyouyingyu/
│   │   ├── Application.java               # Spring Boot 启动类
│   │   ├── controller/
│   │   │   ├── AuthController.java         # 认证接口 (注册/登录/改密)
│   │   │   ├── TopicController.java        # 话题接口 (列表/搜索/详情/标签/统计/日历)
│   │   │   ├── AdminController.java        # 管理接口 (话题CRUD/用户管理/AI生成)
│   │   │   └── LearningController.java     # 学习中心接口 (热身/词汇/表达/任务/AI点评)
│   │   ├── entity/
│   │   │   ├── User.java                   # 用户实体
│   │   │   ├── Topic.java                  # 话题实体
│   │   │   └── AiModel.java                # AI 模型配置实体
│   │   ├── repository/
│   │   │   ├── UserRepository.java         # 用户数据访问
│   │   │   ├── TopicRepository.java        # 话题数据访问 (含自定义搜索查询)
│   │   │   └── AiModelRepository.java      # AI 模型数据访问
│   │   ├── service/
│   │   │   └── AiService.java              # OpenAI API 对接服务 (话题生成 + 学习中心AI)
│   │   ├── security/
│   │   │   ├── JwtUtils.java               # JWT 工具类 (生成/解析/验证)
│   │   │   └── JwtFilter.java              # JWT 请求过滤器
│   │   ├── config/
│   │   │   ├── SecurityConfig.java         # Spring Security 配置
│   │   │   └── DataInit.java               # 初始化默认管理员账号
│   │   └── dto/
│   │       ├── AuthRequest.java            # 登录/注册请求 DTO
│   │       └── AuthResponse.java           # 认证响应 DTO
│   └── resources/
│       └── application.yml                 # 应用配置文件
│
└── frontend/
    ├── package.json                        # 前端依赖
    ├── next.config.js                      # Next.js 配置
    ├── tailwind.config.js                  # Tailwind CSS 配置
    └── src/
        ├── app/
        │   ├── layout.tsx                  # 全局布局 (侧边栏 + 顶栏)
        │   ├── page.tsx                    # 首页/仪表盘
        │   ├── topics/page.tsx             # 话题列表页
        │   ├── topic/[id]/page.tsx         # 话题详情页
        │   ├── admin/page.tsx              # 管理后台页
        │   ├── calendar/page.tsx           # 日历视图页
        │   ├── learning-center/
        │   │   ├── page.tsx                # 学习中心首页 (主题列表)
        │   │   └── topic/[id]/page.tsx     # 主题学习中心 (热身/词汇/表达/任务/AI点评)
        │   ├── users/page.tsx              # 用户管理页
        │   ├── settings/page.tsx           # 设置页 (改密)
        │   └── globals.css                 # 全局样式
        ├── components/
        │   ├── providers.tsx               # 全局 Provider (QueryClient + Auth)
        │   ├── sidebar.tsx                 # 侧边导航栏
        │   ├── top-bar.tsx                 # 顶部导航栏
        │   ├── navbar.tsx                  # 导航栏
        │   ├── auth-modal.tsx              # 登录/注册弹窗
        │   ├── calendar.tsx                # 日历组件
        │   └── topic-card.tsx              # 话题卡片组件
        └── lib/
            ├── api.ts                      # API 请求封装 (16+ 接口)
            ├── auth.tsx                    # 认证上下文 (Context + Hook)
            └── tag-colors.ts               # 标签颜色映射
```

---

## 4. 数据库设计

### 4.1 数据库连接

- **主机**：`139.196.43.133:3306`
- **数据库名**：`xiaoyouyingyu`
- **字符集**：UTF-8MB4
- **时区**：`Asia/Shanghai`
- **连接池**：HikariCP（最小空闲 2，最大连接 10）

### 4.2 users 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 用户 ID |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| `password` | VARCHAR(255) | NOT NULL | 密码（BCrypt 哈希） |
| `role` | VARCHAR(20) | DEFAULT 'USER' | 角色：`ADMIN` / `PREMIUM_USER` / `USER` |
| `created_at` | DATETIME | 不可更新 | 创建时间 |

### 4.3 topics 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 话题 ID |
| `title` | VARCHAR(200) | NOT NULL | 英文标题 |
| `title_zh` | VARCHAR(200) | 可空 | 中文标题 |
| `tags` | VARCHAR(255) | 可空 | 标签（逗号分隔字符串） |
| `event_date` | DATE | NOT NULL | 话题日期 |
| `questions` | JSON | NOT NULL | 讨论问题（中英文 JSON 数组） |
| `creator_id` | BIGINT | 可空 | 创建者用户 ID |
| `created_at` | DATETIME | 不可更新 | 创建时间 |

### 4.4 ai_models 表

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | 模型 ID |
| `name` | VARCHAR(100) | NOT NULL | 模型显示名称 |
| `api_url` | VARCHAR(500) | NOT NULL | API 地址 |
| `api_key` | VARCHAR(500) | NOT NULL | API Key |
| `model_name` | VARCHAR(200) | NOT NULL | 模型名称（如 gpt-4o） |
| `is_default` | BOOLEAN | DEFAULT FALSE | 是否为默认模型 |
| `created_at` | DATETIME | 不可更新 | 创建时间 |

### 4.5 questions 字段 JSON 格式

```json
[
  { "en": "What do you think about...?", "zh": "你觉得……怎么样？" },
  { "en": "How would you describe...?", "zh": "你会怎么描述……？" }
]
```

---

## 5. 后端架构

### 5.1 分层架构

```
请求 → JwtFilter → SecurityFilterChain → Controller → Repository → MySQL
                                              ↓
                                          AiService → OpenAI API
```

| 层级 | 职责 |
|------|------|
| **Controller** | 接收 HTTP 请求，参数校验，调用 Repository/Service，返回响应 |
| **Repository** | 数据访问层，继承 JpaRepository，自定义 JPQL 查询 |
| **Service** | 业务逻辑（目前仅 AiService 用于 AI 生成） |
| **Security** | JWT 过滤、认证上下文设置、路由权限控制 |
| **Config** | Spring Security 配置、数据初始化 |
| **DTO** | 数据传输对象（请求/响应格式定义） |
| **Entity** | JPA 实体，映射数据库表 |

### 5.2 请求处理链

1. 请求进入 → CORS 预检处理
2. `JwtFilter`（OncePerRequestFilter）提取 `Authorization: Bearer <token>`
3. 解析 JWT → 获取 username、role → 设置 `SecurityContextHolder`
4. `SecurityFilterChain` 检查路由权限
5. 进入 Controller 方法处理
6. 返回 JSON 响应

### 5.3 数据初始化

`DataInit` 在应用启动时自动执行（`CommandLineRunner`）：
- 检查是否存在 `admin` 用户
- 若不存在则创建；若存在则重置密码
- 默认管理员：`admin` / `admin123`

---

## 6. 前端架构

### 6.1 状态管理

| 方案 | 使用场景 |
|------|----------|
| **React Context (AuthContext)** | 用户登录状态、角色信息 |
| **TanStack React Query** | 服务端数据缓存、请求去重、自动刷新 |
| **URL SearchParams** | 页面过滤条件（标签筛选） |
| **localStorage** | 持久化 token、username、role |

### 6.2 认证流程

```
用户登录/注册 → api.login()/register() → 后端返回 {token, username, role}
     ↓
localStorage 存储 → AuthContext 更新 → UI 重渲染
     ↓
后续请求自动附带 Authorization: Bearer <token>
```

### 6.3 API 客户端 (`lib/api.ts`)

统一的请求封装函数 `request()`：
- 自动从 `localStorage` 读取 token
- 自动设置 `Content-Type: application/json`
- 自动附带 `Authorization` 头
- 统一错误处理（解析错误 JSON 或返回 HTTP 状态码）

### 6.4 页面功能说明

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | 统计仪表盘（总话题数、坚持天数、标签数）、标签分类、日历预览、最新话题 |
| 话题列表 | `/topics` | 关键词搜索、标签筛选、分页、话题卡片网格 |
| 话题详情 | `/topic/[id]` | 查看话题完整信息、中英文讨论问题、进入学习中心入口 |
| 管理后台 | `/admin` | AI 生成话题、手动创建话题、话题管理（编辑/删除） |
| 日历视图 | `/calendar` | 按月查看话题分布，交互式日期选择 |
| 学习中心 | `/learning-center` | 可学习主题列表，搜索/标签筛选，进入具体主题学习 |
| 主题学习 | `/learning-center/topic/[id]` | 模式切换、热身、词汇、表达工具箱、练习任务、AI 点评 |
| 用户管理 | `/users` | 查看用户列表、修改角色（含高级用户）、删除用户（仅管理员） |
| 设置 | `/settings` | 修改密码 |

### 6.5 权限控制（前端）

| 角色 | 可见功能 |
|------|----------|
| **游客** | 浏览话题列表（仅标题）、查看标签/统计/日历 |
| **普通用户 (USER)** | 游客权限 + 搜索功能 + 查看话题详情 + 修改密码 |
| **高级用户 (PREMIUM_USER)** | 普通用户权限 + 学习中心全部功能（热身、词汇、表达、练习任务、AI 点评） |
| **管理员 (ADMIN)** | 全部功能：创建/编辑/删除话题、用户管理、AI 生成、学习中心 |

---

## 7. API 接口文档

### 7.1 认证接口

#### POST `/api/auth/register` — 用户注册

**权限**：公开

**请求体**：
```json
{
  "username": "string (3-50字符, 必填)",
  "password": "string (≥6字符, 必填)"
}
```

**成功响应** `200`：
```json
{
  "token": "eyJhbGciOiJIUz...",
  "username": "zhangsan",
  "role": "USER"
}
```

**失败响应** `400`：
```json
{ "error": "用户名已存在" }
```

---

#### POST `/api/auth/login` — 用户登录

**权限**：公开

**请求体**：
```json
{
  "username": "string (必填)",
  "password": "string (必填)"
}
```

**成功响应** `200`：
```json
{
  "token": "eyJhbGciOiJIUz...",
  "username": "zhangsan",
  "role": "USER"
}
```

**失败响应** `400`：返回 `null`

---

#### PUT `/api/auth/password` — 修改密码

**权限**：已登录用户

**请求头**：`Authorization: Bearer <token>`

**请求体**：
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

**成功响应** `200`：
```json
{ "message": "密码修改成功" }
```

**失败响应** `400`：
```json
{ "error": "原密码错误" }
```

---

### 7.2 话题接口

#### GET `/api/topics` — 话题列表（分页搜索）

**权限**：公开（游客仅返回简要信息，不可搜索）

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | int | 0 | 页码（从 0 开始） |
| `size` | int | 10 | 每页条数 |
| `keyword` | string | null | 搜索关键词（匹配 title、titleZh、questions） |
| `tag` | string | null | 标签筛选 |
| `startDate` | LocalDate | null | 开始日期 |
| `endDate` | LocalDate | null | 结束日期 |

**已登录用户响应** `200`（Spring Page 对象）：
```json
{
  "content": [
    {
      "id": 1,
      "title": "Travel Experiences",
      "titleZh": "旅行经历",
      "tags": "travel,culture",
      "eventDate": "2026-03-30",
      "questions": "[{\"en\":\"...\",\"zh\":\"...\"}]",
      "creatorId": 1,
      "createdAt": "2026-03-30T10:00:00"
    }
  ],
  "totalElements": 100,
  "totalPages": 10,
  "number": 0,
  "size": 10
}
```

**游客响应** `200`（简化版，不含 questions）：
```json
{
  "content": [
    { "id": 1, "title": "Travel Experiences", "eventDate": "2026-03-30", "tags": "travel,culture" }
  ]
}
```

---

#### GET `/api/topics/{id}` — 话题详情

**权限**：公开

**响应** `200`：完整 Topic 对象

**响应** `404`：话题不存在

---

#### GET `/api/topics/tags` — 标签统计

**权限**：公开

**响应** `200`：
```json
{
  "travel": { "count": 5, "latestTitle": "Travel Experiences" },
  "food": { "count": 3, "latestTitle": "Chinese Cuisine" }
}
```

---

#### GET `/api/topics/stats` — 坚持天数统计

**权限**：公开

**响应** `200`：
```json
{ "days": 120 }
```

> 计算方式：当前日期 - 最早话题的 eventDate

---

#### GET `/api/topics/calendar` — 日历视图

**权限**：公开

**查询参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `year` | int | 年份 |
| `month` | int | 月份 |

**响应** `200`：
```json
{
  "2026-03-01": [{ "id": 1, "title": "Topic A" }],
  "2026-03-15": [{ "id": 2, "title": "Topic B" }, { "id": 3, "title": "Topic C" }]
}
```

---

### 7.3 管理接口

> 所有管理接口需要 `ADMIN` 角色，请求头须包含 `Authorization: Bearer <token>`

#### POST `/api/admin/topics` — 创建话题

**请求体**：
```json
{
  "title": "Travel Experiences",
  "titleZh": "旅行经历",
  "tags": "travel,culture",
  "eventDate": "2026-03-30",
  "questions": "[{\"en\":\"Where did you travel last?\",\"zh\":\"你上次去哪里旅行了？\"}]"
}
```

**响应** `200`：创建后的完整 Topic 对象（含生成的 id、creatorId、createdAt）

---

#### PUT `/api/admin/topics/{id}` — 更新话题

**请求体**：同创建话题

**响应** `200`：更新后的 Topic 对象

**响应** `404`：话题不存在

---

#### DELETE `/api/admin/topics/{id}` — 删除话题

**响应** `200`：
```json
{ "message": "删除成功" }
```

---

#### GET `/api/admin/users` — 用户列表

**响应** `200`：
```json
[
  { "id": 1, "username": "admin", "password": "$2a$10$...", "role": "ADMIN", "createdAt": "..." },
  { "id": 2, "username": "zhangsan", "password": "$2a$10$...", "role": "USER", "createdAt": "..." }
]
```

> ⚠️ 注意：当前接口返回了 password 哈希值，后续应排除此字段

---

#### DELETE `/api/admin/users/{id}` — 删除用户

**响应** `200`：
```json
{ "message": "用户已删除" }
```

---

#### PUT `/api/admin/users/{id}/role` — 修改用户角色

**请求体**：
```json
{ "role": "ADMIN" }
```

**响应** `200`：
```json
{ "message": "角色更新成功" }
```

**失败场景**：
- 无效角色 → `400 { "error": "无效的角色" }`
- 降级唯一管理员 → `400 { "error": "无法降级唯一的管理员" }`
- 用户不存在 → `404`

---

#### POST `/api/admin/ai/generate` — AI 生成话题（旧接口）

**请求体**：
```json
{
  "prompt": "生成一个关于旅行的英语口语话题",
  "history": [
    { "role": "user", "content": "之前的提问" },
    { "role": "assistant", "content": "之前的回复" }
  ]
}
```

**响应** `200`：
```json
{
  "content": "{\"title\":\"Travel Adventures\",\"tags\":[\"travel\",\"culture\"],\"questions\":[{\"en\":\"...\",\"zh\":\"...\"}]}"
}
```

> AI 返回的 `content` 为 JSON 字符串，前端需解析后展示

---

#### POST `/api/admin/ai/generate-titles` — 批量生成主题标题

**请求体**：
```json
{
  "prompt": "生成关于日常生活的话题",
  "modelId": 1
}
```

**响应** `200`：
```json
{
  "content": "{\"titles\":[{\"en\":\"Weekend Plans\",\"zh\":\"周末计划\"}]}"
}
```

---

#### POST `/api/admin/ai/generate-questions` — 根据主题生成问题

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "modelId": 1
}
```

**响应** `200`：
```json
{
  "content": "{\"questions\":[{\"en\":\"Where did you travel last?\",\"zh\":\"你上次去哪里旅行了？\"}]}"
}
```

---

#### GET `/api/admin/ai/models` — AI 模型列表

**响应** `200`：
```json
[
  {
    "id": 1,
    "name": "GPT-4o",
    "apiUrl": "https://api.gptgod.online/v1/chat/completions",
    "apiKey": "sk-...",
    "modelName": "gpt-4o",
    "isDefault": true,
    "createdAt": "2026-04-01T10:00:00"
  }
]
```

---

#### POST `/api/admin/ai/models` — 创建 AI 模型

**请求体**：
```json
{
  "name": "GPT-4o",
  "apiUrl": "https://api.gptgod.online/v1/chat/completions",
  "apiKey": "sk-...",
  "modelName": "gpt-4o",
  "isDefault": true
}
```

**响应** `200`：创建后的模型对象

---

#### PUT `/api/admin/ai/models/{id}` — 更新 AI 模型

**请求体**：同创建模型

**响应** `200`：更新后的模型对象

---

#### DELETE `/api/admin/ai/models/{id}` — 删除 AI 模型

**响应** `200`：
```json
{ "message": "模型已删除" }
```

---

### 7.4 学习中心接口

#### GET `/api/learning/topic/{id}` — 获取学习主题

**权限**：已登录用户

**响应** `200`：完整 Topic 对象

---

#### POST `/api/learning/warmup` — 生成热身内容

**权限**：已登录用户

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "mode": "beginner",
  "exclude": "已有内容"
}
```

**响应** `200`：
```json
{
  "content": "{\"introduction\":\"...\",\"warmupQuestions\":[...],\"keywords\":[...],\"speakingTips\":[...]}"
}
```

---

#### POST `/api/learning/vocabulary` — 生成词汇表

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "mode": "beginner",
  "exclude": "已有词汇"
}
```

**响应** `200`：
```json
{
  "content": "{\"vocabulary\":[{\"word\":\"...\",\"zh\":\"...\",\"example\":\"...\",\"category\":\"...\",\"difficulty\":\"basic\"}]}"
}
```

---

#### POST `/api/learning/expressions` — 生成表达模板

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "mode": "beginner",
  "exclude": "已有表达"
}
```

**响应** `200`：
```json
{
  "content": "{\"expressions\":[{\"category\":\"表达观点\",\"template\":\"...\",\"zh\":\"...\",\"example\":\"...\"}]}"
}
```

---

#### POST `/api/learning/tasks` — 生成练习任务

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "mode": "beginner",
  "exclude": "已有任务"
}
```

**响应** `200`：
```json
{
  "content": "{\"tasks\":[{\"title\":\"...\",\"titleZh\":\"...\",\"type\":\"...\",\"description\":\"...\",\"difficulty\":\"easy\"}]}"
}
```

---

#### POST `/api/learning/review` — AI 点评用户答案

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "taskTitle": "限时表达",
  "answer": "用户的口语回答",
  "mode": "beginner"
}
```

**响应** `200`：
```json
{
  "content": "{\"score\":85,\"strengths\":[...],\"improvements\":[...],\"corrections\":[...],\"encouragement\":\"...\"}"
}
```

---

## 8. 认证与安全

### 8.1 JWT 认证机制

| 配置项 | 值 |
|--------|-----|
| 算法 | HMAC-SHA |
| 密钥 | 配置文件中 `app.jwt.secret` |
| 有效期 | 24 小时（86400000 ms） |
| Payload | `sub`（username）、`role`（角色）、`iat`、`exp` |

**Token 生成流程**：
1. 用户登录/注册成功
2. `JwtUtils.generateToken(username, role)` 生成 token
3. 返回给前端，存入 `localStorage`

**Token 验证流程**：
1. `JwtFilter` 从 `Authorization` 头提取 token
2. `JwtUtils.isValid(token)` 验证签名和过期时间
3. 解析 username 和 role，创建 `UsernamePasswordAuthenticationToken`
4. 查询数据库获取完整用户信息，设置到 `auth.details`
5. 存入 `SecurityContextHolder`

### 8.2 路由权限矩阵

| 路由 | 方法 | 权限 |
|------|------|------|
| `/api/auth/**` | ALL | 公开 |
| `/api/topics` | GET | 公开 |
| `/api/topics/{id}` | GET | 公开 |
| `/api/topics/tags` | GET | 公开 |
| `/api/topics/stats` | GET | 公开 |
| `/api/topics/calendar` | GET | 公开 |
| `/api/admin/**` | ALL | `ROLE_ADMIN` |
| 其他所有路由 | ALL | 已认证用户 |

### 8.3 CORS 配置

- 允许来源：`http://localhost:3000`、`http://localhost:3001`
- 允许方法：全部
- 允许凭证：是

### 8.4 密码安全

- 使用 BCrypt 加密存储
- 注册时编码：`passwordEncoder.encode(password)`
- 登录时比对：`passwordEncoder.matches(rawPassword, encodedPassword)`

---

## 9. AI 内容生成

### 9.1 配置

| 配置项 | 值 |
|--------|-----|
| API 地址 | `https://api.gptgod.online/v1/chat/completions` |
| 模型 | `gpt-4o` |
| API Key | 配置文件 `app.ai.api-key` |
| 支持多模型 | 是（通过 `ai_models` 表管理） |

### 9.2 AI 模型管理

系统支持多个 AI 模型配置，存储在 `ai_models` 表中：

- **GET `/api/admin/ai/models`** — 获取所有模型列表
- **POST `/api/admin/ai/models`** — 创建新模型配置
- **PUT `/api/admin/ai/models/{id}`** — 更新模型配置
- **DELETE `/api/admin/ai/models/{id}`** — 删除模型配置

每个模型配置包含：`name`（显示名称）、`apiUrl`、`apiKey`、`modelName`、`isDefault`（是否默认）

### 9.3 AI 生成流程（旧接口 - 兼容）

#### POST `/api/admin/ai/generate` — 生成话题

支持多轮对话，用于快速生成话题。

**请求体**：
```json
{
  "prompt": "生成一个关于旅行的英语口语话题",
  "history": [
    { "role": "user", "content": "之前的提问" },
    { "role": "assistant", "content": "之前的回复" }
  ]
}
```

**响应** `200`：
```json
{
  "content": "{\"title\":\"Travel Adventures\",\"tags\":[\"travel\",\"culture\"],\"questions\":[{\"en\":\"...\",\"zh\":\"...\"}]}"
}
```

### 9.4 AI 生成流程（新接口 - 推荐）

#### POST `/api/admin/ai/generate-titles` — 批量生成主题标题

生成 5 个主题标题，自动避免与近一年主题重复。

**请求体**：
```json
{
  "prompt": "生成关于日常生活的话题",
  "modelId": 1
}
```

**响应** `200`：
```json
{
  "content": "{\"titles\":[{\"en\":\"Weekend Plans\",\"zh\":\"周末计划\"},{\"en\":\"Daily Habits\",\"zh\":\"日常习惯\"}]}"
}
```

#### POST `/api/admin/ai/generate-questions` — 根据主题生成问题

根据选中的主题标题生成 10 个讨论问题。

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "modelId": 1
}
```

**响应** `200`：
```json
{
  "content": "{\"questions\":[{\"en\":\"Where did you travel last?\",\"zh\":\"你上次去哪里旅行了？\"}]}"
}
```

### 9.5 学习中心 AI 接口

#### POST `/api/learning/warmup` — 生成热身内容

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "mode": "beginner",
  "exclude": "已有内容"
}
```

**响应** `200`：
```json
{
  "content": "{\"introduction\":\"...\",\"warmupQuestions\":[...],\"keywords\":[...],\"speakingTips\":[...]}"
}
```

#### POST `/api/learning/vocabulary` — 生成词汇表

#### POST `/api/learning/expressions` — 生成表达模板

#### POST `/api/learning/tasks` — 生成练习任务

#### POST `/api/learning/review` — AI 点评用户答案

**请求体**：
```json
{
  "titleEn": "Travel Experiences",
  "titleZh": "旅行经历",
  "taskTitle": "限时表达",
  "answer": "用户的口语回答",
  "mode": "beginner"
}
```

**响应** `200`：
```json
{
  "content": "{\"score\":85,\"strengths\":[...],\"improvements\":[...],\"corrections\":[...],\"encouragement\":\"...\"}"
}
```

### 9.6 System Prompt 设计

系统为不同的 AI 生成任务设计了专门的 System Prompt：

| 任务 | 特点 |
|------|------|
| **生成标题** | 避免与近一年主题重复，提示标题要宽泛 |
| **生成问题** | 由浅入深，前 2-3 个简单，中间 4-5 个中等，最后 2-3 个有深度 |
| **生成词汇** | 区分初级/进阶，初级避免过基础词汇，进阶增加地道表达 |
| **生成表达** | 按功能分类（表达观点、说明原因、举例说明等），提供模板 |
| **生成任务** | 初级：关键词开口、句型填充、短回答等；进阶：限时表达、观点展开、立场转换等 |
| **热身内容** | 简介、热身问题、关键词、角度提示 |
| **AI 点评** | 初级聚焦关键错误，进阶关注地道性和逻辑性 |

### 9.7 去重机制

- **标题去重**：生成标题时自动排除近一年内已有的主题
- **内容去重**：学习中心各模块支持 `exclude` 参数，传入已有内容避免重复生成

### 9.8 多轮对话支持

- 前端维护 `history` 数组，包含之前的 user/assistant 消息
- 每次请求携带完整对话历史，支持基于上下文的追问和修改
- 仅旧接口 `/api/admin/ai/generate` 支持多轮对话

---

## 10. 构建与部署

### 10.1 后端

```bash
# 编译打包
mvn clean package

# 运行（默认端口 8080）
java -jar target/xiaoyouyingyu-1.0-SNAPSHOT.jar

# 指定环境变量覆盖配置
java -jar target/xiaoyouyingyu-1.0-SNAPSHOT.jar \
  --spring.datasource.url=jdbc:mysql://localhost:3306/xiaoyouyingyu \
  --app.jwt.secret=your-production-secret \
  --app.ai.api-key=sk-your-key
```

### 10.2 前端

```bash
cd frontend

# 安装依赖
npm install

# 开发模式（端口 3000）
npm run dev

# 生产构建
npm run build

# 生产运行
npm start
```

### 10.3 前后端联调

前端通过 `next.config.js` 配置 API 代理，将 `/api` 请求转发到后端 `http://localhost:8080`。

---

## 11. 开发指南

### 11.1 新增一个 API 接口

1. **定义 Entity**（如需新表）：在 `entity/` 包中创建 JPA 实体类
2. **定义 Repository**：在 `repository/` 包中创建 `JpaRepository` 接口
3. **编写 Controller**：在 `controller/` 包中添加接口方法
4. **配置权限**：在 `SecurityConfig.java` 的 `authorizeHttpRequests` 中添加路由规则
5. **前端对接**：在 `frontend/src/lib/api.ts` 中添加 API 调用方法

### 11.2 新增一个前端页面

1. 在 `frontend/src/app/` 下创建目录和 `page.tsx`
2. Next.js 自动基于文件夹名生成路由
3. 在 `sidebar.tsx` 中添加导航入口
4. 使用 `useAuth()` 获取用户状态
5. 使用 `useQuery` / `useMutation`（TanStack Query）管理数据

### 11.3 代码规范

- **后端**：使用 Lombok 注解（`@Data`、`@RequiredArgsConstructor`）减少样板代码
- **前端**：使用 TypeScript 类型约束、Tailwind CSS 原子类编写样式
- **API**：RESTful 风格，路径小写，使用 HTTP 方法语义

### 11.4 数据库变更

当前使用 `ddl-auto: update`（Hibernate 自动更新 schema），生产环境建议切换为 `validate` 并使用数据库迁移工具（如 Flyway）。

---

## 12. 待改进事项

### 安全相关

- [ ] `application.yml` 中的数据库密码、JWT 密钥、AI API Key 应使用环境变量或密钥管理服务
- [ ] 用户列表接口 (`GET /api/admin/users`) 返回了密码哈希值，应在响应中排除 `password` 字段
- [ ] 默认管理员密码 (`admin123`) 应在首次登录后强制修改
- [ ] JWT 密钥 (`your-256-bit-secret-key-change-in-production-please`) 须更换为安全密钥
- [ ] CORS 允许来源应根据部署环境动态配置
- [ ] AI API Key 不应硬编码在配置文件中

### 功能增强

- [ ] 添加用户头像/个人资料功能
- [ ] 话题收藏/点赞功能
- [ ] 话题评论/讨论功能
- [ ] 数据导入/导出功能
- [ ] 话题分享功能
- [ ] 学习中心进度追踪（记录用户完成的热身、词汇、任务等）
- [ ] 学习中心成就系统（徽章、等级等）

### 工程化

- [ ] 添加 Dockerfile 和 docker-compose.yml
- [ ] 配置 CI/CD 流水线（GitHub Actions）
- [ ] 添加单元测试和集成测试
- [ ] 添加日志框架配置（logback）
- [ ] 使用 Flyway 管理数据库迁移
- [ ] 前端添加 ESLint / Prettier 配置
- [ ] 添加 API 限流和防刷机制
- [ ] 添加请求日志和性能监控

### 性能优化

- [ ] 添加数据库查询缓存（Redis）
- [ ] 优化 AI 生成接口的超时时间和重试机制
- [ ] 添加分页查询的性能优化
- [ ] 前端添加虚拟滚动优化长列表渲染

### 用户体验

- [ ] 学习中心支持离线模式
- [ ] 添加学习进度同步功能
- [ ] 优化移动端适配
- [ ] 添加深色模式支持

---

## 附录：环境变量参考

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `spring.datasource.url` | 数据库连接 URL | `jdbc:mysql://139.196.43.133:3306/xiaoyouyingyu?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Shanghai` |
| `spring.datasource.username` | 数据库用户名 | `root` |
| `spring.datasource.password` | 数据库密码 | *(见配置文件)* |
| `app.jwt.secret` | JWT 签名密钥 | `your-256-bit-secret-key-change-in-production-please` |
| `app.jwt.expiration-ms` | JWT 过期时间 (ms) | `86400000` (24h) |
| `app.ai.api-key` | AI API Key | *(需配置)* |
| `app.ai.api-url` | AI 接口地址 | `https://api.gptgod.online/v1/chat/completions` |
| `app.ai.model` | AI 模型名称 | `gpt-4o` |

## 附录：核心类说明

### 后端核心类

| 类 | 位置 | 职责 |
|------|------|------|
| `AiService` | `service/` | 统一的 AI 调用服务，支持多个 AI 生成任务 |
| `AiModel` | `entity/` | AI 模型配置实体，支持多模型管理 |
| `AiModelRepository` | `repository/` | AI 模型数据访问 |
| `TopicRepository` | `repository/` | 话题数据访问，包含自定义查询方法 |
| `LearningController` | `controller/` | 学习中心接口，调用 AiService 生成各类内容 |
| `AdminController` | `controller/` | 管理接口，包含话题/用户/AI 模型管理 |

### 前端核心方法

| 方法 | 位置 | 功能 |
|------|------|------|
| `aiGenerateTitles()` | `lib/api.ts` | 批量生成主题标题 |
| `aiGenerateQuestions()` | `lib/api.ts` | 根据主题生成讨论问题 |
| `generateWarmup()` | `lib/api.ts` | 生成热身内容 |
| `generateVocabulary()` | `lib/api.ts` | 生成词汇表 |
| `generateExpressions()` | `lib/api.ts` | 生成表达模板 |
| `generateTasks()` | `lib/api.ts` | 生成练习任务 |
| `reviewAnswer()` | `lib/api.ts` | AI 点评用户答案 |

## 附录：数据流示例

### 学习中心热身流程

```
用户进入学习中心 → 选择主题 → 点击"热身"
     ↓
前端调用 generateWarmup(titleEn, titleZh, mode)
     ↓
后端 LearningController.generateWarmup()
     ↓
AiService.generateWarmup() 构建 System Prompt
     ↓
HttpClient 调用 AI API（支持自定义模型）
     ↓
解析 AI 返回的 JSON
     ↓
前端解析并展示热身内容（简介、热身问题、关键词、角度提示）
```

### AI 生成话题流程（新接口）

```
管理员进入后台 → 点击"生成话题"
     ↓
前端调用 aiGenerateTitles(prompt)
     ↓
后端 AdminController.aiGenerateTitles()
     ↓
AiService.generateTitles() 获取近一年主题标题进行去重
     ↓
HttpClient 调用 AI API
     ↓
前端展示 5 个生成的标题供选择
     ↓
用户选择标题 → 前端调用 aiGenerateQuestions(titleEn, titleZh)
     ↓
后端生成 10 个讨论问题
     ↓
前端展示完整话题预览
     ↓
管理员确认保存 → 调用 createTopic() 保存到数据库
```
