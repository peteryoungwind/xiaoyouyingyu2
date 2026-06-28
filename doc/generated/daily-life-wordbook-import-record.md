# 日常生活单词本导入记录

- 导入日期：2026-06-27
- 数据库单词本 ID：`8`
- 单词本名称：日常生活
- 单词本等级：`BEGINNER`
- 单词本状态：`PUBLISHED`
- 源数据：`doc/generated/daily-life-wordbook.json`
- 封面资产：`doc/generated/daily-life-cover.svg`、`doc/generated/daily-life-cover.png`
- 导入脚本：`scripts/import_daily_life_wordbook.java`

## 导入结果

```text
IMPORT_OK
wordBookId=8
wordBookName=\u65e5\u5e38\u751f\u6d3b
inserted=1000
beginner=1000
advanced=0
published=1000
pendingAudio=1000
```

## 查库验证

```text
book.id=8
book.name=\u65e5\u5e38\u751f\u6d3b
book.level=BEGINNER
book.status=PUBLISHED
book.scene=\u65e5\u5e38\u751f\u6d3b
words.total=1000
words.beginner=1000
words.advanced=0
words.published=1000
words.pendingAudio=1000
words.definitionLabelHits=0
```

## 内容约束

- 1000 个词条均为单个英文单词，仅包含小写英文字母。
- 词条 `difficulty` 全部为 `BEGINNER`，`status` 全部为 `PUBLISHED`。
- 中文释义只保留词义，不包含“初级”“日常生活”等等级或来源标签。
- 本次未生成音频，导入后 `audio_status` 全部为 `PENDING`。
