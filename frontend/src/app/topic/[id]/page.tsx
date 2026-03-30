'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { getTagColor } from '@/lib/tag-colors';
import { useParams, useRouter } from 'next/navigation';

export default function TopicDetail() {
  const { id } = useParams();
  const router = useRouter();

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', id],
    queryFn: () => api.getTopic(Number(id)),
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">加载中...</div>;
  if (!topic) return <div className="text-center py-12 text-gray-400">主题不存在</div>;

  const questions = typeof topic.questions === 'string' ? JSON.parse(topic.questions) : topic.questions;
  const tags = topic.tags ? topic.tags.split(',').filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 press-effect">
        &larr; 返回
      </button>

      <div className="bg-white rounded-apple-lg p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{topic.title}</h1>
            {topic.titleZh && <p className="text-base text-gray-500 mt-1">{topic.titleZh}</p>}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{topic.eventDate}</span>
        </div>

        {tags.length > 0 && (
          <div className="flex gap-1.5 mb-6">
            {tags.map((tag: string) => (
              <span key={tag} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${getTagColor(tag.trim())}`}>
                {tag.trim()}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q: { en: string; zh: string }, i: number) => (
            <div key={i} className="p-4 bg-gray-50 rounded-apple">
              <p className="text-sm font-medium text-gray-900 mb-1">
                <span className="text-gray-400 mr-2">Q{i + 1}</span>
                {q.en}
              </p>
              <p className="text-sm text-gray-500">{q.zh}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
