# 职场英语初级单词本导入记录

- 执行日期：2026-06-27
- 单词本名称：职场英语
- 数据库单词本 ID：7
- 单词本等级：BEGINNER（初级）
- 单词本状态：PUBLISHED
- 入库源数据：`doc/generated/workplace-english-wordbook.json`
- 封面资产：`doc/generated/workplace-english-cover.svg`、`doc/generated/workplace-english-cover.png`

## 生成结果

- 生成词条总数：1000
- 初级词条：1000
- 已发布词条：1000
- 非单个英文单词：0
- 重复单词：0
- 必填字段缺失：0
- 中文释义等级/来源标签：0

## 入库结果

- `word_books`：新增 1 条，ID 为 7
- `words`：新增 1000 条
- 所有词条 `difficulty=BEGINNER`
- 所有词条 `status=PUBLISHED`
- 所有词条 `audio_status=PENDING`
- 音频 URL 暂为空，本次未生成音频，后续可用批量音频回填脚本补齐
- `phonetic` 暂留空，后续可由词典或发音服务补全

## 数据库验证

执行 `scripts/import_workplace_english_wordbook.java verify 7` 的结果：

- `book.level=BEGINNER`
- `book.status=PUBLISHED`
- `words.total=1000`
- `words.beginner=1000`
- `words.advanced=0`
- `words.published=1000`
- `words.pendingAudio=1000`
- `words.definitionLabelHits=0`
- 首词：`office`

## 使用脚本

- `scripts/import_workplace_english_wordbook.java`：事务导入单词本和词条，并执行数据库侧校验
