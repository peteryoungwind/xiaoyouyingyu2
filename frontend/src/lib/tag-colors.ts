export const CATEGORY_ORDER = [
  '自我成长',
  '情绪心理',
  '人际沟通',
  '生活习惯',
  '学习方法',
  '职场发展',
  '文化旅行',
  '兴趣娱乐',
  '消费科技',
] as const;

export type CategoryName = typeof CATEGORY_ORDER[number];

type CategoryMeta = {
  color: string;
};

export type TagStats = Record<string, { count?: number; latestTitle?: string } | undefined>;

export type OrderedTag = {
  name: CategoryName;
  count: number;
  latestTitle: string;
};

const CATEGORY_META: Record<CategoryName, CategoryMeta> = {
  自我成长: { color: 'bg-[#EAF2FF] text-[#5C6675]' },
  情绪心理: { color: 'bg-[#FFF1EE] text-[#5C6675]' },
  人际沟通: { color: 'bg-[#FFF0F6] text-[#5C6675]' },
  生活习惯: { color: 'bg-[#EEF8EE] text-[#5C6675]' },
  学习方法: { color: 'bg-[#EEF3FF] text-[#5C6675]' },
  职场发展: { color: 'bg-[#F1EFFD] text-[#5C6675]' },
  文化旅行: { color: 'bg-[#EAF5FF] text-[#5C6675]' },
  兴趣娱乐: { color: 'bg-[#FFF7E8] text-[#5C6675]' },
  消费科技: { color: 'bg-[#EEF4FB] text-[#5C6675]' },
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

export function buildOrderedTagList(tagStats?: TagStats | null): OrderedTag[] {
  const stats = tagStats || {};

  return CATEGORY_ORDER
    .map(category => ({
      name: category,
      count: Number(stats[category]?.count || 0),
      latestTitle: stats[category]?.latestTitle || '',
    }));
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
