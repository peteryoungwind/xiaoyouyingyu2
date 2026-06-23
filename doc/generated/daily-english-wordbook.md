# 日常英语单词本生成草稿

- 生成日期：2026-06-08
- 单词本名称：日常英语
- 单词本状态：PUBLISHED（已发布）
- 生成规模：初级 500 个，进阶 500 个，共 1000 个
- 入库源数据：`doc/generated/daily-english-wordbook.json`
- 音标策略：`phonetic` 字段暂留空，避免使用未经校验的机器音标；确认入库后可用系统发音/词典流程补全。
- 音频策略：入库时音频字段留空，`audio_status` 为 `PENDING`，后续可走系统现有 TTS 补全流程。

## 数据结构

每个单词项包含：

`word`、`phonetic`、`partOfSpeech`、`definitionZh`、`definitionEn`、`commonPatterns`、`exampleEn`、`exampleZh`、`difficulty`、`status`、`sourceScene`、`sourceTopicId`、`sourceTopicTitle`、`sortOrder`。

## 校验结果

- 总数：1000
- 初级：500
- 进阶：500
- 已发布词条：1000
- 重复单词/短语：0
- 必填字段缺失：0
- 字段超长：0

## 初级样例（前 30 条）

| 难度 | 单词/短语 | 词性 | 中文释义 | 常用搭配/句型 | 例句 |
|---|---|---|---|---|---|
| BEGINNER | morning | noun | 早晨；上午（初级日常英语） | talk about the morning; need the morning; look for the morning; use the morning | We talked about the morning during our everyday conversation. |
| BEGINNER | afternoon | noun | 下午（初级日常英语） | talk about the afternoon; need the afternoon; look for the afternoon; use the afternoon | We talked about the afternoon during our everyday conversation. |
| BEGINNER | evening | noun | 傍晚；晚上（初级日常英语） | talk about the evening; need the evening; look for the evening; use the evening | We talked about the evening during our everyday conversation. |
| BEGINNER | night | noun | 夜晚（初级日常英语） | talk about the night; need the night; look for the night; use the night | We talked about the night during our everyday conversation. |
| BEGINNER | today | noun/adverb | 今天（初级日常英语） | today; later today; by today; from today | I have a simple plan for today. |
| BEGINNER | tomorrow | noun/adverb | 明天（初级日常英语） | tomorrow; later tomorrow; by tomorrow; from tomorrow | I have a simple plan for tomorrow. |
| BEGINNER | yesterday | noun/adverb | 昨天（初级日常英语） | yesterday; later yesterday; by yesterday; from yesterday | I have a simple plan for yesterday. |
| BEGINNER | weekend | noun | 周末（初级日常英语） | talk about the weekend; need the weekend; look for the weekend; use the weekend | We talked about the weekend during our everyday conversation. |
| BEGINNER | weekday | noun | 工作日（初级日常英语） | talk about the weekday; need the weekday; look for the weekday; use the weekday | We talked about the weekday during our everyday conversation. |
| BEGINNER | minute | noun | 分钟（初级日常英语） | talk about a minute; need a minute; look for a minute; use a minute | We talked about a minute during our everyday conversation. |
| BEGINNER | hour | noun | 小时（初级日常英语） | talk about an hour; need an hour; look for an hour; use an hour | We talked about an hour during our everyday conversation. |
| BEGINNER | day | noun | 一天；白天（初级日常英语） | talk about a day; need a day; look for a day; use a day | We talked about a day during our everyday conversation. |
| BEGINNER | week | noun | 星期（初级日常英语） | talk about a week; need a week; look for a week; use a week | We talked about a week during our everyday conversation. |
| BEGINNER | month | noun | 月份（初级日常英语） | talk about a month; need a month; look for a month; use a month | We talked about a month during our everyday conversation. |
| BEGINNER | year | noun | 年（初级日常英语） | talk about a year; need a year; look for a year; use a year | We talked about a year during our everyday conversation. |
| BEGINNER | breakfast | noun | 早餐（初级日常英语） | talk about a breakfast; need a breakfast; look for a breakfast; use a breakfast | We talked about a breakfast during our everyday conversation. |
| BEGINNER | lunch | noun | 午餐（初级日常英语） | talk about a lunch; need a lunch; look for a lunch; use a lunch | We talked about a lunch during our everyday conversation. |
| BEGINNER | dinner | noun | 晚餐（初级日常英语） | talk about a dinner; need a dinner; look for a dinner; use a dinner | We talked about a dinner during our everyday conversation. |
| BEGINNER | meal | noun | 一餐；饭（初级日常英语） | talk about a meal; need a meal; look for a meal; use a meal | We talked about a meal during our everyday conversation. |
| BEGINNER | snack | noun | 零食；小吃（初级日常英语） | talk about a snack; need a snack; look for a snack; use a snack | We talked about a snack during our everyday conversation. |
| BEGINNER | rice | noun | 米饭（初级日常英语） | talk about rice; need rice; look for rice; use rice | We talked about rice during our everyday conversation. |
| BEGINNER | noodles | noun | 面条（初级日常英语） | talk about noodles; need noodles; look for noodles; use noodles | We talked about noodles during our everyday conversation. |
| BEGINNER | bread | noun | 面包（初级日常英语） | talk about bread; need bread; look for bread; use bread | We talked about bread during our everyday conversation. |
| BEGINNER | egg | noun | 鸡蛋（初级日常英语） | talk about an egg; need an egg; look for an egg; use an egg | We talked about an egg during our everyday conversation. |
| BEGINNER | milk | noun | 牛奶（初级日常英语） | talk about milk; need milk; look for milk; use milk | We talked about milk during our everyday conversation. |
| BEGINNER | coffee | noun | 咖啡（初级日常英语） | talk about coffee; need coffee; look for coffee; use coffee | We talked about coffee during our everyday conversation. |
| BEGINNER | tea | noun | 茶（初级日常英语） | talk about tea; need tea; look for tea; use tea | We talked about tea during our everyday conversation. |
| BEGINNER | water | noun | 水（初级日常英语） | talk about water; need water; look for water; use water | We talked about water during our everyday conversation. |
| BEGINNER | juice | noun | 果汁（初级日常英语） | talk about juice; need juice; look for juice; use juice | We talked about juice during our everyday conversation. |
| BEGINNER | soup | noun | 汤（初级日常英语） | talk about soup; need soup; look for soup; use soup | We talked about soup during our everyday conversation. |

