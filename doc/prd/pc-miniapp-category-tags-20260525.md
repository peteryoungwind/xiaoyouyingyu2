# PC 与小程序分类标签对齐记录

> 日期：2026-05-25
> 背景：PC 端分类标签仍使用旧的 8 分类口径，而微信小程序与线上数据实际使用 9 分类口径。需要统一分类体系，同时保留小程序首页“热门标签”只展示 8 个的版面效果。

## 1. 改动目标

PC 端主题分类标签与微信小程序保持一致：

1. 使用同一组分类名称。
2. 使用同一分类排序。
3. PC 端和小程序除首页热门标签外，分类入口均展示完整 9 个分类。
4. 小程序首页“热门标签”只展示 9 个分类中的前 8 个。
5. 标签浅色背景与文字颜色对齐小程序分类元数据。

## 2. 统一分类名单

分类顺序以线上 `/api/topics/tags`、项目本地 `xiaoyou-speaking-topics` skill 与小程序 `xiaochengxu/miniprogram/utils/util.js` 中的 `CATEGORY_ORDER` 为准：

1. 自我成长
2. 情绪心理
3. 人际沟通
4. 生活习惯
5. 学习方法
6. 职场发展
7. 文化旅行
8. 兴趣娱乐
9. 消费科技

后端 `src/main/java/com/xiaoyouyingyu/config/TopicCategoryConstants.java` 使用相同名单进行标签归一化和校验。

## 3. 代码改动

### 3.1 PC 标签工具

文件：`frontend/src/lib/tag-colors.ts`

- 保留与小程序一致的 9 分类 `CATEGORY_ORDER`。
- 新增 `buildOrderedTagList(tagStats)`，逻辑与小程序 `util.buildOrderedTagList()` 对齐：
  - 始终按 `CATEGORY_ORDER` 输出完整 9 个分类。
  - 输出 `name`、`count`、`latestTitle`。
  - 若后端 `/api/topics/tags` 暂无某分类统计，则该分类 `count` 为 `0`、`latestTitle` 为空字符串。
- 将 PC 端分类标签浅色背景调整为小程序对应色值。

### 3.2 PC 首页

文件：`frontend/src/app/page.tsx`

- 首页“主题分类”改用 `buildOrderedTagList()` 生成完整 9 分类入口。
- 分类数量改为完整分类数量，即 9。

### 3.3 PC 主题列表

文件：`frontend/src/app/topics/page.tsx`

- 新增调用 `/api/topics/tags`。
- 分类筛选按钮改为使用 `buildOrderedTagList()`，展示完整 9 分类。

### 3.4 PC 学习中心

文件：`frontend/src/app/learning-center/page.tsx`

- 分类筛选按钮改为复用 `buildOrderedTagList()`。
- 与小程序学习中心保持“完整 9 分类 + 固定分类顺序”的口径。

### 3.5 小程序首页

文件：`xiaochengxu/miniprogram/pages/home/index.js`

- 小程序首页热门标签在 `buildOrderedTagList()` 后单独使用 `.slice(0, 8)`。
- 该限制只作用于首页热门标签，不影响小程序主题页、学习中心或 PC 端。

## 4. 使用方影响

1. 管理后台可选分类为完整 9 个分类，便于创建新主题。
2. 普通用户在 PC 首页、主题列表和学习中心看到完整 9 个分类。
3. 小程序主题页和学习中心展示完整 9 个分类。
4. 小程序首页热门标签只展示前 8 个分类，满足首页版面要求。
5. 后端接口和数据结构无变化，仍复用 `GET /api/topics/tags` 和主题 `tags` 字段。

## 5. 验证

已使用 Node 24 执行 PC 前端生产构建：

```bash
/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/next/dist/bin/next build
```

构建通过。
