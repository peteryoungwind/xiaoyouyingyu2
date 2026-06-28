'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, Loader2, Search, XCircle } from 'lucide-react';
import { api, isAuthExpiredError, TopicSubmissionDetail, TopicSubmissionStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function statusLabel(status?: string) {
  return ({ PENDING: '待处理', ACCEPTED: '已采纳', REJECTED: '未采纳' } as Record<string, string>)[status || ''] || status || '-';
}

function statusClass(status?: string) {
  if (status === 'ACCEPTED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-gray-100 text-gray-500';
  return 'bg-amber-50 text-amber-700';
}

function formatTime(value?: string) {
  return value ? value.replace('T', ' ').substring(0, 19) : '-';
}

export default function AdminTopicSubmissionsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordDraft, setKeywordDraft] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const params = useMemo(() => {
    const next: Record<string, string> = { page: String(page), size: '20' };
    if (status) next.status = status;
    if (keyword) next.keyword = keyword;
    return next;
  }, [page, status, keyword]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-topic-submissions', params],
    queryFn: () => api.getAdminTopicSubmissions(params),
    enabled: isAdmin,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-topic-submission', selectedId],
    queryFn: () => api.getAdminTopicSubmission(selectedId as number),
    enabled: isAdmin && !!selectedId,
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['admin-topic-submissions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-topic-submission'] });
  }

  function handleError(error: any) {
    if (isAuthExpiredError(error)) return;
    setMessage(error?.message || '操作失败');
  }

  const updateStatus = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: TopicSubmissionStatus }) =>
      api.updateAdminTopicSubmissionStatus(id, nextStatus),
    onSuccess: () => {
      setMessage('状态已更新');
      refresh();
    },
    onError: handleError,
  });

  const submissions = data?.content || [];
  const pendingCount = submissions.filter(item => item.status === 'PENDING').length;
  const acceptedCount = submissions.filter(item => item.status === 'ACCEPTED').length;
  const rejectedCount = submissions.filter(item => item.status === 'REJECTED').length;

  if (!isAdmin) {
    return <div className="py-12 text-center text-gray-400">无权限访问</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">用户提交话题</h1>
          <p className="mt-1 text-sm text-gray-500">查看小程序用户提交的口语练习需求，并决定是否采纳。</p>
        </div>
      </div>

      {message && <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-600">{message}</div>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">本页待处理</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{pendingCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">本页已采纳</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{acceptedCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-400">本页未采纳</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{rejectedCount}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[180px_1fr_120px]">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}
          className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100">
          <option value="">全部状态</option>
          <option value="PENDING">待处理</option>
          <option value="ACCEPTED">已采纳</option>
          <option value="REJECTED">未采纳</option>
        </select>
        <input value={keywordDraft} onChange={e => setKeywordDraft(e.target.value)} placeholder="搜索标题、原因、补充说明"
          className="rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              setKeyword(keywordDraft.trim());
              setPage(0);
            }
          }}
        />
        <button onClick={() => { setKeyword(keywordDraft.trim()); setPage(0); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white hover:bg-gray-800">
          <Search size={16} />
          查询
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">话题</th>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">提交时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>}
            {!isLoading && submissions.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">暂无用户提交的话题</td></tr>}
            {submissions.map(item => (
              <tr key={item.id}>
                <td className="max-w-sm px-4 py-4">
                  <p className="truncate font-medium text-gray-900">{item.title}</p>
                </td>
                <td className="px-4 py-4 text-gray-600">{item.username}</td>
                <td className="px-4 py-4 text-gray-600">{item.category || '-'}</td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                </td>
                <td className="px-4 py-4 text-xs text-gray-400">{formatTime(item.createdAt)}</td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => setSelectedId(item.id)} className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                      <Eye size={14} />
                      查看
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: item.id, nextStatus: 'ACCEPTED' })} disabled={updateStatus.isPending}
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
                      <CheckCircle2 size={14} />
                      已采纳
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: item.id, nextStatus: 'REJECTED' })} disabled={updateStatus.isPending}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50">
                      <XCircle size={14} />
                      未采纳
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-40">上一页</button>
        <span className="px-3 py-2 text-sm text-gray-500">{page + 1} / {data?.totalPages || 1}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={!!data && page >= data.totalPages - 1}
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-40">下一页</button>
      </div>

      {selectedId && (
        <DetailDialog
          detail={detail}
          loading={detailLoading}
          updating={updateStatus.isPending}
          onClose={() => setSelectedId(null)}
          onUpdateStatus={(nextStatus) => updateStatus.mutate({ id: selectedId, nextStatus })}
        />
      )}
    </div>
  );
}

function DetailDialog({
  detail,
  loading,
  updating,
  onClose,
  onUpdateStatus,
}: {
  detail?: TopicSubmissionDetail;
  loading: boolean;
  updating: boolean;
  onClose: () => void;
  onUpdateStatus: (status: TopicSubmissionStatus) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            加载中...
          </div>
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{detail.title}</h2>
                <p className="mt-1 text-sm text-gray-500">提交用户：{detail.username}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(detail.status)}`}>{statusLabel(detail.status)}</span>
            </div>

            <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
              <div>分类：{detail.category || '-'}</div>
              <div>提交时间：{formatTime(detail.createdAt)}</div>
              <div>更新时间：{formatTime(detail.updatedAt)}</div>
            </div>

            <section>
              <div className="mb-2 text-xs font-medium text-gray-400">想练原因</div>
              <div className="rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">{detail.reason || '未填写'}</div>
            </section>

            <section>
              <div className="mb-2 text-xs font-medium text-gray-400">补充说明</div>
              <div className="rounded-xl bg-gray-50 p-3 text-sm leading-6 text-gray-700">{detail.extraInfo || '未填写'}</div>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => onUpdateStatus('ACCEPTED')} disabled={updating}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50">
                <CheckCircle2 size={16} />
                标记已采纳
              </button>
              <button onClick={() => onUpdateStatus('REJECTED')} disabled={updating}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                <XCircle size={16} />
                标记未采纳
              </button>
              <button onClick={onClose} className="rounded-xl bg-white px-4 py-2.5 text-sm text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50">关闭</button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">提交记录不存在</div>
        )}
      </div>
    </div>
  );
}
