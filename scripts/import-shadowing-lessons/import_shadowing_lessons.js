#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function hasArg(name) {
  return process.argv.includes(name);
}

function usage() {
  console.log('Usage: node import_shadowing_lessons.js --file /abs/lesson.md [--out /tmp/shadowing.sql] [--execute]');
}

function linesBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start < 0) return '';
  const from = start + startMarker.length;
  const end = endMarker ? text.indexOf(endMarker, from) : -1;
  return text.slice(from, end >= 0 ? end : text.length).trim();
}

function meta(text, key) {
  const re = new RegExp('^- ' + escapeRegExp(key) + '：(.+)$', 'm');
  const match = text.match(re);
  return match ? match[1].trim() : '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripBullets(value) {
  return value
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
}

function parseChallenge(text) {
  const block = linesBetween(text, '## 一、对照中文 尝试开口说英文', '## 二、对照英文 排查卡壳的地方');
  const body = linesBetween(block, '文本：', '页面提示：').trim();
  const tips = stripBullets(linesBetween(block, '页面提示：', null));
  return { zhText: body, tips };
}

function parseTranscript(text) {
  const block = linesBetween(text, '## 二、对照英文 排查卡壳的地方', '## 三、精读文本 积累地道实用生词短语');
  const en = linesBetween(block, '页面提示：对照母语者的表达，查看不会和卡壳的地方', '中文对照：')
    .replace(/视频提示：[\s\S]*$/m, '')
    .trim();
  const zh = linesBetween(block, '中文对照：', '视频提示：').trim();
  return { en, zh, highlights: extractHighlights(en) };
}

function extractHighlights(value) {
  const known = [
    'got out of the shower',
    'dried my hair',
    'put on a little makeup',
    'SPF',
    'pretty sunny out',
    'a million times',
    'especially dark',
    'dreary',
    'moved to',
    'never'
  ];
  return known.filter(item => value.includes(item)).map((text, index) => ({ text, expressionIndex: index }));
}

