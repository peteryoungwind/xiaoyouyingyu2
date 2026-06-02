'use client';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, isAuthExpiredError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { BookOpenText, Loader2, Plus, RefreshCw, Upload } from 'lucide-react';

const emptyParagraph = { contentEn: '', contentZh: '' };
const emptyForm = {
  title: '',
  titleZh: '',
  audioUrl: '',
  summary: '',
  vocabulary: '',
  expressions: '',
  status: 'DRAFT',
  paragraphs: [{ ...emptyParagraph }],
};

export default function AdminDailyArticlesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [published, setPublished] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [message, setMessage] = useState('');

  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-daily-articles', status, published],
    queryFn: () => api.getAdminDailyArticles({ page: '0', size: '100', status, published }),
    enabled: isAdmin,
  });
  const articles = pageData?.content || [];

  const { data: detail } = useQuery({
    queryKey: ['admin-daily-article', selectedId],
    queryFn: () => api.getAdminDailyArticle(selectedId as number),
    enabled: isAdmin && !!selectedId,
  });

  useEffect(() => {
    if (!detail) return;
    setForm({
      title: detail.title || '',
      titleZh: detail.titleZh || '',
      audioUrl: detail.audioUrl || '',
      summary: detail.summary || '',
      vocabulary: detail.vocabulary || '',
      expressions: detail.expressions || '',
      status: detail.status || 'DRAFT',
      paragraphs: detail.paragraphs?.length ? detail.paragraphs.map((p: any) => ({
        contentEn: p.contentEn || '',
        contentZh: p.contentZh || '',
      })) : [{ ...emptyParagraph }],
    });
  }, [detail]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-daily-articles'] });
    queryClient.invalidateQueries({ queryKey: ['admin-daily-article'] });
  }

  function handleError(error: any) {
    if (isAuthExpiredError(error)) return;
    setMessage(error?.message || '操作失败');
  }

  function normalizePayload() {
    return {
      ...form,
      paragraphs: form.paragraphs.map((paragraph: any, index: number) => ({
        sortOrder: index + 1,
        contentEn: paragraph.contentEn,
        contentZh: paragraph.contentZh,
      })),
    };
  }

  const saveArticle = useMutation({
    mutationFn: () => selectedId
      ? api.updateDailyArticle(selectedId, normalizePayload())
      : api.createDailyArticle(normalizePayload()),
    onSuccess: (saved: any) => {
      setMessage(selectedId ? '外刊已更新' : '外刊已创建');
      setSelectedId(saved.id || selectedId);
      refresh();
    },
    onError: handleError,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: string }) => api.updateDailyArticleStatus(id, nextStatus),
    onSuccess: refresh,
    onError: handleError,
  });

  const removeArticle = useMutation({
    mutationFn: (id: number) => api.deleteDailyArticle(id),
    onSuccess: () => {
      setSelectedId(null);
      setForm(emptyForm);
      setMessage('外刊已删除');
      refresh();
    },
    onError: handleError,
  });

  const publishToday = useMutation({
    mutationFn: () => api.publishTodayDailyArticle(),
    onSuccess: (response: any) => {
      setMessage(response.message || '操作完成');
      refresh();
    },
    onError: handleError,
  });

  const uploadAudio = useMutation({
    mutationFn: (file: File) => api.uploadDailyArticleAudio(file),
    onSuccess: (response: any) => {
      setForm((prev: any) => ({ ...prev, audioUrl: response.audioUrl || '' }));
      setMessage('音频已上传');
    },
    onError: handleError,
  });

  if (!isAdmin) {
    return <div className="py-16 text-center text-gray-400">仅管理员可访问</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">每日外刊管理</h1>
          <p className="mt-1 text-sm text-gray-500">维护外刊库存、音频、正文与每日推送</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => publishToday.mutate()} disabled={publishToday.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
            {publishToday.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            生成今日外刊
          </button>
          <button onClick={() => { setSelectedId(null); setForm(emptyForm); setMessage(''); }}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white hover:bg-gray-800">
            <Plus size={16} />
            新增外刊
          </button>
        </div>
      </div>

      {message && <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-600">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex gap-2">
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none">
                <option value="">全部状态</option>
                <option value="DRAFT">草稿</option>
                <option value="ENABLED">启用</option>
                <option value="DISABLED">禁用</option>
              </select>
              <select value={published} onChange={e => setPublished(e.target.value)}
                className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none">
                <option value="">全部</option>
                <option value="true">已推送</option>
                <option value="false">未推送</option>
              </select>
            </div>
            {isLoading ? (
              <div className="py-10 text-center text-gray-400">加载中...</div>
            ) : articles.length === 0 ? (
              <div className="py-10 text-center text-gray-400">暂无外刊</div>
            ) : (
              <div className="space-y-2">
                {articles.map((article: any) => (
                  <button key={article.id} onClick={() => setSelectedId(article.id)}
                    className={`w-full rounded-xl p-3 text-left transition-colors ${selectedId === article.id ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900">{article.title}</p>
                        {article.titleZh && <p className="truncate text-xs text-gray-500">{article.titleZh}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${article.status === 'ENABLED' ? 'bg-emerald-100 text-emerald-700' : article.status === 'DISABLED' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-700'}`}>
                        {article.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">{article.publishedDate ? `已推送 ${article.publishedDate}` : `未推送 · ${article.paragraphCount || 0} 段`}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <BookOpenText size={19} className="text-emerald-600" />
            <h2 className="font-semibold text-gray-900">{selectedId ? '编辑外刊' : '新增外刊'}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm text-gray-500">英文标题</span>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm text-gray-500">中文标题</span>
              <input value={form.titleZh} onChange={e => setForm({ ...form, titleZh: e.target.value })}
                className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <label className="space-y-1.5">
              <span className="text-sm text-gray-500">音频 URL</span>
              <input value={form.audioUrl} onChange={e => setForm({ ...form, audioUrl: e.target.value })}
                className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="flex cursor-pointer items-end">
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-200">
                {uploadAudio.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                上传音频
              </span>
              <input type="file" accept="audio/*" className="hidden" onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadAudio.mutate(file);
                e.currentTarget.value = '';
              }} />
            </label>
          </div>

          <label className="space-y-1.5">
            <span className="text-sm text-gray-500">状态</span>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100 md:w-48">
              <option value="DRAFT">草稿</option>
              <option value="ENABLED">启用</option>
              <option value="DISABLED">禁用</option>
            </select>
          </label>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">正文段落</h3>
              <button onClick={() => setForm({ ...form, paragraphs: [...form.paragraphs, { ...emptyParagraph }] })}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-100">新增段落</button>
            </div>
            {form.paragraphs.map((paragraph: any, index: number) => (
              <div key={index} className="rounded-xl bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-gray-400">段落 {index + 1}</span>
                  <button onClick={() => setForm({ ...form, paragraphs: form.paragraphs.filter((_: any, i: number) => i !== index) })}
                    className="text-xs text-red-500">删除</button>
                </div>
                <textarea value={paragraph.contentEn} rows={4} placeholder="英文正文"
                  onChange={e => setForm({ ...form, paragraphs: form.paragraphs.map((p: any, i: number) => i === index ? { ...p, contentEn: e.target.value } : p) })}
                  className="mb-2 w-full rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
                <textarea value={paragraph.contentZh} rows={3} placeholder="中文翻译"
                  onChange={e => setForm({ ...form, paragraphs: form.paragraphs.map((p: any, i: number) => i === index ? { ...p, contentZh: e.target.value } : p) })}
                  className="w-full rounded-lg bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
              </div>
            ))}
          </section>

          <label className="space-y-1.5">
            <span className="text-sm text-gray-500">文章总结</span>
            <textarea value={form.summary} rows={4} onChange={e => setForm({ ...form, summary: e.target.value })}
              className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm text-gray-500">重点词汇 JSON</span>
              <textarea value={form.vocabulary} rows={5} onChange={e => setForm({ ...form, vocabulary: e.target.value })}
                placeholder='[{"word":"...","zh":"...","example":"..."}]'
                className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm text-gray-500">表达句型 JSON</span>
              <textarea value={form.expressions} rows={5} onChange={e => setForm({ ...form, expressions: e.target.value })}
                placeholder='[{"template":"...","zh":"...","example":"..."}]'
                className="w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-100" />
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            {selectedId && (
              <>
                <button onClick={() => changeStatus.mutate({ id: selectedId, nextStatus: 'ENABLED' })}
                  className="rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100">启用</button>
                <button onClick={() => changeStatus.mutate({ id: selectedId, nextStatus: 'DISABLED' })}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">禁用</button>
                <button onClick={() => removeArticle.mutate(selectedId)}
                  className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 hover:bg-red-100">删除</button>
              </>
            )}
            <button onClick={() => saveArticle.mutate()} disabled={saveArticle.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50">
              {saveArticle.isPending && <Loader2 size={16} className="animate-spin" />}
              保存
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
