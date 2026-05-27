# 开发与部署说明

> 最后更新：2026-05-25

## 本地开发环境

建议版本：

- JDK 21
- Maven 3.9+
- Node.js 20+
- npm 10+
- MySQL 8+
- 微信开发者工具

## 后端本地启动

在仓库根目录执行：

```bash
mvn spring-boot:run
```

默认端口：

- 后端：`http://localhost:8080`
- API 前缀：`http://localhost:8080/api`

## PC 前端本地启动

```bash
cd frontend
npm install
npm run dev
```

默认地址：

- `http://localhost:3000`

`frontend/next.config.js` 会将 `/api/:path*` 代理到：

- 开发环境：`http://localhost:8080/api/:path*`
- 生产环境：`https://xiaoyou-ky.top/api/:path*`

## 小程序本地开发

1. 使用微信开发者工具打开 `xiaochengxu` 目录。
2. 确认 `project.config.json` 中的 AppID 与实际小程序一致。
3. `miniprogram/app.js` 中 `develop` 指向 `http://localhost:8080/api`，用于微信开发者工具本地联调。
4. `trial` 和 `release` 指向生产 API；如需真机调试本地后端，需改成手机可访问的局域网地址或测试域名。

## 数据库初始化

当前项目使用 JPA `ddl-auto: update` 自动同步实体字段。

注意：

- `src/main/resources/schema.sql` 是早期初始化脚本，仅可作为参考。
- 当前真实结构包含会员、卡密、AI 模型、微信 openid 等字段，应以 JPA 实体为准。
- 生产数据库变更建议引入 Flyway 或 Liquibase 管理。

## 后端配置建议

当前 `application.yml` 中包含数据库、微信、JWT、AI 配置。生产环境建议改成环境变量。

示例：

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

wechat:
  appid: ${WECHAT_APPID}
  secret: ${WECHAT_SECRET}

app:
  jwt:
    secret: ${APP_JWT_SECRET}
    expiration-ms: ${APP_JWT_EXPIRATION_MS:86400000}
  ai:
    api-key: ${APP_AI_API_KEY}
    api-url: ${APP_AI_API_URL}
    model: ${APP_AI_MODEL:gpt-4o}
```

## 构建命令

### 后端

```bash
mvn clean package
```

### PC 前端

```bash
cd frontend
npm run build
```

## 推荐生产部署结构

可参考既有文档 `doc/deploy.md`。推荐结构：

```text
Nginx 80/443
├── /api -> Spring Boot 8080
└── /    -> Next.js 3000
```

服务器目录示例：

```text
/opt/xiaoyouyingyu/
├── backend/
│   ├── app.jar
│   └── logs/
├── frontend/
│   ├── .next/
│   ├── package.json
│   └── logs/
├── upload/
├── scripts/
└── backups/
```

## 小程序发布

小程序按微信官方流程：

1. 微信开发者工具上传代码。
2. 在小程序后台提交审核。
3. 审核通过后发布。

发布前检查：

- `app.js` 中 release API 地址正确。
- 后端已配置对应小程序 AppID/Secret。
- 业务域名已在微信公众平台配置并通过 HTTPS。
- 需要访问的后端接口已经允许小程序域名/来源。

## 常用账号与权限

后端启动时 `DataInit` 会创建或重置默认管理员：

- 用户名：`admin`
- 密码：`admin123`
- 角色：`ADMIN`

生产环境建议：

- 首次登录后立即修改默认密码。
- 移除或调整 `DataInit` 的重置行为，避免每次重启覆盖管理员密码。

## 开发注意事项

### 敏感信息

不要在仓库中提交：

- 数据库密码。
- JWT 密钥。
- 微信 AppSecret。
- AI API Key。
- 生产服务器连接信息。

### AI 返回格式

后端提示词要求 AI 返回严格 JSON，但外部模型仍可能返回 Markdown 代码块或非 JSON 内容。

前端和小程序需要：

- 去掉 ```json 代码块包裹。
- 捕获 `JSON.parse` 异常。
- 提供重试提示。

### 会员权限

学习中心权限由两部分组成：

- 静态角色：`ADMIN`、`PREMIUM_USER`。
- 动态角色：用户 `membershipExpireAt` 未过期时，`JwtFilter` 添加 `ROLE_MEMBER`。

当用户兑换卡密后：

- 客户端应刷新会员状态。
- 如果旧 token 中 role 仍是 `USER`，动态会员判断会在每次请求时查库并添加 `ROLE_MEMBER`。

### PC 扫码登录

PC 扫码登录 ticket 目前存在后端内存中。

部署限制：

- 单实例可用。
- 多实例或滚动发布可能导致 ticket 丢失。
- 如要扩容，建议迁移到 Redis。

### 小程序云函数

`cloudfunctions/api` 中包含历史重复业务实现，且有硬编码配置。当前小程序主链路不依赖它。

建议后续二选一：

- 保留 REST API 主链路，移除或归档云函数重复代码。
- 改为云函数主链路，并移除小程序直连 REST API。

## 质量检查建议

后端：

```bash
mvn test
```

前端：

```bash
cd frontend
npm run build
```

小程序：

- 使用微信开发者工具编译。
- 检查登录、主题列表、学习中心、卡密兑换、PC 登录确认。
