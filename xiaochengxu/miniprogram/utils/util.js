function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return String(dateStr).replace('T', ' ').split('.')[0];
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
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

function resolveMembershipResponse(res) {
  var rawExpireAt = (res && (res.membershipExpireAt || res.expireAt)) || '';
  return {
    active: !!(res && (res.membershipActive || res.active)),
    expireAt: rawExpireAt,
    formattedExpireAt: formatDateTime(rawExpireAt),
    remainingDays: (res && res.remainingDays) || 0
  };
}

const CATEGORY_ORDER = [
  '个人成长',
  '情绪心理',
  '人际交往',
  '生活方式',
  '职场发展',
  '学习提升',
  '文化旅行',
  '消费科技'
];

const CATEGORY_META = {
  '个人成长': { bg: '#EAF2FF', color: '#5C6675', icon: '/images/tag-icons/person.svg' },
  '情绪心理': { bg: '#FFF1EE', color: '#5C6675', icon: '/images/tag-icons/heart.svg' },
  '人际交往': { bg: '#FFF0F6', color: '#5C6675', icon: '/images/tag-icons/message.svg' },
  '生活方式': { bg: '#EEF8EE', color: '#5C6675', icon: '/images/tag-icons/check-circle.svg' },
  '职场发展': { bg: '#F1EFFD', color: '#5C6675', icon: '/images/tag-icons/briefcase.svg' },
  '学习提升': { bg: '#EEF3FF', color: '#5C6675', icon: '/images/category-icons/education.svg' },
  '文化旅行': { bg: '#EAF5FF', color: '#5C6675', icon: '/images/tag-icons/globe.svg' },
  '消费科技': { bg: '#EEF4FB', color: '#5C6675', icon: '/images/tag-icons/device.svg' }
};

function parseTags(tags) {
  if (!tags) return [];
  var seen = {};
  return String(tags)
    .split(',')
    .map(function(tag) { return tag.trim(); })
    .filter(function(tag) {
      if (!tag || seen[tag]) return false;
      seen[tag] = true;
      return true;
    });
}

function normalizeKnownTags(tags) {
  var parsed = parseTags(tags);
  return CATEGORY_ORDER.filter(function(category) {
    return parsed.indexOf(category) !== -1;
  });
}

function orderCategories(categories) {
  categories = categories || [];
  var known = CATEGORY_ORDER.filter(function(category) {
    return categories.indexOf(category) !== -1;
  });
  var unknown = categories.filter(function(category) {
    return CATEGORY_ORDER.indexOf(category) === -1;
  });
  return known.concat(unknown);
}

function getCategoryMeta(category) {
  if (CATEGORY_META[category]) return CATEGORY_META[category];
  var fallback = CATEGORY_META[CATEGORY_ORDER[0]];
  return { bg: fallback.bg, color: fallback.color, icon: fallback.icon };
}

function buildOrderedTagList(tagStats) {
  var stats = tagStats || {};
  return CATEGORY_ORDER.filter(function(category) {
    return !!stats[category];
  }).map(function(category) {
    var meta = getCategoryMeta(category);
    return {
      name: category,
      count: stats[category].count || 0,
      latestTitle: stats[category].latestTitle || '',
      bg: meta.bg,
      color: meta.color,
      icon: meta.icon
    };
  });
}

module.exports = {
  formatDate,
  formatDateTime,
  parseQuestions,
  parseAiContent,
  getRemainingDays,
  resolveMembershipResponse,
  CATEGORY_ORDER,
  parseTags,
  normalizeKnownTags,
  orderCategories,
  getCategoryMeta,
  buildOrderedTagList
};
