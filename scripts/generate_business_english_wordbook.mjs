import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'doc/generated');

const beginnerTsv = `
company	noun	公司；企业
business	noun	生意；业务
office	noun	办公室
team	noun	团队
manager	noun	经理；主管
employee	noun	员工
colleague	noun	同事
client	noun	客户；委托方
customer	noun	顾客
partner	noun	合作伙伴
boss	noun	老板；上司
staff	noun	全体员工
department	noun	部门
position	noun	职位
role	noun	角色；职责
task	noun	任务
deadline	noun	截止日期
schedule	noun	日程；安排
plan	noun	计划
goal	noun	目标
meeting	noun	会议
agenda	noun	议程
minutes	noun	会议纪要
presentation	noun	演示；汇报
slide	noun	幻灯片
report	noun	报告
update	noun/verb	更新；进展说明
briefing	noun	简报；说明会
discussion	noun	讨论
decision	noun	决定
email	noun	电子邮件
message	noun	消息
reply	verb/noun	回复
forward	verb	转发
attach	verb	附上；附加
attachment	noun	附件
subject line	noun phrase	邮件主题行
inbox	noun	收件箱
cc	verb/noun	抄送
follow up	verb phrase	跟进
call	noun/verb	电话；通话
video call	noun phrase	视频会议
contact	noun/verb	联系；联系人
confirm	verb	确认
check	verb	检查；确认
ask	verb	询问
answer	verb/noun	回答；答案
explain	verb	解释
share	verb	分享
send	verb	发送
product	noun	产品
service	noun	服务
price	noun	价格
cost	noun	成本；费用
budget	noun	预算
invoice	noun	发票
payment	noun	付款
receipt	noun	收据
discount	noun	折扣
profit	noun	利润
loss	noun	亏损；损失
revenue	noun	收入；营收
income	noun	收入
expense	noun	支出；费用
cash	noun	现金
bank account	noun phrase	银行账户
tax	noun	税；税款
salary	noun	工资
bonus	noun	奖金
commission	noun	佣金
sale	noun	销售；一笔交易
sales team	noun phrase	销售团队
lead	noun	销售线索；潜在客户
order	noun/verb	订单；订购
deal	noun	交易；协议
contract	noun	合同
quote	noun/verb	报价；引用
proposal	noun	方案；提案
offer	noun/verb	报价；提供
delivery	noun	交付；送货
warehouse	noun	仓库
stock	noun	库存
inventory	noun	库存清单
supplier	noun	供应商
vendor	noun	供应商；卖方
purchase	noun/verb	采购；购买
shipping	noun	运输；发货
package	noun/verb	包裹；包装
quality	noun	质量
sample	noun	样品
brand	noun	品牌
market	noun	市场
marketing	noun	市场营销
advertising	noun	广告
campaign	noun	营销活动
website	noun	网站
social media	noun phrase	社交媒体
content	noun	内容
audience	noun	受众
feedback	noun	反馈
review	noun/verb	评价；复盘
rating	noun	评分
survey	noun	问卷调查
research	noun/verb	研究；调研
competitor	noun	竞争对手
feature	noun	功能；特点
benefit	noun	好处；利益
value	noun	价值
demand	noun	需求
trend	noun	趋势
project	noun	项目
progress	noun	进度
status	noun	状态
issue	noun	问题；事项
problem	noun	问题
solution	noun	解决方案
risk	noun	风险
change	noun/verb	变化；更改
priority	noun	优先级
resource	noun	资源
training	noun	培训
interview	noun/verb	面试；采访
resume	noun	简历
candidate	noun	候选人
hire	verb	雇用
onboard	verb	入职培训；引导
leave	noun	休假
vacation	noun	假期
attendance	noun	出勤
performance	noun	绩效；表现
policy	noun	政策；制度
rule	noun	规则
procedure	noun	流程
approval	noun	审批；批准
permission	noun	许可；权限
request	noun/verb	请求
form	noun	表格
document	noun	文件
file	noun	文件
record	noun	记录
local	adjective	本地的；当地的
global	adjective	全球的
branch	noun	分支机构；分店
headquarters	noun	总部
factory	noun	工厂
store	noun	门店
counter	noun	柜台
desk	noun	办公桌；服务台
reception	noun	前台；接待
visitor	noun	访客
business trip	noun phrase	商务出差
flight	noun	航班
hotel	noun	酒店
booking	noun	预订
itinerary	noun	行程安排
transportation	noun	交通；运输
expense claim	noun phrase	报销申请
meal allowance	noun phrase	餐补
travel policy	noun phrase	差旅政策
receipt form	noun phrase	报销单
open an account	verb phrase	开户
place an order	verb phrase	下订单
make a payment	verb phrase	付款
sign a contract	verb phrase	签合同
set a deadline	verb phrase	设定截止日期
book a meeting	verb phrase	预订会议
take notes	verb phrase	做笔记
give feedback	verb phrase	给反馈
solve a problem	verb phrase	解决问题
make a decision	verb phrase	做决定
prepare a report	verb phrase	准备报告
join a meeting	verb phrase	参加会议
send a reminder	verb phrase	发送提醒
check the details	verb phrase	核对细节
confirm the price	verb phrase	确认价格
contact the client	verb phrase	联系客户
update the schedule	verb phrase	更新时间表
track progress	verb phrase	跟踪进度
meet the deadline	verb phrase	按期完成
close the deal	verb phrase	成交；达成交易
negotiation	noun	谈判
agreement	noun	协议；一致意见
appointment	noun	预约；约见
availability	noun	可用时间；供应情况
office hours	noun phrase	办公时间
workspace	noun	工作空间
teamwork	noun	团队协作
responsibility	noun	责任；职责
support	noun/verb	支持
service fee	noun phrase	服务费
refund	noun/verb	退款
warranty	noun	保修；质保
complaint	noun	投诉
return	noun/verb	退货；返回
shipment	noun	装运；发货
tracking number	noun phrase	物流单号
purchase request	noun phrase	采购申请
approval process	noun phrase	审批流程
action plan	noun phrase	行动计划
daily report	noun phrase	日报
`;

