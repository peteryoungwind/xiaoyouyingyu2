const tagColors: Record<string, string> = {
  // 中文标签
  '日常': 'bg-blue-100 text-blue-700',
  '旅行': 'bg-green-100 text-green-700',
  '商务': 'bg-purple-100 text-purple-700',
  '学术': 'bg-yellow-100 text-yellow-700',
  '面试': 'bg-red-100 text-red-700',
  '社交': 'bg-pink-100 text-pink-700',
  '科技': 'bg-indigo-100 text-indigo-700',
  '文化': 'bg-orange-100 text-orange-700',
  '健康': 'bg-teal-100 text-teal-700',
  '美食': 'bg-amber-100 text-amber-700',
  '运动': 'bg-lime-100 text-lime-700',
  '娱乐': 'bg-cyan-100 text-cyan-700',
  // 英文标签
  'DAILY': 'bg-blue-100 text-blue-700',
  'TRAVEL': 'bg-green-100 text-green-700',
  'BUSINESS': 'bg-purple-100 text-purple-700',
  'ACADEMIC': 'bg-yellow-100 text-yellow-700',
  'INTERVIEW': 'bg-red-100 text-red-700',
  'SOCIAL': 'bg-pink-100 text-pink-700',
  'TECH': 'bg-indigo-100 text-indigo-700',
  'TECHNOLOGY': 'bg-indigo-100 text-indigo-700',
  'CULTURE': 'bg-orange-100 text-orange-700',
  'HEALTH': 'bg-teal-100 text-teal-700',
  'FOOD': 'bg-amber-100 text-amber-700',
  'SPORTS': 'bg-lime-100 text-lime-700',
  'ENTERTAINMENT': 'bg-cyan-100 text-cyan-700',
  'SOCIETY': 'bg-rose-100 text-rose-700',
  'EDUCATION': 'bg-violet-100 text-violet-700',
  'SCIENCE': 'bg-sky-100 text-sky-700',
  'ECONOMY': 'bg-emerald-100 text-emerald-700',
  'POLITICS': 'bg-fuchsia-100 text-fuchsia-700',
  'ENVIRONMENT': 'bg-green-100 text-green-700',
  'NEWS': 'bg-blue-100 text-blue-700',
};

// 用于未预定义 tag 的 fallback 颜色，每种颜色差异明显
const fallbackColors = [
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-yellow-100 text-yellow-700',
  'bg-red-100 text-red-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-amber-100 text-amber-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-fuchsia-100 text-fuchsia-700',
];

export function getTagColor(tag: string): string {
  // 先尝试原始值匹配
  if (tagColors[tag]) {
    return tagColors[tag];
  }
  // 再尝试大写匹配（兼容大小写不一致的情况）
  const upper = tag.toUpperCase();
  if (tagColors[upper]) {
    return tagColors[upper];
  }
  // Deterministic color based on tag string hash
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}
