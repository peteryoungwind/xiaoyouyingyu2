'use client';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/calendar';
import { Plus, Tag, Flame, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { CATEGORY_ORDER, getTagColor } from '@/lib/tag-colors';

export default function Home() {
  const { user, isAdmin } = useAuth();

  const { data: topicsData } = useQuery({
    queryKey: ['topics', 0],
    queryFn: () => api.getTopics({ page: '0', size: '5' }),
  });

  const { data: tagStats } = useQuery({
    queryKey: ['tagStats'],
    queryFn: () => api.getTagStats(),
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.getStats(),
  });

  const topics = topicsData?.content || [];
  const totalTopics = topicsData?.totalElements || 0;
  const days = stats?.days || 0;
  const categoryEntries = CATEGORY_ORDER.map(tag => [tag, (tagStats as Record<string, { count: number; latestTitle: string }> | undefined)?.[tag]] as const)
    .filter(([, info]) => Boolean(info));

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Left: main content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back! {user ? user.username : 'Guest'}
            </p>
          </div>
          {isAdmin && (
            <Link href="/admin"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white transition-colors hover:bg-gray-800 sm:w-auto">
              <Plus size={16} />
              Create Topic
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">主题总数</p>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-semibold">{totalTopics}</span>
              <Tag size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">已坚持</p>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-semibold">{days} <span className="text-base font-normal text-gray-400">天</span></span>
              <Flame size={20} className="text-orange-400" />
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">标签分类</p>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-semibold">{categoryEntries.length}</span>
              <Tag size={20} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tag Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">主题分类</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categoryEntries.map(([tag, info]) => (
                <Link key={tag} href={`/topics?tag=${encodeURIComponent(tag)}`}
                  className="group min-w-0 rounded-2xl bg-white p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(tag)}`}>
                      {tag}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MessageSquare size={14} />
                      <span className="text-xs">{info?.count}</span>
                    </div>
                  </div>
                  <p className="line-clamp-1 min-w-0 text-sm text-gray-600 transition-colors group-hover:text-gray-900">
                    {info?.latestTitle}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Right sidebar: Calendar + Recent Topics */}
      <div className="w-full space-y-6 shrink-0 xl:w-72">
        <Calendar onSelectDate={() => {}} selectedDate={null} />

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">最近主题</h3>
          <div className="space-y-4">
            {topics.map((topic: any) => (
              <Link key={topic.id} href={`/topic/${topic.id}`} className="flex min-w-0 gap-3 group">
                <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-lg h-fit whitespace-nowrap">
                  {topic.eventDate}
                </span>
                <p className="min-w-0 text-sm text-gray-900 group-hover:text-blue-500 transition-colors line-clamp-1">
                  {topic.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
