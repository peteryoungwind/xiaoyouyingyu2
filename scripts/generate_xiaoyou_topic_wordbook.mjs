import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const topicPath = path.join(rootDir, 'doc/generated/xiaoyou-topic-snapshot.json');
const outDir = path.join(rootDir, 'doc/generated');
const jsonPath = path.join(outDir, 'xiaoyou-topic-wordbook.json');
const mdPath = path.join(outDir, 'xiaoyou-topic-wordbook.md');

const topicSnapshot = JSON.parse(fs.readFileSync(topicPath, 'utf8'));
const topics = topicSnapshot.topics || [];

if (topics.length === 0) {
  throw new Error('No topics found in doc/generated/xiaoyou-topic-snapshot.json');
}

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'being', 'by', 'do', 'does', 'for', 'from',
  'how', 'i', 'in', 'is', 'it', 'my', 'of', 'on', 'or', 'our', 'the', 'their', 'to',
  'vs', 'we', 'what', 'when', 'where', 'why', 'with', 'without', 'you', 'your',
]);

const beginnerTemplates = [
  (c) => `talk about ${c}`,
  (c) => `share my experience with ${c}`,
  (c) => `give an example of ${c}`,
  (c) => `ask a question about ${c}`,
  (c) => `describe ${c}`,
  (c) => `say what I think about ${c}`,
  (c) => `explain ${c} in simple words`,
  (c) => `compare ${c} with daily life`,
];

const advancedTemplates = [
  (c) => `reflect on ${c}`,
  (c) => `put ${c} into perspective`,
  (c) => `look at ${c} from another angle`,
  (c) => `weigh the pros and cons of ${c}`,
  (c) => `explore the deeper reasons behind ${c}`,
  (c) => `connect ${c} with personal growth`,
  (c) => `express a nuanced view on ${c}`,
  (c) => `draw a practical lesson from ${c}`,
];

