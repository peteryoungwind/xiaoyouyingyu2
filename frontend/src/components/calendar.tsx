'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  onSelectDate: (date: string | null) => void;
  selectedDate: string | null;
}

export function Calendar({ onSelectDate, selectedDate }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: calendarData } = useQuery({
    queryKey: ['calendar', year, month],
    queryFn: () => api.getCalendar(year, month),
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday first
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  const toDateStr = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const hasContent = (day: number) => calendarData && calendarData[toDateStr(day)];
  const isToday = (day: number) => year === now.getFullYear() && month === now.getMonth() + 1 && day === now.getDate();
  const isSelected = (day: number) => selectedDate === toDateStr(day);

  const handleClick = (day: number) => {
    const d = toDateStr(day);
    onSelectDate(selectedDate === d ? null : d);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{monthNames[month - 1]} {year}</h3>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center text-xs text-gray-400 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {blanks.map(i => <div key={`b${i}`} className="py-1.5" />)}
        {days.map(day => (
          <button key={day} onClick={() => handleClick(day)}
            className={`relative py-1.5 text-sm rounded-full w-8 h-8 mx-auto flex items-center justify-center transition-colors
              ${isSelected(day) || isToday(day) ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
            {day}
            {hasContent(day) && !isSelected(day) && !isToday(day) && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
