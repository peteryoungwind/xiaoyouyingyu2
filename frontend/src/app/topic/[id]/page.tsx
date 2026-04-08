'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORY_ORDER, getTagColor, normalizeKnownTags, parseTags } from '@/lib/tag-colors';
import { useParams, useRouter } from 'next/navigation';
import { Pencil, Check, X, Plus, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function TopicDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin, isPremium } = useAuth();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', id],
    queryFn: () => api.getTopic(Number(id)),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.updateTopic(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', id] });
      setEditing(false);
    },
  });

  if (isLoading) return <div className="text-center py-12 text-gray-400">加载中...</div>;
  if (!topic) return <div className="text-center py-12 text-gray-400">主题不存在</div>;

  const questions = typeof topic.questions === 'string' ? JSON.parse(topic.questions) : topic.questions;
  const tags = normalizeKnownTags(topic.tags);
  const displayTags = tags.length > 0 ? tags : parseTags(topic.tags);

  const startEdit = () => {
    setForm({
      title: topic.title,
      titleZh: topic.titleZh || '',
      tags: topic.tags || '',
      eventDate: topic.eventDate,
      questions: [...questions],
    });
    setEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      title: form.title,
      titleZh: form.titleZh,
      tags: form.tags,
      eventDate: form.eventDate,
      questions: JSON.stringify(form.questions.filter((q: any) => q.en)),
    });
  };

  // Edit mode
  if (editing && form) {
    return (
      <div className="space-y-6">
        <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-900 press-effect">
          &larr; 取消编辑
        </button>

        <div className="bg-white rounded-apple-lg p-6 shadow-sm space-y-4">
          <input type="text" placeholder="英文标题 *" value={form.title}
            onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
          <input type="text" placeholder="中文标题" value={form.titleZh}
            onChange={e => setForm((f: any) => ({ ...f, titleZh: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
          <div className="flex gap-3 items-start">
            <div className="flex-1 space-y-2">
              <input type="text" placeholder="分类（逗号分隔，如 个人成长,学习提升）" value={form.tags}
                onChange={e => setForm((f: any) => ({ ...f, tags: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map(category => {
                  const selected = parseTags(form.tags).includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        const next = parseTags(form.tags);
                        const value = next.includes(category)
                          ? next.filter(item => item !== category)
                          : [...next, category];
                        setForm((f: any) => ({ ...f, tags: value.join(',') }));
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${selected ? 'bg-gray-900 text-white' : getTagColor(category)}`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
            <input type="date" value={form.eventDate}
              onChange={e => setForm((f: any) => ({ ...f, eventDate: e.target.value }))}
              className="px-3 py-2 rounded-apple bg-gray-100 text-sm outline-none" />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">问题列表</p>
            {form.questions.map((q: any, i: number) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input type="text" placeholder={`Q${i + 1} English *`} value={q.en}
                    onChange={e => setForm((f: any) => ({ ...f, questions: f.questions.map((x: any, j: number) => j === i ? { ...x, en: e.target.value } : x) }))}
                    className="w-full px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  <input type="text" placeholder="中文对应" value={q.zh}
                    onChange={e => setForm((f: any) => ({ ...f, questions: f.questions.map((x: any, j: number) => j === i ? { ...x, zh: e.target.value } : x) }))}
                    className="w-full px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                </div>
                {form.questions.length > 1 && (
                  <button onClick={() => setForm((f: any) => ({ ...f, questions: f.questions.filter((_: any, j: number) => j !== i) }))}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none mt-2">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setForm((f: any) => ({ ...f, questions: [...f.questions, { en: '', zh: '' }] }))}
              className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1">
              <Plus size={14} /> 添加问题
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-apple flex items-center gap-1">
              <X size={14} /> 取消
            </button>
            <button onClick={handleSave}
              disabled={updateMutation.isPending || !form.title}
              className="px-5 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1">
              <Check size={14} /> {updateMutation.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View mode
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
          <div className="flex items-center gap-3 ml-4">
            <span className="text-xs text-gray-400 whitespace-nowrap">{topic.eventDate}</span>
            {isAdmin && (
              <button onClick={startEdit}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 press-effect">
                <Pencil size={14} /> 编辑
              </button>
            )}
          </div>
        </div>

        {displayTags.length > 0 && (
          <div className="flex gap-1.5 mb-6 flex-wrap">
            {displayTags.map((tag: string) => (
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

      {isPremium && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <GraduationCap size={20} className="text-blue-500" />
                学习中心
              </h3>
              <p className="text-sm text-gray-500 mt-1">围绕本主题进行词汇积累、表达训练、AI口语练习</p>
            </div>
            <Link href={`/learning-center/topic/${id}`}
              className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600 transition-colors press-effect whitespace-nowrap">
              进入学习中心
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