const advancedTsv = `
stakeholder	noun	利益相关方
shareholder	noun	股东
executive	noun/adjective	高管；执行层的
leadership	noun	领导层；领导力
governance	noun	治理；管理机制
compliance	noun	合规
regulation	noun	法规；监管规定
liability	noun	责任；法律责任
due diligence	noun phrase	尽职调查
confidentiality	noun	保密性
non-disclosure agreement	noun phrase	保密协议
intellectual property	noun phrase	知识产权
trademark	noun	商标
patent	noun	专利
copyright	noun	版权
licensing	noun	授权许可
terms and conditions	noun phrase	条款与条件
service level agreement	noun phrase	服务水平协议
scope of work	noun phrase	工作范围
statement of work	noun phrase	工作说明书
market positioning	noun phrase	市场定位
competitive advantage	noun phrase	竞争优势
value proposition	noun phrase	价值主张
target segment	noun phrase	目标细分市场
customer persona	noun phrase	用户画像
market penetration	noun phrase	市场渗透
market share	noun phrase	市场份额
brand awareness	noun phrase	品牌认知度
brand equity	noun phrase	品牌资产
go-to-market strategy	noun phrase	上市/市场进入策略
pricing strategy	noun phrase	定价策略
premium pricing	noun phrase	溢价定价
dynamic pricing	noun phrase	动态定价
bundle offer	noun phrase	组合优惠
upsell	verb/noun	追加销售
cross-sell	verb/noun	交叉销售
customer acquisition	noun phrase	获客
customer retention	noun phrase	客户留存
churn rate	noun phrase	流失率
lifetime value	noun phrase	生命周期价值
conversion rate	noun phrase	转化率
sales funnel	noun phrase	销售漏斗
pipeline	noun	销售管道；流程管线
qualified lead	noun phrase	合格销售线索
prospect	noun	潜在客户
account manager	noun phrase	客户经理
key account	noun phrase	重点客户
renewal	noun	续约
referral	noun	转介绍
testimonial	noun	客户证言；推荐语
negotiation leverage	noun phrase	谈判筹码
counteroffer	noun	还价；反报价
concession	noun	让步
walk-away point	noun phrase	退出底线
win-win outcome	noun phrase	双赢结果
bargaining power	noun phrase	议价能力
deal terms	noun phrase	交易条款
payment terms	noun phrase	付款条款
delivery terms	noun phrase	交付条款
penalty clause	noun phrase	违约条款
cash flow	noun phrase	现金流
working capital	noun phrase	营运资金
gross margin	noun phrase	毛利率
net margin	noun phrase	净利率
operating expense	noun phrase	运营费用
capital expenditure	noun phrase	资本支出
return on investment	noun phrase	投资回报率
break-even point	noun phrase	盈亏平衡点
profit and loss statement	noun phrase	损益表
balance sheet	noun phrase	资产负债表
accounts receivable	noun phrase	应收账款
accounts payable	noun phrase	应付账款
depreciation	noun	折旧
amortization	noun	摊销
forecast	noun/verb	预测
variance	noun	差异；偏差
budget overrun	noun phrase	预算超支
cost control	noun phrase	成本控制
financial projection	noun phrase	财务预测
audit trail	noun phrase	审计轨迹
procurement	noun	采购管理
sourcing	noun	寻源；采购来源开发
request for proposal	noun phrase	招标/征询建议书
request for quotation	noun phrase	询价单
purchase order	noun phrase	采购订单
lead time	noun phrase	交付周期
minimum order quantity	noun phrase	最小起订量
bulk order	noun phrase	批量订单
backorder	noun	缺货待补订单
fulfillment	noun	履约；订单完成
supply chain	noun phrase	供应链
logistics	noun	物流
distribution channel	noun phrase	分销渠道
inventory turnover	noun phrase	库存周转率
safety stock	noun phrase	安全库存
stockout	noun	断货
quality assurance	noun phrase	质量保证
quality control	noun phrase	质量控制
defect rate	noun phrase	缺陷率
product recall	noun phrase	产品召回
workflow	noun	工作流
standard operating procedure	noun phrase	标准作业流程
process optimization	noun phrase	流程优化
bottleneck	noun	瓶颈
capacity planning	noun phrase	产能规划
resource allocation	noun phrase	资源分配
productivity	noun	生产率
efficiency	noun	效率
automation	noun	自动化
outsourcing	noun	外包
business continuity	noun phrase	业务连续性
contingency plan	noun phrase	应急预案
risk assessment	noun phrase	风险评估
risk mitigation	noun phrase	风险缓释
incident response	noun phrase	事件响应
data privacy	noun phrase	数据隐私
cybersecurity	noun	网络安全
access control	noun phrase	访问控制
internal control	noun phrase	内部控制
fraud prevention	noun phrase	防欺诈
merger	noun	合并
acquisition	noun	收购
joint venture	noun phrase	合资企业
strategic partnership	noun phrase	战略合作伙伴关系
alliance	noun	联盟
franchise	noun	特许经营
subsidiary	noun	子公司
affiliate	noun	关联公司
spin-off	noun	分拆
restructuring	noun	重组
scalability	noun	可扩展性
sustainable growth	noun phrase	可持续增长
profitability	noun	盈利能力
operational excellence	noun phrase	卓越运营
digital transformation	noun phrase	数字化转型
innovation pipeline	noun phrase	创新管线
product roadmap	noun phrase	产品路线图
minimum viable product	noun phrase	最小可行产品
proof of concept	noun phrase	概念验证
pilot program	noun phrase	试点项目
user adoption	noun phrase	用户采用率
customer journey	noun phrase	客户旅程
pain point	noun phrase	痛点
use case	noun phrase	使用场景
feature request	noun phrase	功能需求
release cycle	noun phrase	发布周期
bug fix	noun phrase	缺陷修复
technical debt	noun phrase	技术债
system integration	noun phrase	系统集成
data migration	noun phrase	数据迁移
key performance indicator	noun phrase	关键绩效指标
objective and key results	noun phrase	目标与关键结果
benchmark	noun/verb	基准；对标
dashboard	noun	数据看板
metric	noun	指标
insight	noun	洞察
trend analysis	noun phrase	趋势分析
scenario planning	noun phrase	情景规划
root cause analysis	noun phrase	根因分析
action item	noun phrase	待办行动项
alignment	noun	目标一致；对齐
buy-in	noun	认同；支持
accountability	noun	责任制；问责
delegation	noun	授权；委派
empowerment	noun	赋能
cross-functional team	noun phrase	跨职能团队
matrix organization	noun phrase	矩阵式组织
talent pipeline	noun phrase	人才梯队
succession planning	noun phrase	继任计划
employee engagement	noun phrase	员工敬业度
performance appraisal	noun phrase	绩效评估
compensation package	noun phrase	薪酬方案
equity incentive	noun phrase	股权激励
retention strategy	noun phrase	留才策略
organizational culture	noun phrase	组织文化
change management	noun phrase	变革管理
conflict resolution	noun phrase	冲突解决
stakeholder communication	noun phrase	利益相关方沟通
executive summary	noun phrase	执行摘要
board meeting	noun phrase	董事会会议
import duty	noun phrase	进口关税
customs clearance	noun phrase	清关
freight forwarder	noun phrase	货运代理
bill of lading	noun phrase	提单
letter of credit	noun phrase	信用证
foreign exchange rate	noun phrase	外汇汇率
hedging	noun	套期保值；对冲
tariff	noun	关税；税则
trade barrier	noun phrase	贸易壁垒
localization	noun	本地化
sustainability	noun	可持续性
corporate social responsibility	noun phrase	企业社会责任
environmental impact	noun phrase	环境影响
carbon footprint	noun phrase	碳足迹
ethical sourcing	noun phrase	道德采购
diversity and inclusion	noun phrase	多元与包容
workforce planning	noun phrase	人力规划
remote collaboration	noun phrase	远程协作
hybrid workplace	noun phrase	混合办公
knowledge transfer	noun phrase	知识转移
`;

