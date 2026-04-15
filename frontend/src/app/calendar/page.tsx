'use client';
import { useState } from 'react';
import { Calendar } from '@/components/calendar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function CalendarPage() {
  const { isPremium } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['topics-by-date', selectedDate],
    queryFn: () => {
      const params: Record<string, string> = { page: '0', size: '20' };
      if (selectedDate) { params.startDate = selectedDate; params.endDate = selectedDate; }
      return api.getTopics(params);
    },
    enabled: !!selectedDate,
  });

  const topics = data?.content || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">日历</h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full overflow-x-auto lg:w-80 lg:shrink-0">
          <Calendar onSelectDate={setSelectedDate} selectedDate={selectedDate} />
        </div>
        <div className="min-w-0 flex-1">
          {selectedDate ? (
            topics.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-gray-500">{selectedDate} 的主题</h2>
                {topics.map((t: any) => {
                  const questions = t.questions ? (typeof t.questions === 'string' ? JSON.parse(t.questions) : t.questions) : [];
                  return (
                    <div key={t.id} className="bg-white rounded-2xl p-4 shadow-sm">
                      <h3 className="font-medium text-gray-900">{t.title}</h3>
                      {t.titleZh && <p className="text-sm text-gray-500 mt-0.5">{t.titleZh}</p>}
                      {isPremium && (
                        <Link href={`/learning-center/topic/${t.id}`}
                          className="flex items-center gap-1.5 mt-3 px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-medium hover:bg-blue-100 transition-colors w-fit">
                          <GraduationCap size={14} /> 进入学习中心
                        </Link>
                      )}
                      {questions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {questions.map((q: { en: string; zh: string }, i: number) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-xl">
                              <p className="text-sm font-medium text-gray-900">
                                <span className="text-gray-400 mr-2">Q{i + 1}</span>{q.en}
                              </p>
                              <p className="text-sm text-gray-500">{q.zh}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">该日期暂无主题</p>
            )
          ) : (
            <p className="text-gray-400 text-sm">请选择一个日期查看主题</p>
          )}
        </div>
      </div>
    </div>
  );
}
