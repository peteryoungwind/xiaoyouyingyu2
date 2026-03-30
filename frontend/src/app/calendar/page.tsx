'use client';
import { useState } from 'react';
import { Calendar } from '@/components/calendar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function CalendarPage() {
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
      <div className="flex gap-6">
        <div className="w-80">
          <Calendar onSelectDate={setSelectedDate} selectedDate={selectedDate} />
        </div>
        <div className="flex-1">
          {selectedDate ? (
            topics.length > 0 ? (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-gray-500">{selectedDate} 的主题</h2>
                {topics.map((t: any) => (
                  <Link key={t.id} href={`/topic/${t.id}`}
                    className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-medium text-gray-900">{t.title}</h3>
                    {t.titleZh && <p className="text-sm text-gray-500 mt-0.5">{t.titleZh}</p>}
                    <p className="text-xs text-gray-400 mt-1">{t.eventDate}</p>
                  </Link>
                ))}
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