## 进阶样例（前 30 条）

| 难度 | 单词/短语 | 词性 | 中文释义 | 常用搭配/句型 | 例句 |
|---|---|---|---|---|---|
| ADVANCED | run errands | verb phrase | 办杂事；跑腿（进阶日常英语） | run errands; try to run errands; remember to run errands; find a way to run errands | I need to run errands today. |
| ADVANCED | sort out | verb phrase | 整理好；解决（进阶日常英语） | sort out; try to sort out; remember to sort out; find a way to sort out | I need to sort out today. |
| ADVANCED | tidy up | verb phrase | 收拾整齐（进阶日常英语） | tidy up; try to tidy up; remember to tidy up; find a way to tidy up | I need to tidy up today. |
| ADVANCED | freshen up | verb phrase | 梳洗一下；清爽一下（进阶日常英语） | freshen up; try to freshen up; remember to freshen up; find a way to freshen up | I need to freshen up today. |
| ADVANCED | stock up on | verb phrase | 囤一些；补充（进阶日常英语） | stock up on groceries; try to stock up on groceries; remember to stock up on groceries; find a way to stock up on groceries | I need to stock up on groceries today. |
| ADVANCED | cut down on | verb phrase | 减少（进阶日常英语） | cut down on coffee; try to cut down on coffee; remember to cut down on coffee; find a way to cut down on coffee | I need to cut down on coffee today. |
| ADVANCED | keep track of | verb phrase | 记录；跟踪（进阶日常英语） | keep track of my spending; try to keep track of my spending; remember to keep track of my spending; find a way to keep track of my spending | I need to keep track of my spending today. |
| ADVANCED | stick to a routine | verb phrase | 坚持作息（进阶日常英语） | stick to a routine; try to stick to a routine; remember to stick to a routine; find a way to stick to a routine | I need to stick to a routine today. |
| ADVANCED | fit something in | verb phrase | 抽时间安排某事（进阶日常英语） | fit a small task in; try to fit a small task in; remember to fit a small task in; find a way to fit a small task in | I need to fit a small task in today. |
| ADVANCED | catch up on | verb phrase | 补上；赶做（进阶日常英语） | catch up on sleep; try to catch up on sleep; remember to catch up on sleep; find a way to catch up on sleep | I need to catch up on sleep today. |
| ADVANCED | wind down | verb phrase | 放松下来（进阶日常英语） | wind down; try to wind down; remember to wind down; find a way to wind down | I need to wind down today. |
| ADVANCED | sleep in | verb phrase | 睡懒觉（进阶日常英语） | sleep in; try to sleep in; remember to sleep in; find a way to sleep in | I need to sleep in today. |
| ADVANCED | stay up late | verb phrase | 熬夜（进阶日常英语） | stay up late; try to stay up late; remember to stay up late; find a way to stay up late | I need to stay up late today. |
| ADVANCED | get around to | verb phrase | 终于抽时间做（进阶日常英语） | get around to cleaning my room; try to get around to cleaning my room; remember to get around to cleaning my room; find a way to get around to cleaning my room | I need to get around to cleaning my room today. |
| ADVANCED | put something off | verb phrase | 推迟某事（进阶日常英语） | put a small task off; try to put a small task off; remember to put a small task off; find a way to put a small task off | I need to put a small task off today. |
| ADVANCED | drop by | verb phrase | 顺路拜访（进阶日常英语） | drop by; try to drop by; remember to drop by; find a way to drop by | I need to drop by today. |
| ADVANCED | come over | verb phrase | 来家里；过来（进阶日常英语） | come over; try to come over; remember to come over; find a way to come over | I need to come over today. |
| ADVANCED | head out | verb phrase | 出门（进阶日常英语） | head out; try to head out; remember to head out; find a way to head out | I need to head out today. |
| ADVANCED | head back | verb phrase | 返回（进阶日常英语） | head back; try to head back; remember to head back; find a way to head back | I need to head back today. |
| ADVANCED | get stuck in traffic | verb phrase | 堵在路上（进阶日常英语） | get stuck in traffic; try to get stuck in traffic; remember to get stuck in traffic; find a way to get stuck in traffic | I need to get stuck in traffic today. |
| ADVANCED | miss the train | verb phrase | 错过火车（进阶日常英语） | miss the train; try to miss the train; remember to miss the train; find a way to miss the train | I need to miss the train today. |
| ADVANCED | catch the last bus | verb phrase | 赶上末班车（进阶日常英语） | catch the last bus; try to catch the last bus; remember to catch the last bus; find a way to catch the last bus | I need to catch the last bus today. |
| ADVANCED | give someone a lift | verb phrase | 开车捎某人（进阶日常英语） | give my friend a lift; try to give my friend a lift; remember to give my friend a lift; find a way to give my friend a lift | I need to give my friend a lift today. |
| ADVANCED | get a ride | verb phrase | 搭车（进阶日常英语） | get a ride; try to get a ride; remember to get a ride; find a way to get a ride | I need to get a ride today. |
| ADVANCED | take a shortcut | verb phrase | 抄近路（进阶日常英语） | take a shortcut; try to take a shortcut; remember to take a shortcut; find a way to take a shortcut | I need to take a shortcut today. |
| ADVANCED | take the long way | verb phrase | 绕远路（进阶日常英语） | take the long way; try to take the long way; remember to take the long way; find a way to take the long way | I need to take the long way today. |
| ADVANCED | pick someone up | verb phrase | 接某人（进阶日常英语） | pick my friend up; try to pick my friend up; remember to pick my friend up; find a way to pick my friend up | I need to pick my friend up today. |
| ADVANCED | drop someone off | verb phrase | 送某人下车（进阶日常英语） | drop my friend off; try to drop my friend off; remember to drop my friend off; find a way to drop my friend off | I need to drop my friend off today. |
| ADVANCED | check in | verb phrase | 办理入住；报平安（进阶日常英语） | check in; try to check in; remember to check in; find a way to check in | I need to check in today. |
| ADVANCED | check out | verb phrase | 退房；查看（进阶日常英语） | check out; try to check out; remember to check out; find a way to check out | I need to check out today. |

## 完整数据

完整 1000 条数据请审阅 JSON：`doc/generated/daily-english-wordbook.json`。确认后我会按该文件新建 `PUBLISHED` 单词本并批量插入数据库。