function parseExpressions(text) {
  const block = linesBetween(text, '## 三、精读文本 积累地道实用生词短语', '## 四、单句文本跟读 模仿语音语调');
  const chunks = block.split(/^###\s+\d+\.\s+/m).slice(1);
  return chunks.map(chunk => {
    const title = chunk.split(/\r?\n/)[0].trim();
    const sourceExample = matchLine(chunk, /^原文例句：[\s\S]*?-\s*EP\d+：(.+)$/m);
    const sourceParts = sourceExample.split(' / ');
    const definition = matchLine(chunk, /^- 释义：(.+)$/m);
    const definitionParts = definition.split(' / ');
    const example = matchLine(chunk, /^\s*- 例：(.+)$/m);
    const exampleParts = example.split(' / ');
    return {
      text: title,
      phonetic: matchLine(chunk, /^- 音标：(.+)$/m),
      type: matchLine(chunk, /^- 类型：(.+)$/m),
      tags: splitChineseList(matchLine(chunk, /^- 标签：(.+)$/m)),
      forms: splitChineseList(matchLine(chunk, /^- 形式：(.+)$/m)),
      definitionZh: (definitionParts[0] || '').trim(),
      definitionEn: (definitionParts.slice(1).join(' / ') || '').trim(),
      exampleZh: (exampleParts[0] || '').trim(),
      exampleEn: (exampleParts.slice(1).join(' / ') || '').trim(),
      synonyms: parseIndentedList(chunk, '同义表达：'),
      related: parseIndentedList(chunk, '相关表达：'),
      analysis: parseAnalysis(chunk),
      sourceExampleEn: (sourceParts[0] || '').trim(),
      sourceExampleZh: (sourceParts.slice(1).join(' / ') || '').trim()
    };
  }).filter(item => item.text);
}

function parseSentences(text) {
  const block = linesBetween(text, '## 四、单句文本跟读 模仿语音语调', '## 五、口头填空 及时巩固地道表达');
  const chunks = block.split(/^###\s+句子\s+\d+/m).slice(1);
  return chunks.map((chunk, index) => {
    const time = matchLine(chunk, /^- 时间：(.+)$/m);
    const timeRange = parseTimeRange(time);
    return {
      index,
      startSec: timeRange ? timeRange.startSec : null,
      endSec: timeRange ? timeRange.endSec : null,
      audioUrl: firstNonEmpty(
        matchLine(chunk, /^- 单句音频：(.+)$/m),
        matchLine(chunk, /^- 音频：(.+)$/m),
        matchLine(chunk, /^- audioUrl：(.+)$/m),
        matchLine(chunk, /^- sentenceAudioUrl：(.+)$/m)
      ),
      en: matchLine(chunk, /^- 英文：(.+)$/m),
      zh: matchLine(chunk, /^- 中文：(.+)$/m),
      phonetic: matchLine(chunk, /^- 音标：(.+)$/m),
      highlights: parseHighlightsLine(matchLine(chunk, /^- 高亮表达：(.+)$/m)),
      videoId: matchLine(chunk, /^- video_id：(.+)$/m)
    };
  }).filter(item => item.en);
}

function parseTimeRange(value) {
  if (!value) return null;
  const text = String(value).trim();
  const secondMatch = text.match(/([\d.]+)\s*s?\s*[-~–—至到]\s*([\d.]+)\s*s?/i);
  if (secondMatch) {
    const secondRange = normalizeTimeRange(Number(secondMatch[1]), Number(secondMatch[2]));
    if (secondRange) return secondRange;
  }
  const clockMatch = text.match(/(\d{1,2}:\d{1,2}(?:\.\d+)?)\s*[-~–—至到]\s*(\d{1,2}:\d{1,2}(?:\.\d+)?)/);
  if (clockMatch) {
    return normalizeTimeRange(clockToSeconds(clockMatch[1]), clockToSeconds(clockMatch[2]));
  }
  return null;
}

function normalizeTimeRange(startSec, endSec) {
  if (!Number.isFinite(startSec) || !Number.isFinite(endSec) || endSec <= startSec) return null;
  return { startSec, endSec };
}

function clockToSeconds(value) {
  const parts = String(value).split(':').map(Number);
  if (parts.length !== 2 || parts.some(part => !Number.isFinite(part))) return NaN;
  return parts[0] * 60 + parts[1];
}

function estimateSentenceDuration(text) {
  const normalized = String(text || '').trim();
  if (!normalized) return 2.2;
  const words = normalized.match(/[A-Za-z0-9']+/g) || [];
  const punctuation = normalized.match(/[,.!?;:]/g) || [];
  const duration = (words.length / 2.45) + (punctuation.length * 0.16) + 0.55;
  return Math.max(1.4, Math.min(12, duration));
}

function fillEstimatedSentenceRanges(sentences) {
  const hasPlayableSentence = sentences.some(item => item.audioUrl || (item.startSec !== null && item.endSec !== null && item.endSec > item.startSec));
  if (hasPlayableSentence) return sentences;
  let cursor = 0.2;
  return sentences.map(item => {
    const duration = estimateSentenceDuration(item.en);
    const startSec = Number(cursor.toFixed(2));
    const endSec = Number((cursor + duration).toFixed(2));
    cursor = endSec + 0.28;
    return Object.assign({}, item, {
      startSec,
      endSec,
      estimatedTimeRange: true
    });
  });
}

function firstNonEmpty() {
  for (let i = 0; i < arguments.length; i += 1) {
    const value = arguments[i];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function parseCloze(text) {
  const block = linesBetween(text, '## 五、口头填空 及时巩固地道表达', '## 站内导航/相关链接');
  const enFullText = linesBetween(block, '英文全文：', '中文全文：').trim();
  const zhPromptText = linesBetween(block, '中文全文：', '结束提示：').trim();
  return {
    enFullText,
    zhPromptText,
    answers: extractHighlights(enFullText).map(item => item.text)
  };
}

function matchLine(text, re) {
  const match = text.match(re);
  return match ? match[1].trim() : '';
}

function splitChineseList(value) {
  return value ? value.split(/[、,，]/).map(item => item.trim()).filter(Boolean) : [];
}

function parseIndentedList(chunk, label) {
  const block = linesBetween(chunk, label, '\n\n');
  return stripBullets(block).map(item => item.replace(/：.+$/, '').trim()).filter(Boolean);
}

function parseAnalysis(chunk) {
  const block = linesBetween(chunk, '解析：', '原文例句：');
  return stripBullets(block).join('\n');
}

function parseHighlightsLine(value) {
  if (!value) return [];
  return value.split('、').map(item => {
    const match = item.match(/^(.+?)（(.+?)）$/);
    return match ? { text: match[1].trim(), zh: match[2].trim() } : { text: item.trim(), zh: '' };
  }).filter(item => item.text);
}

function parseLesson(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const sourceUrl = (text.match(/来源：(https?:\/\/\S+)/) || [])[1] || meta(text, '原视频链接');
  const videoUrl = meta(text, '视频/音频资源');
  const episodeMatch = (meta(text, '站内标题') || meta(text, '页面标题')).match(/Episode\s+(\d+)/i);
  const sentences = fillEstimatedSentenceRanges(parseSentences(text));
  const content = {
    challenge: parseChallenge(text),
    transcript: parseTranscript(text),
    sentences,
    expressions: parseExpressions(text),
    cloze: parseCloze(text)
  };
  return {
    title: meta(text, '页面标题') || meta(text, '站内标题') || path.basename(filePath, '.md'),
    titleZh: meta(text, '站内标题') || meta(text, '页面标题'),
    description: content.challenge.zhText.split(/\r?\n/).slice(0, 2).join('\n'),
    episodeNo: episodeMatch ? 'EP' + episodeMatch[1] : '',
    category: meta(text, '栏目'),
    topic: meta(text, '主题'),
    sourceName: meta(text, '油管博主') || meta(text, '栏目'),
    sourceUrl,
    thumbnailUrl: meta(text, '页面缩略图'),
    videoUrl,
    audioUrl: videoUrl ? videoUrl.replace('/videos/episodes-mp4/', '/audio/episodes/').replace(/\.mp4(\?.*)?$/, '.mp3$1') : '',
    publishedDate: meta(text, '日期'),
    sentenceCount: content.sentences.length,
    expressionCount: content.expressions.length,
    contentJson: JSON.stringify(content),
    status: 'PUBLISHED'
  };
}

function sqlString(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  return "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

function buildSql(lesson) {
  const columns = [
    'title', 'title_zh', 'description', 'episode_no', 'category', 'topic', 'source_name', 'source_url',
    'thumbnail_url', 'video_url', 'audio_url', 'published_date', 'sentence_count', 'expression_count',
    'content_json', 'status', 'created_at', 'updated_at'
  ];
  const values = [
    lesson.title, lesson.titleZh, lesson.description, lesson.episodeNo, lesson.category, lesson.topic, lesson.sourceName, lesson.sourceUrl,
    lesson.thumbnailUrl, lesson.videoUrl, lesson.audioUrl, lesson.publishedDate, lesson.sentenceCount, lesson.expressionCount,
    lesson.contentJson, lesson.status, 'CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP'
  ];
  const renderedValues = values.map((value, index) => {
    const column = columns[index];
    if (column === 'created_at' || column === 'updated_at') return value;
    if (typeof value === 'number') return String(value);
    return sqlString(value);
  });
  const updates = columns
    .filter(column => column !== 'created_at')
    .map(column => column + ' = VALUES(' + column + ')')
    .join(',\n  ');
  return [
    "SET @shadowing_source_idx_exists := (SELECT COUNT(1) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'shadowing_lessons' AND index_name = 'uk_shadowing_lessons_source_url');",
    "SET @shadowing_source_idx_sql := IF(@shadowing_source_idx_exists = 0, 'ALTER TABLE shadowing_lessons ADD UNIQUE KEY uk_shadowing_lessons_source_url (source_url)', 'SELECT 1');",
    'PREPARE shadowing_source_idx_stmt FROM @shadowing_source_idx_sql;',
    'EXECUTE shadowing_source_idx_stmt;',
    'DEALLOCATE PREPARE shadowing_source_idx_stmt;',
    'INSERT INTO shadowing_lessons (' + columns.join(', ') + ')',
    'VALUES (' + renderedValues.join(', ') + ')',
    'ON DUPLICATE KEY UPDATE',
    '  ' + updates + ';'
  ].join('\n');
}

function jdbcToMysqlArgs(jdbcUrl) {
  const clean = jdbcUrl.replace(/^jdbc:/, '');
  const parsed = new URL(clean);
  const args = [
    '-h', parsed.hostname,
    '-P', parsed.port || '3306',
    parsed.pathname.replace(/^\//, '')
  ];
  return args;
}

function main() {
  const file = arg('--file');
  if (!file) {
    usage();
    process.exit(1);
  }
  const lesson = parseLesson(file);
  const sql = buildSql(lesson);
  const out = arg('--out');
  if (out) {
    fs.writeFileSync(out, sql + os.EOL);
  } else {
    console.log(sql);
  }
  console.error(JSON.stringify({
    parsedFile: file,
    title: lesson.title,
    sourceUrl: lesson.sourceUrl,
    sentenceCount: lesson.sentenceCount,
    expressionCount: lesson.expressionCount,
    mode: hasArg('--execute') ? 'execute' : 'sql'
  }, null, 2));

  if (hasArg('--execute')) {
    const dbUrl = process.env.XIAOYOU_DB_URL;
    const user = process.env.XIAOYOU_DB_USER;
    const password = process.env.XIAOYOU_DB_PASSWORD;
    if (!dbUrl || !user || !password) {
      throw new Error('执行模式需要 XIAOYOU_DB_URL / XIAOYOU_DB_USER / XIAOYOU_DB_PASSWORD');
    }
    const temp = path.join(os.tmpdir(), 'shadowing-import-' + Date.now() + '.sql');
    fs.writeFileSync(temp, sql + os.EOL);
    const result = spawnSync('mysql', jdbcToMysqlArgs(dbUrl).concat(['-u', user, '-p' + password]), {
      input: fs.readFileSync(temp),
      encoding: 'utf8'
    });
    fs.unlinkSync(temp);
    if (result.status !== 0) {
      process.stderr.write(result.stderr || result.stdout);
      process.exit(result.status || 1);
    }
    process.stderr.write(result.stdout || '');
  }
}

main();
