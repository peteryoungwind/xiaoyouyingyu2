function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseQuestions(questionsStr) {
  if (!questionsStr) return [];
  try {
    return typeof questionsStr === 'string' ? JSON.parse(questionsStr) : questionsStr;
  } catch (e) {
    return [];
  }
}

function parseAiContent(contentStr) {
  if (!contentStr) return null;
  try {
    let cleaned = contentStr.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    return JSON.parse(cleaned.trim());
  } catch (e) {
    console.error('Parse AI content error:', e);
    return null;
  }
}

function getRemainingDays(expireAt) {
  if (!expireAt) return 0;
  const expire = new Date(expireAt);
  const now = new Date();
  if (expire <= now) return 0;
  return Math.ceil((expire - now) / (1000 * 60 * 60 * 24));
}

const TAG_COLORS = [
  { bg: '#E5F1FF', color: '#007AFF' },
  { bg: '#FFF3E0', color: '#FF9500' },
  { bg: '#E8F5E9', color: '#34C759' },
  { bg: '#FCE4EC', color: '#FF3B30' },
  { bg: '#EDE7F6', color: '#5856D6' },
  { bg: '#E0F7FA', color: '#5AC8FA' },
  { bg: '#FFF8E1', color: '#FF9500' },
  { bg: '#E8EAF6', color: '#007AFF' }
];

function getTagColor(index) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

module.exports = { formatDate, parseQuestions, parseAiContent, getRemainingDays, getTagColor };
