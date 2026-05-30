'use client';
import { Suspense, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { buildOrderedTagList, getTagColor, normalizeKnownTags, parseTags, TagStats } from '@/lib/tag-colors';
import { AuthModal } from '@/components/auth-modal';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap } from 'lucide-react';

function TopicsPageContent() {
  const { user, isPremium } = useAuth();
  const searchParams = useSearchParams();
  const [showAuth, setShowAuth] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [page, setPage] = useState(0);
  const [jumpInput, setJumpInput] = useState('');
  const activeTagFromUrl = searchParams.get('tag') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['topics', page, keyword, tag],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page), size: '10' };
      if (keyword) params.keyword = keyword;
      if (tag) params.tag = tag;
      return api.getTopics(params);
    },
  });

  const { data: tagStats } = useQuery({
    queryKey: ['tagStats'],
    queryFn: () => api.getTagStats(),
  });

  const topics = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const categoryOptions = buildOrderedTagList(tagStats as TagStats | undefined);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    const trimmedKeyword = searchInput.trim();
    setSearchInput(trimmedKeyword);
    setKeyword(trimmedKeyword);
    setTag('');
    setPage(0);
  };

  useEffect(() => {
    setTag(activeTagFromUrl);
    setPage(0);
  }, [activeTagFromUrl]);


  const handleJump = () => {
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setPage(target - 1);
    } else {
      setJumpInput(String(page + 1));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">主题列表</h1>

      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <input type="text" placeholder="搜索主题..." value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="min-w-0 flex-1 px-4 py-2.5 rounded-xl bg-white border-0 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 text-sm" />
          <button type="submit"
            className="w-full rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800 sm:w-auto">搜索</button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setTag(''); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!tag ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            全部
          </button>
          {categoryOptions.map(category => (
            <button
              key={category.name}
              onClick={() => { setTag(category.name); setPage(0); }}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${tag === category.name ? 'bg-gray-900 text-white' : getTagColor(category.name)}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无主题</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {topics.map((topic: any) => {
            const tags = normalizeKnownTags(topic.tags);
            const displayTags = tags.length > 0 ? tags : parseTags(topic.tags);
            return (
              <div key={topic.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <Link href={`/topic/${topic.id}`} className="block min-w-0">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {displayTags.map((t: string) => (
                      <span key={t} className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(t.trim())}`}>
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                  <h3 className="break-words font-medium text-gray-900">{topic.title}</h3>
                  {topic.titleZh && <p className="mt-0.5 break-words text-sm text-gray-500">{topic.titleZh}</p>}
                  <p className="text-xs text-gray-400 mt-1">{topic.eventDate}</p>
                </Link>
                {isPremium && (
                  <Link href={`/learning-center/topic/${topic.id}`}
                    className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors w-fit">
                    <GraduationCap size={14} /> 进入学习中心
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-2 pt-4 sm:flex-row">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 text-sm rounded-xl bg-white shadow-sm disabled:opacity-30">上一页</button>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={jumpInput}
              onChange={e => setJumpInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJump()}
              onBlur={handleJump}
              className="w-12 px-2 py-2 text-sm text-center rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-100"
            />
            <span className="text-sm text-gray-500">/ {totalPages}</span>
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm rounded-xl bg-white shadow-sm disabled:opacity-30">下一页</button>
        </div>
      )}

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

export default function TopicsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}>
      <TopicsPageContent />
    </Suspense>
  );
}
