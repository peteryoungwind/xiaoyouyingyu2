'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const emptyForm = {
  name: '',
  description: '',
  originalPriceYuan: '0',
  salePriceYuan: '0',
  durationDays: 30,
  permanent: false,
  discountStartAt: '',
  discountEndAt: '',
  status: 'INACTIVE',
  sortOrder: 0,
};

function yuanToCents(value: string) {
  return Math.round(Number(value || 0) * 100);
}

function centsToYuan(value?: number) {
  return ((value || 0) / 100).toFixed(2);
}

export default function MembershipPlansPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-membership-plans'],
    queryFn: () => api.getAdminMembershipPlans(),
    enabled: isAdmin,
  });

  const savePlan = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        description: form.description,
        originalPriceCents: yuanToCents(form.originalPriceYuan),
        salePriceCents: yuanToCents(form.salePriceYuan),
        durationDays: form.permanent ? null : form.durationDays,
        permanent: form.permanent,
        discountStartAt: form.discountStartAt || null,
        discountEndAt: form.discountEndAt || null,
        status: form.status,
        sortOrder: form.sortOrder,
      };
      return editing ? api.updateAdminMembershipPlan(editing.id, payload) : api.createAdminMembershipPlan(payload);
    },
    onSuccess: () => {
      setMessage('保存成功');
      setEditing(null);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['admin-membership-plans'] });
    },
    onError: (err: any) => setMessage(err.message || '保存失败'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateAdminMembershipPlanStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-membership-plans'] }),
  });

  const openEdit = (plan: any) => {
    setEditing(plan);
    setMessage('');
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      originalPriceYuan: centsToYuan(plan.originalPriceCents),
      salePriceYuan: centsToYuan(plan.salePriceCents),
      durationDays: plan.durationDays || 30,
      permanent: Boolean(plan.permanent),
      discountStartAt: plan.discountStartAt ? plan.discountStartAt.substring(0, 16) : '',
      discountEndAt: plan.discountEndAt ? plan.discountEndAt.substring(0, 16) : '',
      status: plan.status || 'INACTIVE',
      sortOrder: plan.sortOrder || 0,
    });
  };

  if (!isAdmin) return <div className="py-12 text-center text-gray-400">无权限访问</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">会员套餐</h1>
        <button onClick={() => { setEditing({}); setForm(emptyForm); setMessage(''); }}
          className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm text-white hover:bg-blue-600">新增套餐</button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">套餐</th>
              <th className="px-4 py-3 font-medium">价格</th>
              <th className="px-4 py-3 font-medium">时长</th>
              <th className="px-4 py-3 font-medium">折扣</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td className="px-4 py-6 text-gray-400" colSpan={7}>加载中...</td></tr>}
            {(plans || []).map((plan: any) => (
              <tr key={plan.id}>
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">{plan.name}</div>
                  <div className="mt-1 max-w-xs truncate text-xs text-gray-400">{plan.description || '-'}</div>
                </td>
                <td className="px-4 py-4 text-gray-700">
                  <span className="font-medium">¥{centsToYuan(plan.salePriceCents)}</span>
                  <span className="ml-2 text-xs text-gray-400 line-through">¥{centsToYuan(plan.originalPriceCents)}</span>
                </td>
                <td className="px-4 py-4 text-gray-600">{plan.permanent ? '永久会员' : `${plan.durationDays} 天`}</td>
                <td className="px-4 py-4 text-xs text-gray-500">
                  {plan.discountStartAt && plan.discountEndAt ? `${plan.discountStartAt.substring(0, 10)} ~ ${plan.discountEndAt.substring(0, 10)}` : '-'}
                </td>
                <td className="px-4 py-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${plan.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.status === 'ACTIVE' ? '上架' : '下架'}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-500">{plan.sortOrder}</td>
                <td className="px-4 py-4">
                  <div className="flex gap-3 text-xs">
                    <button onClick={() => openEdit(plan)} className="text-blue-500 hover:text-blue-700">编辑</button>
                    <button onClick={() => updateStatus.mutate({ id: plan.id, status: plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                      className="text-gray-500 hover:text-gray-700">{plan.status === 'ACTIVE' ? '下架' : '上架'}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setEditing(null)}>
          <div className="max-h-[86vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900">{editing.id ? '编辑套餐' : '新增套餐'}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="套餐名称"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="排序"
                type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="原价（元）"
                value={form.originalPriceYuan} onChange={e => setForm({ ...form, originalPriceYuan: e.target.value })} />
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="现价（元）"
                value={form.salePriceYuan} onChange={e => setForm({ ...form, salePriceYuan: e.target.value })} />
              <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <input type="checkbox" checked={form.permanent} onChange={e => setForm({ ...form, permanent: e.target.checked })} />
                永久会员
              </label>
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="会员天数"
                type="number" min={1} disabled={form.permanent} value={form.durationDays} onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })} />
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" type="datetime-local"
                value={form.discountStartAt} onChange={e => setForm({ ...form, discountStartAt: e.target.value })} />
              <input className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" type="datetime-local"
                value={form.discountEndAt} onChange={e => setForm({ ...form, discountEndAt: e.target.value })} />
              <select className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="INACTIVE">下架</option>
                <option value="ACTIVE">上架</option>
              </select>
            </div>
            <textarea className="min-h-20 w-full rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" placeholder="套餐描述"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            {message && <p className={`text-sm ${message.includes('失败') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}
            <div className="flex gap-2">
              <button onClick={() => savePlan.mutate()} disabled={savePlan.isPending}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50">
                {savePlan.isPending ? '保存中...' : '保存'}
              </button>
              <button onClick={() => setEditing(null)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