function parseTsv(tsv) {
  return tsv.trim().split('\n').map((line) => {
    const [word, partOfSpeech, definitionZh] = line.split('\t');
    return { word, partOfSpeech, definitionZh };
  });
}

function hasVerb(partOfSpeech) {
  return partOfSpeech.includes('verb');
}

function isAdjective(partOfSpeech) {
  return partOfSpeech.includes('adjective') && !partOfSpeech.includes('noun');
}

function zhCore(definitionZh) {
  return definitionZh.replace(/（.*?）/g, '').split(/[；，]/)[0];
}

function objectPhrase(word) {
  const noArticle = new Set([
    'business',
    'staff',
    'cash',
    'quality',
    'marketing',
    'advertising',
    'feedback',
    'research',
    'training',
    'attendance',
    'performance',
    'transportation',
    'teamwork',
    'support',
    'leadership',
    'governance',
    'compliance',
    'confidentiality',
    'licensing',
    'procurement',
    'sourcing',
    'logistics',
    'productivity',
    'efficiency',
    'automation',
    'outsourcing',
    'cybersecurity',
    'scalability',
    'profitability',
    'localization',
    'sustainability',
    'hedging',
  ]);
  return noArticle.has(word) ? word : `the ${word}`;
}

function definitionEn(word, difficulty) {
  if (difficulty === 'BEGINNER') {
    return `A common business English term for talking about ${word} in everyday workplace situations.`;
  }
  return `A precise business English term used in professional conversations about ${word}, management, finance, operations, or strategy.`;
}

