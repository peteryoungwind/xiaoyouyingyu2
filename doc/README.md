# 小柚英语代码仓库说明文档

> 最后更新：2026-05-25

本文档集用于说明小柚英语仓库中的后端、PC 前端、微信小程序与接口数据模型，面向后续开发、维护、交接和 AI 编码代理检索。

## 文档目录

| 文档 | 内容 |
| --- | --- |
| [仓库总览](./repository-overview.md) | 项目目标、技术栈、目录结构、核心业务流 |
| [后端说明](./backend.md) | Spring Boot 代码结构、认证授权、业务模块、配置说明 |
| [PC 前端说明](./frontend.md) | Next.js 页面、组件、状态管理、接口封装 |
| [微信小程序说明](./miniapp.md) | 小程序页面、组件、登录态、会员与学习流程 |
| [接口与数据模型](./api-and-data-model.md) | REST API、实体表结构、权限边界、响应约定 |
| [开发与部署说明](./development-and-deployment.md) | 本地启动、构建、部署、配置与注意事项 |

## 快速定位

- 后端主工程：`src/main/java/com/xiaoyouyingyu`
- 后端配置：`src/main/resources/application.yml`
- PC 前端：`frontend`
- 小程序：`xiaochengxu/miniprogram`
- 小程序云函数：`xiaochengxu/cloudfunctions`
- 产品需求归档：`doc/prd`
- 既有部署记录：`doc/deploy.md`

## 项目一句话说明

小柚英语是一个英语口语主题与学习平台，包含：

- 后端：用户认证、话题管理、会员/卡密、AI 生成、学习中心接口。
- PC 前端：话题浏览、学习中心、管理后台、用户与卡密管理。
- 微信小程序：移动端话题浏览、微信登录、学习中心、会员兑换与 PC 扫码登录确认。