function cleanTitle(title) {
  return String(title || '')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/[^a-zA-Z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function conceptsForTopic(topic) {
  const title = cleanTitle(topic.title);
  const words = title.split(' ').filter((word) => word && !stopWords.has(word));
  const concepts = [];

  let phrase = title
    .replace(/^how to /, '')
    .replace(/^why /, '')
    .replace(/^what /, '')
    .replace(/^the /, '')
    .trim();
  if (phrase && phrase.length <= 70) concepts.push(phrase);

  for (let size = 3; size >= 1; size--) {
    for (let i = 0; i <= words.length - size; i++) {
      const chunk = words.slice(i, i + size).join(' ');
      if (chunk.length >= 3 && chunk.length <= 50) concepts.push(chunk);
    }
  }

  const unique = [];
  for (const concept of concepts) {
    const normalized = concept.trim().toLowerCase();
    if (normalized && !unique.includes(normalized)) unique.push(normalized);
  }
  return unique.length ? unique : ['daily conversation'];
}

function zhTopic(topic) {
  return topic.titleZh || topic.title || '小柚口语主题';
}

function tagScene(topic) {
  return topic.tags ? `小柚口语主题：${topic.tags}` : '小柚口语主题';
}

function shortZh(definition) {
  return String(definition || '').replace(/[。！？].*$/, '').slice(0, 80);
}

function makeEntry({ word, difficulty, topic, sortOrder }) {
  const isBeginner = difficulty === 'BEGINNER';
  const topicZh = zhTopic(topic);
  const levelZh = isBeginner ? '初级' : '进阶';
  const phraseZh = isBeginner
    ? `围绕「${topicZh}」进行基础口语表达`
    : `围绕「${topicZh}」进行更有层次的观点表达`;
  return {
    word,
    phonetic: '',
    partOfSpeech: 'phrase',
    definitionZh: `${phraseZh}（${levelZh}）`,
    definitionEn: isBeginner
      ? `A practical beginner phrase for discussing "${topic.title}" in everyday spoken English.`
      : `A more advanced phrase for building nuanced spoken answers about "${topic.title}".`,
    commonPatterns: isBeginner
      ? `${word}; I want to ${word}; Let me ${word}; It is easy to ${word}.`
      : `${word}; I would like to ${word}; We can ${word}; This helps me ${word}.`,
    exampleEn: isBeginner
      ? `I can ${word} when I discuss "${topic.title}".`
      : `In a longer answer, I can ${word} and make my opinion clearer.`,
    exampleZh: isBeginner
      ? `讨论「${shortZh(topicZh)}」时，我可以使用这个表达。`
      : `在更完整的回答中，我可以用这个表达让观点更清楚。`,
    difficulty,
    status: 'PUBLISHED',
    sourceScene: tagScene(topic),
    sourceTopicId: topic.id,
    sourceTopicTitle: topicZh,
    sourceTopicTitleEn: topic.title,
    sortOrder,
  };
}

function addEntry(entries, seen, word, difficulty, topic, sortOrder) {
  const normalized = word.toLowerCase();
  if (word.length <= 120 && !seen.has(normalized)) {
    seen.add(normalized);
    entries.push(makeEntry({ word, difficulty, topic, sortOrder }));
    return true;
  }
  return false;
}

function generateCandidates(templates, difficulty) {
  const entries = [];
  const seen = new Set();
  let sortOrder = difficulty === 'BEGINNER' ? 0 : 800;

  for (const topic of topics) {
    const concepts = conceptsForTopic(topic);
    const concept = concepts[0];
    const starterCandidates = [
      templates[entries.length % templates.length](concept),
      difficulty === 'BEGINNER' ? `start a conversation about ${concept}` : `develop a thoughtful answer about ${concept}`,
      difficulty === 'BEGINNER' ? `use simple words for ${concept}` : `build a stronger argument about ${concept}`,
    ];
    for (const candidate of starterCandidates) {
      const word = candidate.replace(/\s+/g, ' ').trim();
      if (addEntry(entries, seen, word, difficulty, topic, sortOrder)) {
        sortOrder++;
        break;
      }
    }
  }

  for (const topic of topics) {
    const concepts = conceptsForTopic(topic);
    for (let i = 0; i < Math.min(4, concepts.length); i++) {
      for (const template of templates) {
        const word = template(concepts[i]).replace(/\s+/g, ' ').trim();
        if (addEntry(entries, seen, word, difficulty, topic, sortOrder)) {
          sortOrder++;
          if (entries.length >= 800) return entries;
        }
      }
    }
  }
  return entries;
}

const beginnerWords = generateCandidates(beginnerTemplates, 'BEGINNER');
const advancedWords = generateCandidates(advancedTemplates, 'ADVANCED');
const words = [...beginnerWords, ...advancedWords];

const required = [
  'word', 'partOfSpeech', 'definitionZh', 'definitionEn', 'commonPatterns', 'exampleEn',
  'exampleZh', 'difficulty', 'status', 'sourceScene', 'sourceTopicId', 'sourceTopicTitle',
];
const duplicates = [
  ...new Set(words.map((word) => word.word.trim().toLowerCase()).filter((word, index, array) => array.indexOf(word) !== index)),
];
const missing = [];
const tooLong = [];
for (const [index, word] of words.entries()) {
  for (const field of required) {
    if (word[field] === null || word[field] === undefined || String(word[field]).trim() === '') {
      missing.push({ index, word: word.word, field });
    }
  }
  for (const [field, limit] of Object.entries({
    word: 120,
    phonetic: 120,
    partOfSpeech: 255,
    definitionZh: 1000,
    definitionEn: 1000,
    commonPatterns: 1200,
    exampleEn: 1200,
    exampleZh: 1200,
    sourceScene: 500,
    sourceTopicTitle: 300,
  })) {
    if (word[field] && String(word[field]).length > limit) tooLong.push({ index, word: word.word, field, length: String(word[field]).length, limit });
  }
}

const linkedTopicIds = new Set(words.map((word) => word.sourceTopicId));
const counts = {
  topicsAvailable: topics.length,
  linkedTopics: linkedTopicIds.size,
  total: words.length,
  beginner: beginnerWords.length,
  advanced: advancedWords.length,
  duplicates: duplicates.length,
  missingRequiredFields: missing.length,
  tooLongFields: tooLong.length,
};

if (
  counts.total !== 1600 ||
  counts.beginner !== 800 ||
  counts.advanced !== 800 ||
  counts.duplicates ||
  counts.missingRequiredFields ||
  counts.tooLongFields
) {
  throw new Error(JSON.stringify({ counts, duplicates: duplicates.slice(0, 20), missing: missing.slice(0, 20), tooLong: tooLong.slice(0, 20) }, null, 2));
}

const data = {
  generatedAt: '2026-06-08',
  source: 'Generated from existing Xiaoyou speaking topics in doc/generated/xiaoyou-topic-snapshot.json',
  wordBook: {
    name: '小柚口语单词本',
    description: `基于系统现有 ${topics.length} 个口语主题生成的综合口语表达单词本，覆盖日常生活、情绪心理、人际沟通、学习成长、文化旅行、工作表达等主题。包含初级 800 条、进阶 800 条。`,
    scene: '小柚英语现有口语主题',
    status: 'PUBLISHED',
  },
  importPolicy: {
    createNewWordBook: true,
    wordStatus: 'PUBLISHED',
    linkWordBookTopics: true,
    linkWordTopics: true,
    generateAudioAfterInsert: false,
    phoneticPolicy: 'phonetic 字段暂留空，避免使用未经校验的机器音标；后续可由词典或发音服务补全。',
  },
  counts,
  topics: topics.map((topic) => ({
    id: topic.id,
    title: topic.title,
    titleZh: topic.titleZh,
    tags: topic.tags,
    eventDate: topic.eventDate,
  })),
  words,
};

function table(rows) {
  return [
    '| 难度 | 来源主题 | 单词/短语 | 中文释义 | 例句 |',
    '|---|---|---|---|---|',
    ...rows.map((word) => `| ${word.difficulty} | ${String(word.sourceTopicTitle).replaceAll('|', '/')} | ${word.word.replaceAll('|', '/')} | ${word.definitionZh.replaceAll('|', '/')} | ${word.exampleEn.replaceAll('|', '/')} |`),
  ].join('\n');
}

const md = `# 小柚口语单词本生成草稿

- 生成日期：2026-06-08
- 单词本名称：小柚口语单词本
- 单词本状态：PUBLISHED（已发布）
- 主题来源：系统现有口语主题 ${counts.topicsAvailable} 个
- 覆盖来源主题：${counts.linkedTopics} 个
- 生成规模：初级 800 条，进阶 800 条，共 1600 条
- 入库源数据：\`doc/generated/xiaoyou-topic-wordbook.json\`
- 主题快照：\`doc/generated/xiaoyou-topic-snapshot.json\`

## 校验结果

- 总数：${counts.total}
- 初级：${counts.beginner}
- 进阶：${counts.advanced}
- 重复短语：${counts.duplicates}
- 必填字段缺失：${counts.missingRequiredFields}
- 字段超长：${counts.tooLongFields}

## 初级样例

${table(beginnerWords.slice(0, 20))}

## 进阶样例

${table(advancedWords.slice(0, 20))}

## 入库策略

确认后按 JSON 新建 \`PUBLISHED\` 单词本，插入 1600 条 \`PUBLISHED\` 词条，并写入 \`word_book_topics\` 与 \`word_topics\` 来源关联。
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(mdPath, md);

console.log(JSON.stringify({ jsonPath, mdPath, counts }, null, 2));
