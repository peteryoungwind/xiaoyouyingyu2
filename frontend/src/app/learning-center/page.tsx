'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORY_ORDER, getTagColor, normalizeKnownTags, parseTags } from '@/lib/tag-colors';
import Link from 'next/link';
import { GraduationCap, Search } from 'lucide-react';

function ContactModal({ onClose }: { onClose: () => void }) {
  const { data: contact } = useQuery({ queryKey: ['membership-contact'], queryFn: () => api.getMembershipContact() });
  const { membershipExpireAt } = useAuth();
  const expired = membershipExpireAt && new Date(membershipExpireAt) <= new Date();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-sm space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-900 text-center">
          {expired ? '你的高级会员已过期，请联系管理员开通高级功能' : '请联系管理员开通高级功能'}
        </h3>
        <p className="text-sm text-gray-500 text-center">开通或续费后即可继续使用学习中心等高级功能</p>
        {contact?.wechat && <div className="text-sm text-center text-gray-700">微信：{contact.wechat}</div>}
        <div className="flex gap-2">
          <Link href="/settings" className="flex-1 py-2.5 text-sm rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-center">兑换卡密</Link>
          <button onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">关闭</button>
        </div>
      </div>
    </div>
  );
}

export default function LearningCenterPage() {
  const { isPremium, user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(0);
  const [showContact, setShowContact] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lc-topics', page, keyword, tag],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page), size: '12' };
      if (keyword) params.keyword = keyword;
      if (tag) params.tag = tag;
      return api.getTopics(params);
    },
    enabled: isPremium,
  });

  const { data: tagStats } = useQuery({
    queryKey: ['tagStats'],
    queryFn: () => api.getTagStats(),
  });

  if (!isPremium) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <GraduationCap size={48} className="text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">学习中心</h2>
          <p className="text-gray-500 mb-4">{user ? '该功能仅对高级用户开放' : '请先登录'}</p>
          {user && (
            <button onClick={() => setShowContact(true)}
              className="px-5 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-sm hover:bg-amber-100">
              开通会员
            </button>
          )}
        </div>
        {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      </>
    );
  }

  const topics = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const allTags = CATEGORY_ORDER.filter(category => Boolean((tagStats as Record<string, any> | undefined)?.[category]));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">学习中心</h1>
        <p className="text-sm text-gray-500 mt-1">选择一个主题开始口语练习与积累</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3">
        <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="搜索主题..." value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full min-w-0 pl-10 pr-4 py-2.5 rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-100 text-sm" />
          </div>
          <button type="submit"
            className="w-full px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 press-effect sm:w-auto">搜索</button>
        </form>
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setTag(''); setPage(0); }}
          className={`text-xs px-3 py-1.5 rounded-full transition-colors ${!tag ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
          全部
        </button>
        {allTags.map(t => (
          <button key={t} onClick={() => { setTag(t); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${tag === t ? 'bg-gray-900 text-white' : `${getTagColor(t)}`}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Topic Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : topics.length === 0 ? (
        <div className="text-center py-12 text-gray-400">暂无主题</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic: any) => {
            const tags = normalizeKnownTags(topic.tags);
            const displayTags = tags.length > 0 ? tags : parseTags(topic.tags);
            return (
              <Link key={topic.id} href={`/learning-center/topic/${topic.id}`}
                className="group min-w-0 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {displayTags.map((t: string) => (
                    <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(t.trim())}`}>
                      {t.trim()}
                    </span>
                  ))}
                </div>
                <h3 className="break-words font-medium text-gray-900 transition-colors group-hover:text-blue-600">{topic.title}</h3>
                {topic.titleZh && <p className="mt-0.5 break-words text-sm text-gray-500">{topic.titleZh}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{topic.eventDate}</span>
                  <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    进入学习 →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-center gap-2 pt-4 sm:flex-row">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 text-sm rounded-xl bg-white shadow-sm disabled:opacity-30">上一页</button>
          <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm rounded-xl bg-white shadow-sm disabled:opacity-30">下一页</button>
        </div>
      )}
    </div>
  );
}
