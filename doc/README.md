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
| [跟读精听模块需求](./prd/shadowing-intensive-listening-miniapp-requirements-20260624.md) | 微信小程序跟读精听模块的产品方案、页面设计、数据模型、接口和验收标准 |
| [跟读精听开发计划](./prd/shadowing-intensive-listening-miniapp-development-plan-20260625.md) | 跟读精听模块的实施步骤、后端数据模型、导入脚本、小程序页面和验收计划 |
| [跟读精听 HTML 原型](./prototypes/shadowing-intensive-listening/index.html) | 跟读精听模块列表、游客试看、完整详情和 AI 点评结果的可浏览原型 |
| [每日外刊精读需求](./prd/daily-articles-intensive-reading-requirements-20260626.md) | 每日外刊精读升级的字段、交互、播放器、长难句和导入格式 |
| [每日外刊精读开发计划](./prd/daily-articles-intensive-reading-development-plan-20260626.md) | 每日外刊精读升级的实施步骤、文件清单和验收标准 |
| [每日外刊精读 HTML 原型](./prototypes/daily-articles-intensive-reading/index.html) | 每日外刊列表封面、精读详情、播放器和状态页的可浏览原型 |
| [会员套餐与微信小程序支付需求](./prd/membership-wechat-miniapp-pay-requirements-20260627.md) | 会员套餐、微信小程序支付、订单管理、动态会员权限和微信支付配置清单 |
| [会员套餐与微信小程序支付开发计划](./prd/membership-wechat-miniapp-pay-development-plan-20260627.md) | 基于会员支付需求的后端、PC 后台、小程序、微信支付联调、测试和上线实施计划 |

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
