# 商务英语进阶单词本生成记录

- 生成日期：2026-06-27
- 单词本名称：商务英语
- 单词本等级：ADVANCED（进阶）
- 单词本状态：PUBLISHED（已发布）
- 生成规模：进阶 1000 个，共 1000 个
- 入库源数据：`doc/generated/business-english-wordbook.json`
- 封面资产：`doc/generated/business-english-cover.svg`、`doc/generated/business-english-cover.png`
- 音频策略：本次不生成音频，导入后单词音频字段为空，`audio_status=PENDING`，后续可用批量音频回填脚本补齐。
- 音标策略：`phonetic` 字段暂留空，避免使用未经校验的机器音标；后续可由词典或发音服务补全。

## 数据结构

每个单词项包含：

`word`、`phonetic`、`partOfSpeech`、`definitionZh`、`definitionEn`、`commonPatterns`、`exampleEn`、`exampleZh`、`difficulty`、`status`、`sourceScene`、`sourceTopicId`、`sourceTopicTitle`、`sortOrder`。

## 校验结果

- 总数：1000
- 进阶：1000
- 已发布：1000
- 非单个英文单词：0
- 重复单词：0
- 必填字段缺失：0

## 封面生成说明

当前会话未暴露 AI 图片生成工具，因此封面采用项目内确定性 SVG 设计并渲染 PNG。设计关键词：高级商务英语、国际化办公、数据图表、合同文档、深蓝与青绿专业色，适合词书卡片和后台预览。

## 样例（前 30 条）

| 序号 | 单词 | 词性 | 中文释义 | 常用句型/搭配 | 例句 |
|---:|---|---|---|---|---|
| 1 | oversight | noun | 监督；监管 | assess oversight; improve oversight; manage oversight; discuss oversight | The finance team reviewed the oversight before finalizing the quarterly report. |
| 2 | compliance | noun | 合规；遵从 | assess compliance; improve compliance; manage compliance; discuss compliance | The finance team reviewed the compliance before finalizing the quarterly report. |
| 3 | accountability | noun | 责任制；问责 | assess accountability; improve accountability; manage accountability; discuss accountability | The finance team reviewed the accountability before finalizing the quarterly report. |
| 4 | transparency | noun | 透明度 | assess transparency; improve transparency; manage transparency; discuss transparency | The finance team reviewed the transparency before finalizing the quarterly report. |
| 5 | stewardship | noun | 管理责任；受托管理 | assess stewardship; improve stewardship; manage stewardship; discuss stewardship | The finance team reviewed the stewardship before finalizing the quarterly report. |
| 6 | fiduciary | adjective | 受信托的；信义责任的 | fiduciary strategy; fiduciary terms; fiduciary organization; fiduciary assessment | The company adopted a more fiduciary strategy for the regional expansion. |
| 7 | delegation | noun | 授权；委派 | assess delegation; improve delegation; manage delegation; discuss delegation | The finance team reviewed the delegation before finalizing the quarterly report. |
| 8 | authorization | noun | 授权 | assess authorization; improve authorization; manage authorization; discuss authorization | The finance team reviewed the authorization before finalizing the quarterly report. |
| 9 | regulation | noun | 规章；监管 | assess regulation; improve regulation; manage regulation; discuss regulation | The finance team reviewed the regulation before finalizing the quarterly report. |
| 10 | audit | noun | 审计 | assess audit; improve audit; manage audit; discuss audit | The finance team reviewed the audit before finalizing the quarterly report. |
| 11 | assurance | noun | 保证；确信 | assess assurance; improve assurance; manage assurance; discuss assurance | The finance team reviewed the assurance before finalizing the quarterly report. |
| 12 | monitoring | noun | 监控 | assess monitoring; improve monitoring; manage monitoring; discuss monitoring | The finance team reviewed the monitoring before finalizing the quarterly report. |
| 13 | enforcement | noun | 执行；实施 | assess enforcement; improve enforcement; manage enforcement; discuss enforcement | The finance team reviewed the enforcement before finalizing the quarterly report. |
| 14 | adjudication | noun | 裁决 | assess adjudication; improve adjudication; manage adjudication; discuss adjudication | The finance team reviewed the adjudication before finalizing the quarterly report. |
| 15 | arbitration | noun | 仲裁 | assess arbitration; improve arbitration; manage arbitration; discuss arbitration | The finance team reviewed the arbitration before finalizing the quarterly report. |
| 16 | mediation | noun | 调解 | assess mediation; improve mediation; manage mediation; discuss mediation | The finance team reviewed the mediation before finalizing the quarterly report. |
| 17 | governance | noun | 治理结构 | assess governance; improve governance; manage governance; discuss governance | The finance team reviewed the governance before finalizing the quarterly report. |
| 18 | reporting | noun | 报告 | assess reporting; improve reporting; manage reporting; discuss reporting | The finance team reviewed the reporting before finalizing the quarterly report. |
| 19 | disclosure | noun | 披露 | assess disclosure; improve disclosure; manage disclosure; discuss disclosure | The finance team reviewed the disclosure before finalizing the quarterly report. |
| 20 | scrutiny | noun | 审查；仔细检查 | assess scrutiny; improve scrutiny; manage scrutiny; discuss scrutiny | The finance team reviewed the scrutiny before finalizing the quarterly report. |
| 21 | control | noun | 控制 | assess control; improve control; manage control; discuss control | The finance team reviewed the control before finalizing the quarterly report. |
| 22 | integrity | noun | 正直；完整性 | assess integrity; improve integrity; manage integrity; discuss integrity | The finance team reviewed the integrity before finalizing the quarterly report. |
| 23 | ethics | noun | 伦理 | assess ethics; improve ethics; manage ethics; discuss ethics | The finance team reviewed the ethics before finalizing the quarterly report. |
| 24 | alignment | noun | 对齐；一致性 | assess alignment; improve alignment; manage alignment; discuss alignment | The finance team reviewed the alignment before finalizing the quarterly report. |
| 25 | positioning | noun | 定位 | assess positioning; improve positioning; manage positioning; discuss positioning | The finance team reviewed the positioning before finalizing the quarterly report. |
| 26 | differentiation | noun | 差异化 | assess differentiation; improve differentiation; manage differentiation; discuss differentiation | The finance team reviewed the differentiation before finalizing the quarterly report. |
| 27 | diversification | noun | 多元化 | assess diversification; improve diversification; manage diversification; discuss diversification | The finance team reviewed the diversification before finalizing the quarterly report. |
| 28 | consolidation | noun | 整合；合并 | assess consolidation; improve consolidation; manage consolidation; discuss consolidation | The finance team reviewed the consolidation before finalizing the quarterly report. |
| 29 | expansion | noun | 扩张 | assess expansion; improve expansion; manage expansion; discuss expansion | The finance team reviewed the expansion before finalizing the quarterly report. |
| 30 | optimization | noun | 优化 | assess optimization; improve optimization; manage optimization; discuss optimization | The finance team reviewed the optimization before finalizing the quarterly report. |

## 完整数据

完整 1000 条数据请审阅 JSON：`doc/generated/business-english-wordbook.json`。
