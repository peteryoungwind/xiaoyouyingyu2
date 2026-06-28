# 小柚口语进阶单词本导入记录

- 导入日期：2026-06-27
- 数据库单词本 ID：`10`
- 单词本名称：小柚口语进阶
- 单词本等级：`ADVANCED`
- 单词本状态：`PUBLISHED`
- 覆盖口语主题：263 个
- 源数据：`doc/generated/xiaoyou-speaking-advanced-wordbook.json`
- 主题快照：`doc/generated/xiaoyou-topic-snapshot.json`
- 封面资产：`doc/generated/xiaoyou-speaking-advanced-cover.svg`、`doc/generated/xiaoyou-speaking-advanced-cover.png`
- 导入脚本：`scripts/import_xiaoyou_speaking_advanced_wordbook.java`

## 导入结果

```text
IMPORT_OK
wordBookId=10
wordBookName=\u5c0f\u67da\u53e3\u8bed\u8fdb\u9636
insertedWords=1000
insertedWordTopics=1000
linkedBookTopics=263
total=1000
beginner=0
advanced=1000
published=1000
linkedTopics=263
```

## 查库验证

```text
book.id=10
book.name=\u5c0f\u67da\u53e3\u8bed\u8fdb\u9636
book.level=ADVANCED
book.status=PUBLISHED
book.scene=\u5c0f\u67da\u82f1\u8bed\u73b0\u6709\u53e3\u8bed\u4e3b\u9898
words.total=1000
words.beginner=0
words.advanced=1000
words.published=1000
words.pendingAudio=1000
words.definitionLabelHits=0
book.linkedTopics=263
```

## 内容约束

- 1000 个词条均为不重复的单个英文单词，仅包含小写英文字母。
- 词条 `difficulty` 全部为 `ADVANCED`，`status` 全部为 `PUBLISHED`。
- 当前 263 个口语主题均有关联词条，同一主题词条连续排列。
- 每个主题分配 3 到 4 个词条；前 211 个主题各 4 个词，其余 52 个主题各 3 个词。
- 中文释义只保留词义，不包含“小柚口语进阶”“进阶”等等级或来源标签。
- 本次未生成音频，导入后 `audio_status` 全部为 `PENDING`。
