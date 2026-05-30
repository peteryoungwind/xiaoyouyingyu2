'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Copy, Ban } from 'lucide-react';

export default function RedeemCodesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [form, setForm] = useState({ name: '', count: 10, days: 30, expireAt: '', remark: '' });
  const [genMsg, setGenMsg] = useState('');

  const { data } = useQuery({
    queryKey: ['redeem-codes', page, statusFilter],
    queryFn: () => {
      const params: Record<string, string> = { page: String(page), size: '20' };
      if (statusFilter) params.status = statusFilter;
      return api.getRedeemCodes(params);
    },
    enabled: isAdmin,
  });

  const generateMut = useMutation({
    mutationFn: () => api.generateRedeemCodes({
      name: form.name,
      count: form.count,
      days: form.days,
      expireAt: form.expireAt || undefined,
      remark: form.remark || undefined,
    }),
    onSuccess: (data) => {
      setGenMsg(`成功生成 ${data.length} 个卡密`);
      queryClient.invalidateQueries({ queryKey: ['redeem-codes'] });
    },
  });

  const disableMut = useMutation({
    mutationFn: (id: number) => api.disableRedeemCode(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['redeem-codes'] }),
  });

  if (!isAdmin) return <div className="text-center py-12 text-gray-400">无权限访问</div>;

  const codes = data?.content || [];
  const totalPages = data?.totalPages || 0;

  const statusLabel: Record<string, string> = { ACTIVE: '可用', USED: '已使用', DISABLED: '已禁用', EXPIRED: '已过期' };
  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-600',
    USED: 'bg-gray-100 text-gray-500',
    DISABLED: 'bg-red-50 text-red-500',
    EXPIRED: 'bg-amber-50 text-amber-600',
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">卡密管理</h1>
        <button onClick={() => { setShowGenerate(!showGenerate); setGenMsg(''); }}
          className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600">
          {showGenerate ? '收起' : '生成卡密'}
        </button>
      </div>

      {/* Generate Form */}
      {showGenerate && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="font-medium text-gray-900">批量生成卡密</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">卡密名称</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="如：4月活动30天卡"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">数量</label>
              <input type="number" value={form.count} onChange={e => setForm({ ...form, count: Number(e.target.value) })}
                min={1} max={100}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">会员天数</label>
              <input type="number" value={form.days} onChange={e => setForm({ ...form, days: Number(e.target.value) })}
                min={1}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">截止兑换时间（可选）</label>
              <input type="datetime-local" value={form.expireAt} onChange={e => setForm({ ...form, expireAt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">备注（可选）</label>
            <input type="text" value={form.remark} onChange={e => setForm({ ...form, remark: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
          {genMsg && <p className="text-sm text-green-600">{genMsg}</p>}
          <button onClick={() => generateMut.mutate()} disabled={!form.name || generateMut.isPending}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 disabled:opacity-40">
            {generateMut.isPending ? '生成中...' : '确认生成'}
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'ACTIVE', 'USED', 'DISABLED'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}>
            {s ? statusLabel[s] : '全部'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">卡密码</th>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">天数</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">使用人ID</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {codes.map((c: any) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-700">
                  {c.code}
                  <button onClick={() => copyCode(c.code)} className="ml-1 text-gray-400 hover:text-gray-600">
                    <Copy size={12} />
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-700">{c.name}</td>
                <td className="px-4 py-3 text-gray-700">{c.days}天</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[c.status] || 'bg-gray-100 text-gray-500'}`}>
                    {statusLabel[c.status] || c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.usedBy || '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{c.createdAt?.replace('T', ' ').substring(0, 19)}</td>
                <td className="px-4 py-3">
                  {c.status === 'ACTIVE' && (
                    <button onClick={() => disableMut.mutate(c.id)}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                      <Ban size={12} /> 禁用
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-4 py-2 text-sm rounded-xl bg-white shadow-sm disabled:opacity-30">上一页</button>
          <span className="text-sm text-gray-500">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-4 py-2 text-sm rounded-xl bg-white shadow-sm disabled:opacity-30">下一页</button>
        </div>
      )}
    </div>
  );
}
