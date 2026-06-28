# 职场英语初级单词本生成记录

- 生成日期：2026-06-27
- 单词本名称：职场英语
- 单词本等级：BEGINNER（初级）
- 单词本状态：PUBLISHED（已发布）
- 生成规模：初级 1000 个，共 1000 个
- 入库源数据：`doc/generated/workplace-english-wordbook.json`
- 封面资产：`doc/generated/workplace-english-cover.svg`、`doc/generated/workplace-english-cover.png`
- 音频策略：本次不生成音频，导入后单词音频字段为空，`audio_status=PENDING`，后续可用批量音频回填脚本补齐。
- 音标策略：`phonetic` 字段暂留空，避免使用未经校验的机器音标；后续可由词典或发音服务补全。

## 数据结构

每个单词项包含：

`word`、`phonetic`、`partOfSpeech`、`definitionZh`、`definitionEn`、`commonPatterns`、`exampleEn`、`exampleZh`、`difficulty`、`status`、`sourceScene`、`sourceTopicId`、`sourceTopicTitle`、`sortOrder`。

## 校验结果

- 总数：1000
- 初级：1000
- 已发布：1000
- 非单个英文单词：0
- 重复单词：0
- 必填字段缺失：0
- 中文释义等级/来源标签：0

## 封面生成说明

当前会话未暴露 AI 图片生成工具，因此封面采用项目内确定性 SVG 设计并渲染 PNG。设计关键词：初级职场英语、办公桌、日历、消息、文件夹、清爽蓝绿专业色，适合词书卡片和后台预览。

## 样例（前 30 条）

| 序号 | 单词 | 词性 | 中文释义 | 常用句型/搭配 | 例句 |
|---:|---|---|---|---|---|
| 1 | office | noun | 办公室 | use the office; check the office; bring the office; ask about the office | Please check the office before the meeting. |
| 2 | building | noun | 建筑物 | use the building; check the building; bring the building; ask about the building | Please check the building before the meeting. |
| 3 | floor | noun | 楼层 | use the floor; check the floor; bring the floor; ask about the floor | Please check the floor before the meeting. |
| 4 | hall | noun | 大厅 | use the hall; check the hall; bring the hall; ask about the hall | Please check the hall before the meeting. |
| 5 | lobby | noun | 大厅 | use the lobby; check the lobby; bring the lobby; ask about the lobby | Please check the lobby before the meeting. |
| 6 | entrance | noun | 入口 | use the entrance; check the entrance; bring the entrance; ask about the entrance | Please check the entrance before the meeting. |
| 7 | exit | noun | 出口 | use the exit; check the exit; bring the exit; ask about the exit | Please check the exit before the meeting. |
| 8 | corridor | noun | 走廊 | use the corridor; check the corridor; bring the corridor; ask about the corridor | Please check the corridor before the meeting. |
| 9 | room | noun | 房间 | use the room; check the room; bring the room; ask about the room | Please check the room before the meeting. |
| 10 | meeting | noun | 会议 | use the meeting; check the meeting; bring the meeting; ask about the meeting | Please check the meeting before the meeting. |
| 11 | conference | noun | 会议 | use the conference; check the conference; bring the conference; ask about the conference | Please check the conference before the meeting. |
| 12 | kitchen | noun | 茶水间 | use the kitchen; check the kitchen; bring the kitchen; ask about the kitchen | Please check the kitchen before the meeting. |
| 13 | breakroom | noun | 休息室 | use the breakroom; check the breakroom; bring the breakroom; ask about the breakroom | Please check the breakroom before the meeting. |
| 14 | restroom | noun | 洗手间 | use the restroom; check the restroom; bring the restroom; ask about the restroom | Please check the restroom before the meeting. |
| 15 | elevator | noun | 电梯 | use the elevator; check the elevator; bring the elevator; ask about the elevator | Please check the elevator before the meeting. |
| 16 | stairs | noun | 楼梯 | use the stairs; check the stairs; bring the stairs; ask about the stairs | Please check the stairs before the meeting. |
| 17 | desk | noun | 书桌 | use the desk; check the desk; bring the desk; ask about the desk | Please check the desk before the meeting. |
| 18 | chair | noun | 椅子 | use the chair; check the chair; bring the chair; ask about the chair | Please check the chair before the meeting. |
| 19 | drawer | noun | 抽屉 | use the drawer; check the drawer; bring the drawer; ask about the drawer | Please check the drawer before the meeting. |
| 20 | cabinet | noun | 柜子 | use the cabinet; check the cabinet; bring the cabinet; ask about the cabinet | Please check the cabinet before the meeting. |
| 21 | shelf | noun | 架子 | use the shelf; check the shelf; bring the shelf; ask about the shelf | Please check the shelf before the meeting. |
| 22 | locker | noun | 储物柜 | use the locker; check the locker; bring the locker; ask about the locker | Please check the locker before the meeting. |
| 23 | lamp | noun | 台灯 | use the lamp; check the lamp; bring the lamp; ask about the lamp | Please check the lamp before the meeting. |
| 24 | clock | noun | 时钟 | use the clock; check the clock; bring the clock; ask about the clock | Please check the clock before the meeting. |
| 25 | calendar | noun | 日历 | use the calendar; check the calendar; bring the calendar; ask about the calendar | Please check the calendar before the meeting. |
| 26 | computer | noun | 电脑 | use the computer; check the computer; bring the computer; ask about the computer | Please check the computer before the meeting. |
| 27 | screen | noun | 屏幕 | use the screen; check the screen; bring the screen; ask about the screen | Please check the screen before the meeting. |
| 28 | monitor | noun | 显示器 | use the monitor; check the monitor; bring the monitor; ask about the monitor | Please check the monitor before the meeting. |
| 29 | keyboard | noun | 键盘 | use the keyboard; check the keyboard; bring the keyboard; ask about the keyboard | Please check the keyboard before the meeting. |
| 30 | mouse | noun | 鼠标 | use the mouse; check the mouse; bring the mouse; ask about the mouse | Please check the mouse before the meeting. |

## 完整数据

完整 1000 条数据请审阅 JSON：`doc/generated/workplace-english-wordbook.json`。