function commonPatterns(word, partOfSpeech) {
  if (hasVerb(partOfSpeech)) {
    return `need to ${word}; ${word} before the meeting; ${word} clearly; ${word} with the client`;
  }
  if (isAdjective(partOfSpeech)) {
    return `${word} partner; ${word} market; ${word} office`;
  }
  const object = objectPhrase(word);
  return `discuss ${object}; ask about ${object}; review ${object}; explain ${object}`;
}

function exampleEn(word, partOfSpeech) {
  if (hasVerb(partOfSpeech)) {
    return `We need to ${word} before the client meeting.`;
  }
  if (isAdjective(partOfSpeech)) {
    return `We are looking for a ${word} partner for this project.`;
  }
  return `Our team discussed ${objectPhrase(word)} during the meeting.`;
}

function exampleZh(word, partOfSpeech, definitionZh) {
  const core = zhCore(definitionZh);
  if (hasVerb(partOfSpeech)) {
    return `我们需要在客户会议前${core}。`;
  }
  if (isAdjective(partOfSpeech)) {
    return `我们正在为这个项目寻找一个${core}合作伙伴。`;
  }
  return `我们团队在会议中讨论了${core}。`;
}

function toWordEntry(raw, difficulty, sortOrder) {
  const diffZh = difficulty === 'BEGINNER' ? '初级' : '进阶';
  return {
    word: raw.word,
    phonetic: '',
    partOfSpeech: raw.partOfSpeech,
    definitionZh: `${raw.definitionZh}（${diffZh}商务英语）`,
    definitionEn: definitionEn(raw.word, difficulty),
    commonPatterns: commonPatterns(raw.word, raw.partOfSpeech),
    exampleEn: exampleEn(raw.word, raw.partOfSpeech),
    exampleZh: exampleZh(raw.word, raw.partOfSpeech, raw.definitionZh),
    difficulty,
    status: 'DRAFT',
    sourceScene: '商务英语',
    sourceTopicId: null,
    sourceTopicTitle: '商务英语',
    sortOrder,
  };
}

