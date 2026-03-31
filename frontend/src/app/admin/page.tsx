'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getTagColor } from '@/lib/tag-colors';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'ai' | 'manual' | 'topics' | 'users'>('ai');
  const [prompt, setPrompt] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);

  // Manual form state
  const emptyForm = { title: '', titleZh: '', tags: '', eventDate: new Date().toISOString().split('T')[0], questions: [{ en: '', zh: '' }] };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: topics } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => api.getTopics({ page: '0', size: '100' }),
    enabled: tab === 'topics',
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.getUsers(),
    enabled: tab === 'users',
  });

  const deleteTopic = useMutation({
    mutationFn: (id: number) => api.deleteTopic(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-topics'] }),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (!isAdmin) {
    return <div className="text-center py-12 text-gray-400">无权限访问</div>;
  }

  const handleGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await api.aiGenerate(prompt, history);
      const content = res.content;
      setHistory(prev => [...prev, { role: 'user', content: prompt }, { role: 'assistant', content }]);
      try {
        setAiResult(JSON.parse(content));
      } catch {
        setAiResult({ raw: content });
      }
      setPrompt('');
    } catch (err: any) {
      setAiResult({ error: err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveTopic = async () => {
    if (!aiResult || aiResult.error || aiResult.raw) return;
    await api.createTopic({
      title: aiResult.title,
      titleZh: aiResult.titleZh || '',
      tags: Array.isArray(aiResult.tags) ? aiResult.tags.join(',') : aiResult.tags || '',
      eventDate,
      questions: JSON.stringify(aiResult.questions),
    });
    setAiResult(null);
    setHistory([]);
    queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
  };

  const handleSaveManual = async () => {
    if (!form.title || !form.eventDate || form.questions.some(q => !q.en)) return;
    setSaving(true);
    try {
      await api.createTopic({
        title: form.title,
        titleZh: form.titleZh,
        tags: form.tags,
        eventDate: form.eventDate,
        questions: JSON.stringify(form.questions.filter(q => q.en)),
      });
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'ai', label: 'AI 生成' },
    { key: 'manual', label: '手动创建' },
    { key: 'topics', label: '主题管理' },
    { key: 'users', label: '用户管理' },
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">管理后台</h1>

      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded-apple press-effect transition-colors
              ${tab === t.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* AI Generation Tab */}
      {tab === 'ai' && (
        <div className="bg-white rounded-apple-lg p-6 shadow-sm space-y-4">
          <div className="flex gap-2">
            <input type="text" placeholder="输入主题需求，如：面试英语、旅行对话..." value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              className="flex-1 px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
            <button onClick={handleGenerate} disabled={aiLoading || !prompt}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50">
              {aiLoading ? '生成中...' : '生成'}
            </button>
          </div>

          {history.length > 0 && (
            <button onClick={() => { setHistory([]); setAiResult(null); }}
              className="text-xs text-gray-400 hover:text-gray-600">清除对话历史</button>
          )}

          {aiResult && (
            <div className="space-y-4">
              {aiResult.error ? (
                <p className="text-red-500 text-sm">{aiResult.error}</p>
              ) : aiResult.raw ? (
                <pre className="text-xs bg-gray-50 p-4 rounded-apple overflow-auto">{aiResult.raw}</pre>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-apple">
                    <h3 className="font-medium">{aiResult.title}</h3>
                    {aiResult.titleZh && <p className="text-sm text-gray-500 mt-0.5">{aiResult.titleZh}</p>}
                    {aiResult.tags && (
                      <div className="flex gap-1.5 mt-2">
                        {(Array.isArray(aiResult.tags) ? aiResult.tags : [aiResult.tags]).map((t: string) => (
                          <span key={t} className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTagColor(t.trim())}`}>{t}</span>
                        ))}
                      </div>
                    )}
                    {aiResult.questions?.map((q: any, i: number) => (
                      <div key={i} className="mt-3 text-sm">
                        <p className="text-gray-900">Q{i + 1}: {q.en}</p>
                        <p className="text-gray-500">{q.zh}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                      className="px-3 py-2 rounded-apple bg-gray-100 text-sm outline-none" />
                    <button onClick={handleSaveTopic}
                      className="px-5 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800">
                      保存主题
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Manual Creation Tab */}
      {tab === 'manual' && (
        <div className="bg-white rounded-apple-lg p-6 shadow-sm space-y-4">
          <div className="space-y-3">
            <input type="text" placeholder="主题标题 *" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
            <input type="text" placeholder="中文标题" value={form.titleZh}
              onChange={e => setForm(f => ({ ...f, titleZh: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
            <div className="flex gap-3">
              <input type="text" placeholder="标签（逗号分隔，如 TECH,SOCIETY）" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="flex-1 px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
              <input type="date" value={form.eventDate}
                onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                className="px-3 py-2 rounded-apple bg-gray-100 text-sm outline-none" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">问题列表</p>
            {form.questions.map((q, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input type="text" placeholder={`Q${i + 1} English *`} value={q.en}
                    onChange={e => setForm(f => ({ ...f, questions: f.questions.map((x, j) => j === i ? { ...x, en: e.target.value } : x) }))}
                    className="w-full px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                  <input type="text" placeholder="中文对应" value={q.zh}
                    onChange={e => setForm(f => ({ ...f, questions: f.questions.map((x, j) => j === i ? { ...x, zh: e.target.value } : x) }))}
                    className="w-full px-3 py-2 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-200 text-sm" />
                </div>
                {form.questions.length > 1 && (
                  <button onClick={() => setForm(f => ({ ...f, questions: f.questions.filter((_, j) => j !== i) }))}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none mt-2">×</button>
                )}
              </div>
            ))}
            <button onClick={() => setForm(f => ({ ...f, questions: [...f.questions, { en: '', zh: '' }] }))}
              className="text-sm text-blue-500 hover:text-blue-600">+ 添加问题</button>
          </div>

          <button onClick={handleSaveManual} disabled={saving || !form.title || !form.eventDate}
            className="px-5 py-2 bg-gray-900 text-white rounded-apple text-sm press-effect hover:bg-gray-800 disabled:opacity-50">
            {saving ? '保存中...' : '保存主题'}
          </button>
        </div>
      )}

      {/* Topics Management Tab */}
      {tab === 'topics' && (
        <div className="space-y-3">
          {(topics?.content || []).map((topic: any) => (
            <div key={topic.id} className="bg-white rounded-apple-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{topic.title}</h3>
                {topic.titleZh && <p className="text-xs text-gray-500">{topic.titleZh}</p>}
                <p className="text-xs text-gray-400">{topic.eventDate}</p>
              </div>
              <button onClick={() => deleteTopic.mutate(topic.id)}
                className="text-xs text-red-400 hover:text-red-600 press-effect">删除</button>
            </div>
          ))}
        </div>
      )}

      {/* Users Management Tab */}
      {tab === 'users' && (
        <div className="space-y-3">
          {(users || []).map((user: any) => (
            <div key={user.id} className="bg-white rounded-apple-lg p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{user.username}</span>
                <select value={user.role}
                  onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                  disabled={user.role === 'ADMIN' && (users || []).filter((x: any) => x.role === 'ADMIN').length <= 1}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-gray-200">
                  <option value="USER">普通用户</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </div>
              {user.role !== 'ADMIN' && (
                <button onClick={() => deleteUser.mutate(user.id)}
                  className="text-xs text-red-400 hover:text-red-600 press-effect">删除</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
