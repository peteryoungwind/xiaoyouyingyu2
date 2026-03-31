'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getTagColor } from '@/lib/tag-colors';
import { AuthModal } from '@/components/auth-modal';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function TopicsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [showAuth, setShowAuth] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tag, setTag] = useState(searchParams.get('tag') || '');
  const [page, setPage] = useState(0);
  const [jumpInput, setJumpInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['topics', page, keyword, tag],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page), size: '10' };
      if (keyword) params.keyword = keyword;
      if (tag) params.tag = tag;
      return api.getTopics(params);
    },
  });

  const topics = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuth(true);
      return;
    }
    setKeyword(searchInput);
    setPage(0);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!user) { e.preventDefault(); setShowAuth(true); }
  };

  useEffect(() => {
    setJumpInput(String(page + 1));
  }, [page]);

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

      <form onSubmit={handleSearch} className="flex gap-2">
        <input type="text" placeholder="搜索主题..." value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white border-0 shadow-sm outline-none focus:ring-2 focus:ring-blue-100 text-sm" />
        <button type="submit"
          className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800">搜索</button>
      </form>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无主题</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {topics.map((topic: any) => {
            const tags = topic.tags ? topic.tags.split(',').filter(Boolean) : [];
            return (
              <Link key={topic.id} href={`/topic/${topic.id}`} onClick={handleClick}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-1.5 mb-2">
                  {tags.map((t: string) => (
                    <span key={t} className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(t.trim())}`}>
                      {t.trim()}
                    </span>
                  ))}
                </div>
                <h3 className="font-medium text-gray-900">{topic.title}</h3>
                {topic.titleZh && <p className="text-sm text-gray-500 mt-0.5">{topic.titleZh}</p>}
                <p className="text-xs text-gray-400 mt-1">{topic.eventDate}</p>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
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