function validate(words) {
  const required = [
    'word',
    'partOfSpeech',
    'definitionZh',
    'definitionEn',
    'commonPatterns',
    'exampleEn',
    'exampleZh',
    'difficulty',
    'status',
    'sourceScene',
    'sourceTopicTitle',
  ];
  const duplicates = [
    ...new Set(
      words
        .map((word) => word.word.trim().toLowerCase())
        .filter((word, index, array) => array.indexOf(word) !== index),
    ),
  ];
  const missing = [];
  words.forEach((word, index) => {
    required.forEach((field) => {
      if (word[field] === null || word[field] === undefined || String(word[field]).trim() === '') {
        missing.push({ index, word: word.word, field });
      }
    });
  });

  const counts = {
    total: words.length,
    beginner: words.filter((word) => word.difficulty === 'BEGINNER').length,
    advanced: words.filter((word) => word.difficulty === 'ADVANCED').length,
    duplicates: duplicates.length,
    missingRequiredFields: missing.length,
  };

  if (
    counts.total !== 400 ||
    counts.beginner !== 200 ||
    counts.advanced !== 200 ||
    duplicates.length ||
    missing.length
  ) {
    throw new Error(JSON.stringify({ counts, duplicates, missing: missing.slice(0, 20) }, null, 2));
  }

  return counts;
}

function markdownTable(rows) {
  return [
    '| 难度 | 单词/短语 | 词性 | 中文释义 | 常用搭配/句型 | 例句 |',
    '|---|---|---|---|---|---|',
    ...rows.map((word) =>
      [
        word.difficulty,
        word.word,
        word.partOfSpeech,
        word.definitionZh.replaceAll('|', '/'),
        word.commonPatterns.replaceAll('|', '/'),
        word.exampleEn.replaceAll('|', '/'),
      ].join(' | '),
    ).map((row) => `| ${row} |`),
  ].join('\n');
}

const beginner = parseTsv(beginnerTsv);
const advanced = parseTsv(advancedTsv);
const words = [
  ...beginner.map((word, index) => toWordEntry(word, 'BEGINNER', index)),
  ...advanced.map((word, index) => toWordEntry(word, 'ADVANCED', beginner.length + index)),
];
const counts = validate(words);

const data = {
  generatedAt: '2026-06-06',
  source: 'Codex generated draft following PC admin word-book generation structure',
  wordBook: {
    name: '商务英语',
    description:
      '围绕商务沟通、会议邮件、销售市场、财务合同、供应链运营、战略管理等场景整理的商务英语单词本。包含初级 200 个、进阶 200 个，状态为草稿。',
    scene: '商务英语',
    status: 'DRAFT',
  },
  importPolicy: {
    createNewWordBook: true,
    wordStatus: 'DRAFT',
    generateAudioAfterInsert: false,
    phoneticPolicy: 'phonetic 字段暂留空，避免使用未经校验的机器音标；后续可由词典或发音服务补全。',
  },
  counts,
  words,
};

const sampleBeginner = words.filter((word) => word.difficulty === 'BEGINNER').slice(0, 20);
const sampleAdvanced = words.filter((word) => word.difficulty === 'ADVANCED').slice(0, 20);
const markdown = `# 商务英语单词本生成草稿

- 生成日期：2026-06-06
- 单词本名称：商务英语
- 单词本状态：DRAFT（草稿）
- 生成规模：初级 200 个，进阶 200 个，共 400 个
- 入库源数据：\`doc/generated/business-english-wordbook.json\`
- 音标策略：\`phonetic\` 字段暂留空，避免使用未经校验的机器音标；确认入库后可用系统发音/词典流程补全。

## 数据结构

每个单词项包含：

\`word\`、\`phonetic\`、\`partOfSpeech\`、\`definitionZh\`、\`definitionEn\`、\`commonPatterns\`、\`exampleEn\`、\`exampleZh\`、\`difficulty\`、\`status\`、\`sourceScene\`、\`sourceTopicId\`、\`sourceTopicTitle\`、\`sortOrder\`。

## 校验结果

- 总数：${counts.total}
- 初级：${counts.beginner}
- 进阶：${counts.advanced}
- 重复单词：${counts.duplicates}
- 必填字段缺失：${counts.missingRequiredFields}

## 初级样例（前 20 条）

${markdownTable(sampleBeginner)}

## 进阶样例（前 20 条）

${markdownTable(sampleAdvanced)}

## 完整数据

完整 400 条数据请审阅 JSON：\`doc/generated/business-english-wordbook.json\`。确认后我会按该文件新建草稿单词本并批量插入数据库。
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'business-english-wordbook.json'), JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'business-english-wordbook.md'), markdown);

console.log(JSON.stringify({ outputDir: outDir, counts }, null, 2));
