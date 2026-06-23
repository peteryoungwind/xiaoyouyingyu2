# 小柚口语单词本导入记录

- 执行日期：2026-06-08
- 单词本名称：小柚口语单词本
- 数据库单词本 ID：5
- 单词本状态：PUBLISHED
- 主题来源：系统现有口语主题快照 `doc/generated/xiaoyou-topic-snapshot.json`
- 入库源数据：`doc/generated/xiaoyou-topic-wordbook.json`

## 生成结果

- 系统主题数：260
- 覆盖来源主题：260
- 生成词条总数：1600
- 初级词条：800
- 进阶词条：800
- 重复短语：0
- 必填字段缺失：0
- 字段超长：0

## 入库结果

- `word_books`：新增 1 条，ID 为 5
- `words`：新增 1600 条
- `word_book_topics`：新增 260 条
- `word_topics`：新增 1600 条
- 所有词条状态均为 `PUBLISHED`
- 音频状态为 `PENDING`
- `phonetic` 暂留空，后续可由词典或发音服务补全

## 使用脚本

- `scripts/export_topics_for_wordbook.java`：导出系统现有口语主题快照
- `scripts/generate_xiaoyou_topic_wordbook.mjs`：基于主题快照生成单词本 JSON 和审阅 Markdown
- `scripts/import_xiaoyou_topic_wordbook.java`：事务导入单词本、词条和主题关联，并执行数据库侧校验
