# 跟读精听 Markdown 导入脚本

将 Lingohow 类 Markdown 资料解析为 `shadowing_lessons` 数据。

素材格式请使用同目录下的 `shadowing_lesson_template.md`。后续让 AI 整理资料时，要求它严格保留模板中的一级/二级标题、字段名和列表结构，替换具体内容即可。

## 用法

```bash
node scripts/import-shadowing-lessons/import_shadowing_lessons.js --file /abs/path/lesson.md --out /tmp/shadowing.sql
```

默认只生成 SQL。确认后可手动执行：

```bash
mysql "$XIAOYOU_DB_URL" -u"$XIAOYOU_DB_USER" -p"$XIAOYOU_DB_PASSWORD" < /tmp/shadowing.sql
```

也可以直接执行：

```bash
node scripts/import-shadowing-lessons/import_shadowing_lessons.js --file /abs/path/lesson.md --execute
```

直接执行模式依赖本机 `mysql` CLI，并读取以下环境变量：

- `XIAOYOU_DB_URL`：JDBC URL 或 MySQL URL。
- `XIAOYOU_DB_USER`：数据库用户。
- `XIAOYOU_DB_PASSWORD`：数据库密码。

重复导入会按 `source_url` 幂等更新。
