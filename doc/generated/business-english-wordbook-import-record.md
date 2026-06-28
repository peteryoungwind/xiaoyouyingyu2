# 商务英语进阶单词本导入记录

- 执行日期：2026-06-27
- 单词本名称：商务英语
- 数据库单词本 ID：6
- 单词本等级：ADVANCED（进阶）
- 单词本状态：PUBLISHED
- 入库源数据：`doc/generated/business-english-wordbook.json`
- 封面资产：`doc/generated/business-english-cover.svg`、`doc/generated/business-english-cover.png`

## 生成结果

- 生成词条总数：1000
- 进阶词条：1000
- 已发布词条：1000
- 非单个英文单词：0
- 重复单词：0
- 必填字段缺失：0

## 入库结果

- `word_books`：新增 1 条，ID 为 6
- `words`：新增 1000 条
- 所有词条 `difficulty=ADVANCED`
- 所有词条 `status=PUBLISHED`
- 所有词条 `audio_status=PENDING`
- 音频 URL 暂为空，本次未生成音频，后续可用批量音频回填脚本补齐
- `phonetic` 暂留空，后续可由词典或发音服务补全

## 数据库验证

执行 `scripts/import_business_english_wordbook.java verify 6` 的结果：

- `book.level=ADVANCED`
- `book.status=PUBLISHED`
- `words.total=1000`
- `words.beginner=0`
- `words.advanced=1000`
- `words.published=1000`
- `words.pendingAudio=1000`
- 首词：`oversight`

## 使用脚本

- `scripts/import_business_english_wordbook.java`：事务导入单词本和词条，并执行数据库侧校验

## 2026-06-27 释义清理

- 背景：小程序单词详情页会单独展示等级，中文释义不应包含“进阶商务英语”等来源/等级说明。
- 源数据：已从 `doc/generated/business-english-wordbook.json` 和审阅 Markdown 中移除 `（进阶商务英语）`。
- 数据库：已对单词本 ID `6` 的 `words.definition_zh` 执行事务化清理，更新 1000 条，清理后剩余命中数为 0。
- 不变项：单词本等级仍为 `ADVANCED`，词条 `difficulty` 仍为 `ADVANCED`，音频状态仍为 `PENDING`。
