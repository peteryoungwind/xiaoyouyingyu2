'use client';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/calendar';
import { Plus, Tag, Flame, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { getTagColor } from '@/lib/tag-colors';

export default function Home() {
  const { user } = useAuth();

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

  return (
    <div className="flex gap-6">
      {/* Left: main content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back! {user ? user.username : 'Guest'}
            </p>
          </div>
          <Link href="/admin"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 transition-colors">
            <Plus size={16} />
            Create Topic
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
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
              <span className="text-3xl font-semibold">{tagStats ? Object.keys(tagStats).length : 0}</span>
              <Tag size={20} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tag Categories */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">主题分类</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tagStats && Object.entries(tagStats as Record<string, { count: number; latestTitle: string }>)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([tag, info]) => (
                <Link key={tag} href={`/topics?tag=${encodeURIComponent(tag)}`}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getTagColor(tag)}`}>
                      {tag}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400">
                      <MessageSquare size={14} />
                      <span className="text-xs">{info.count}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 group-hover:text-gray-900 transition-colors">
                    {info.latestTitle}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Right sidebar: Calendar + Recent Topics */}
      <div className="w-72 space-y-6 shrink-0">
        <Calendar onSelectDate={() => {}} selectedDate={null} />

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">最近主题</h3>
          <div className="space-y-4">
            {topics.map((topic: any) => (
              <Link key={topic.id} href={`/topic/${topic.id}`} className="flex gap-3 group">
                <span className="text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-lg h-fit whitespace-nowrap">
                  {topic.eventDate}
                </span>
                <p className="text-sm text-gray-900 group-hover:text-blue-500 transition-colors line-clamp-1">
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
