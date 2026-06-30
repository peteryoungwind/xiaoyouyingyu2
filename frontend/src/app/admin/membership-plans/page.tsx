'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, DollarSign, Plus, Save, Tag, ToggleLeft, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const emptyForm = {
  name: '',
  description: '',
  originalPriceYuan: '',
  salePriceYuan: '',
  durationDays: '30',
  permanent: false,
  discountStartAt: '',
  discountEndAt: '',
  status: 'ACTIVE',
  sortOrder: '0',
};

type PlanForm = typeof emptyForm;
type FieldErrors = Partial<Record<keyof PlanForm | 'discountRange', string>>;

function yuanToCents(value: string) {
  return Math.round(Number(value) * 100);
}

function centsToYuan(value?: number) {
  return ((value || 0) / 100).toFixed(2);
}

function isValidYuan(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value.trim());
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label className="text-sm font-medium text-gray-800">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function MembershipPlansPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-membership-plans'],
    queryFn: () => api.getAdminMembershipPlans(),
    enabled: isAdmin,
  });

  const buildPayload = () => {
    const errors: FieldErrors = {};
    const name = form.name.trim();
    const originalPrice = form.originalPriceYuan.trim();
    const salePrice = form.salePriceYuan.trim();
    const durationDays = Number(form.durationDays);
    const sortOrder = Number(form.sortOrder || 0);

    if (!name) errors.name = '请填写套餐名称，例如：周会员、月会员。';
    if (!originalPrice) {
      errors.originalPriceYuan = '请填写原价，单位为元。';
    } else if (!isValidYuan(originalPrice)) {
      errors.originalPriceYuan = '金额最多保留 2 位小数。';
    }
    if (!salePrice) {
      errors.salePriceYuan = '请填写现价，单位为元。';
    } else if (!isValidYuan(salePrice)) {
      errors.salePriceYuan = '金额最多保留 2 位小数。';
    }

    const originalPriceCents = originalPrice && isValidYuan(originalPrice) ? yuanToCents(originalPrice) : 0;
    const salePriceCents = salePrice && isValidYuan(salePrice) ? yuanToCents(salePrice) : 0;
    if (!errors.originalPriceYuan && !errors.salePriceYuan && originalPriceCents < salePriceCents) {
      errors.salePriceYuan = '现价不能高于原价。';
    }
    if (!form.permanent && (!Number.isInteger(durationDays) || durationDays <= 0)) {
      errors.durationDays = '普通时长套餐必须填写大于 0 的整数天数。';
    }
    if (!Number.isFinite(sortOrder)) {
      errors.sortOrder = '排序必须是数字。';
    }
    if (form.discountStartAt && form.discountEndAt && form.discountEndAt <= form.discountStartAt) {
      errors.discountRange = '折扣结束时间必须晚于开始时间。';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMessage('请先检查标红的必填项或格式错误。');
      return null;
    }

    return {
      name,
      description: form.description.trim(),
      originalPriceCents,
      salePriceCents,
      durationDays: form.permanent ? null : durationDays,
      permanent: form.permanent,
      discountStartAt: form.discountStartAt || null,
      discountEndAt: form.discountEndAt || null,
      status: form.status || 'INACTIVE',
      sortOrder,
    };
  };

  const savePlan = useMutation({
    mutationFn: () => {
      const payload = buildPayload();
      if (!payload) return Promise.reject(new Error('表单校验未通过'));
      return editingPlan?.id ? api.updateAdminMembershipPlan(editingPlan.id, payload) : api.createAdminMembershipPlan(payload);
    },
    onSuccess: () => {
      setMessage('保存成功');
      setEditorOpen(false);
      setEditingPlan(null);
      setForm(emptyForm);
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: ['admin-membership-plans'] });
    },
    onError: (err: any) => {
      if (err.message !== '表单校验未通过') setMessage(err.message || '保存失败');
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.updateAdminMembershipPlanStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-membership-plans'] }),
  });

  const openCreate = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setMessage('');
    setFieldErrors({});
    setEditorOpen(true);
  };

  const openEdit = (plan: any) => {
    setEditingPlan(plan);
    setMessage('');
    setFieldErrors({});
    setForm({
      name: plan.name || '',
      description: plan.description || '',
      originalPriceYuan: centsToYuan(plan.originalPriceCents),
      salePriceYuan: centsToYuan(plan.salePriceCents),
      durationDays: String(plan.durationDays || 30),
      permanent: Boolean(plan.permanent),
      discountStartAt: plan.discountStartAt ? plan.discountStartAt.substring(0, 16) : '',
      discountEndAt: plan.discountEndAt ? plan.discountEndAt.substring(0, 16) : '',
      status: plan.status || 'INACTIVE',
      sortOrder: String(plan.sortOrder || 0),
    });
    setEditorOpen(true);
  };

  if (!isAdmin) return <div className="py-12 text-center text-gray-400">无权限访问</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">会员套餐</h1>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-2.5 text-sm text-white hover:bg-blue-600">
          <Plus size={16} />
          新增套餐
        </button>
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

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" onClick={() => setEditorOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{editingPlan?.id ? '编辑会员套餐' : '新增会员套餐'}</h2>
                <p className="mt-1 text-sm text-gray-500">带红色星号的是必填项，金额请填写元，系统保存时会自动换算成分。</p>
              </div>
              <button
                type="button"
                title="关闭"
                onClick={() => setEditorOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-5">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Tag size={16} className="text-blue-500" />
                  基础信息
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel required>套餐名称</FieldLabel>
                    <input
                      className={`mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${fieldErrors.name ? 'ring-1 ring-red-200' : ''}`}
                      placeholder="例如：周会员"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">展示在小程序套餐列表和订单快照中。</p>
                    <FieldError message={fieldErrors.name} />
                  </div>
                  <div>
                    <FieldLabel>排序</FieldLabel>
                    <input
                      className={`mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${fieldErrors.sortOrder ? 'ring-1 ring-red-200' : ''}`}
                      type="number"
                      placeholder="0"
                      value={form.sortOrder}
                      onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">数字越小越靠前，可不改，默认 0。</p>
                    <FieldError message={fieldErrors.sortOrder} />
                  </div>
                </div>
                <div>
                  <FieldLabel>套餐描述</FieldLabel>
                  <textarea
                    className="mt-1 min-h-24 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="例如：7 天高级学习功能，适合短期体验。"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-gray-400">可选，用来解释套餐权益或适用场景。</p>
                </div>
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <DollarSign size={16} className="text-emerald-500" />
                  价格与时长
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel required>原价（元）</FieldLabel>
                    <input
                      className={`mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${fieldErrors.originalPriceYuan ? 'ring-1 ring-red-200' : ''}`}
                      inputMode="decimal"
                      placeholder="例如：19.90"
                      value={form.originalPriceYuan}
                      onChange={e => setForm({ ...form, originalPriceYuan: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">用于展示划线价，不能低于现价。</p>
                    <FieldError message={fieldErrors.originalPriceYuan} />
                  </div>
                  <div>
                    <FieldLabel required>现价（元）</FieldLabel>
                    <input
                      className={`mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${fieldErrors.salePriceYuan ? 'ring-1 ring-red-200' : ''}`}
                      inputMode="decimal"
                      placeholder="例如：9.90"
                      value={form.salePriceYuan}
                      onChange={e => setForm({ ...form, salePriceYuan: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">用户实际支付金额，保存后按整数分计算。</p>
                    <FieldError message={fieldErrors.salePriceYuan} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel required>套餐类型</FieldLabel>
                    <div className="mt-1 grid grid-cols-2 overflow-hidden rounded-xl bg-gray-100 p-1 text-sm">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, permanent: false })}
                        className={`rounded-lg px-3 py-2 ${!form.permanent ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                      >
                        普通时长
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, permanent: true })}
                        className={`rounded-lg px-3 py-2 ${form.permanent ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                      >
                        永久会员
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">普通套餐按天数顺延；永久套餐不需要填写天数。</p>
                  </div>
                  <div>
                    <FieldLabel required={!form.permanent}>会员天数</FieldLabel>
                    <input
                      className={`mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 disabled:text-gray-400 ${fieldErrors.durationDays ? 'ring-1 ring-red-200' : ''}`}
                      type="number"
                      min={1}
                      disabled={form.permanent}
                      placeholder="例如：7"
                      value={form.permanent ? '' : form.durationDays}
                      onChange={e => setForm({ ...form, durationDays: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">{form.permanent ? '永久会员套餐会忽略会员天数。' : '普通时长套餐必填，大于 0 的整数。'}</p>
                    <FieldError message={fieldErrors.durationDays} />
                  </div>
                </div>
              </section>

              <section className="space-y-4 border-t border-gray-100 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <CalendarClock size={16} className="text-violet-500" />
                  折扣与上架
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel>折扣开始时间</FieldLabel>
                    <input
                      className="mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                      type="datetime-local"
                      value={form.discountStartAt}
                      onChange={e => setForm({ ...form, discountStartAt: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">可选。留空表示不限制开始时间。</p>
                  </div>
                  <div>
                    <FieldLabel>折扣结束时间</FieldLabel>
                    <input
                      className={`mt-1 w-full rounded-xl bg-gray-50 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 ${fieldErrors.discountRange ? 'ring-1 ring-red-200' : ''}`}
                      type="datetime-local"
                      value={form.discountEndAt}
                      onChange={e => setForm({ ...form, discountEndAt: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-gray-400">可选。若填写一段折扣期，结束时间要晚于开始时间。</p>
                    <FieldError message={fieldErrors.discountRange} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel required>套餐状态</FieldLabel>
                    <div className="mt-1 grid grid-cols-2 overflow-hidden rounded-xl bg-gray-100 p-1 text-sm">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, status: 'ACTIVE' })}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${form.status === 'ACTIVE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                      >
                        <CheckCircle2 size={15} />
                        上架
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, status: 'INACTIVE' })}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 ${form.status === 'INACTIVE' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500'}`}
                      >
                        <ToggleLeft size={15} />
                        下架
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">只有上架套餐会展示给小程序用户购买。</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    <div className="flex items-center gap-2 font-medium">
                      <Clock3 size={15} />
                      保存后如何生效
                    </div>
                    <p className="mt-1 text-xs leading-5 text-blue-600">套餐编辑会影响后续购买展示，不会修改已经创建的历史订单快照。</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white px-6 py-4">
              {message ? (
                <p className={`flex items-center gap-2 text-sm ${message.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
                  <AlertCircle size={16} />
                  {message}
                </p>
              ) : <span />}
              <div className="flex gap-2">
                <button onClick={() => savePlan.mutate()} disabled={savePlan.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50">
                  <Save size={16} />
                  {savePlan.isPending ? '保存中...' : '保存'}
                </button>
                <button onClick={() => setEditorOpen(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-200">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
