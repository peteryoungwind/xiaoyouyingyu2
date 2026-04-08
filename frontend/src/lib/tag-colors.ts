export const CATEGORY_ORDER = [
  '个人成长',
  '情绪心理',
  '人际交往',
  '生活方式',
  '职场发展',
  '学习提升',
  '文化旅行',
  '消费科技',
] as const;

export type CategoryName = typeof CATEGORY_ORDER[number];

const CATEGORY_META: Record<CategoryName, { color: string }> = {
  个人成长: { color: 'bg-slate-100 text-slate-700' },
  情绪心理: { color: 'bg-rose-100 text-rose-700' },
  人际交往: { color: 'bg-pink-100 text-pink-700' },
  生活方式: { color: 'bg-emerald-100 text-emerald-700' },
  职场发展: { color: 'bg-violet-100 text-violet-700' },
  学习提升: { color: 'bg-blue-100 text-blue-700' },
  文化旅行: { color: 'bg-cyan-100 text-cyan-700' },
  消费科技: { color: 'bg-indigo-100 text-indigo-700' },
};

const CATEGORY_SET = new Set<string>(CATEGORY_ORDER);

const fallbackColors = [
  'bg-slate-100 text-slate-700',
  'bg-rose-100 text-rose-700',
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
];

export function isKnownCategory(tag: string): tag is CategoryName {
  return CATEGORY_SET.has((tag || '').trim());
}

export function parseTags(tags?: string | null): string[] {
  if (!tags) return [];

  const seen = new Set<string>();
  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .filter(tag => {
      if (seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

export function normalizeKnownTags(tags?: string | null): string[] {
  const parsed = parseTags(tags).filter(isKnownCategory);
  return CATEGORY_ORDER.filter(category => parsed.includes(category));
}

export function orderCategories<T extends string>(categories: T[]): T[] {
  const known = CATEGORY_ORDER.filter(category => categories.includes(category as T)) as T[];
  const unknown = categories.filter(category => !CATEGORY_SET.has(category));
  return [...known, ...unknown];
}

export function getTagColor(tag: string): string {
  const normalized = (tag || '').trim();
  if (isKnownCategory(normalized)) {
    return CATEGORY_META[normalized].color;
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}
