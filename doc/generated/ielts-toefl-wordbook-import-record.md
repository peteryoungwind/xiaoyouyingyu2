# 雅思托福单词本导入记录

- 导入日期：2026-06-27
- 数据库单词本 ID：`9`
- 单词本名称：雅思托福
- 单词本等级：`ADVANCED`
- 单词本状态：`PUBLISHED`
- 源数据：`doc/generated/ielts-toefl-wordbook.json`
- 封面资产：`doc/generated/ielts-toefl-cover.svg`、`doc/generated/ielts-toefl-cover.png`
- 导入脚本：`scripts/import_ielts_toefl_wordbook.java`

## 导入结果

```text
IMPORT_OK
wordBookId=9
wordBookName=\u96c5\u601d\u6258\u798f
inserted=1000
beginner=0
advanced=1000
published=1000
pendingAudio=1000
```

## 查库验证

```text
book.id=9
book.name=\u96c5\u601d\u6258\u798f
book.level=ADVANCED
book.status=PUBLISHED
book.scene=\u96c5\u601d\u6258\u798f
words.total=1000
words.beginner=0
words.advanced=1000
words.published=1000
words.pendingAudio=1000
words.definitionLabelHits=0
```

## 内容约束

- 1000 个词条均为单个英文单词，仅包含小写英文字母。
- 词条 `difficulty` 全部为 `ADVANCED`，`status` 全部为 `PUBLISHED`。
- 中文释义只保留词义，不包含“进阶”“雅思托福”等等级或来源标签。
- 本次未生成音频，导入后 `audio_status` 全部为 `PENDING`。
