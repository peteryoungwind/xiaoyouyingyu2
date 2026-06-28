'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

function centsToYuan(value?: number) {
  return ((value || 0) / 100).toFixed(2);
}

function statusLabel(status: string) {
  return ({ PENDING: '待支付', PAID: '已支付', CLOSED: '已关闭', FAILED: '失败', REFUNDED: '已退款' } as any)[status] || status;
}

export default function MembershipOrdersPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [userId, setUserId] = useState('');
  const [detail, setDetail] = useState<any>(null);

  const params: Record<string, string> = { page: String(page), size: '20' };
  if (status) params.status = status;
  if (orderNo) params.orderNo = orderNo;
  if (userId) params.userId = userId;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-membership-orders', params],
    queryFn: () => api.getAdminMembershipOrders(params),
    enabled: isAdmin,
  });

  const orders = data?.content || [];

  if (!isAdmin) return <div className="py-12 text-center text-gray-400">无权限访问</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">会员订单</h1>

      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }}
          className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100">
          <option value="">全部状态</option>
          <option value="PENDING">待支付</option>
          <option value="PAID">已支付</option>
          <option value="CLOSED">已关闭</option>
          <option value="FAILED">失败</option>
        </select>
        <input value={orderNo} onChange={e => setOrderNo(e.target.value)} placeholder="订单号"
          className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
        <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="用户ID"
          className="rounded-xl bg-gray-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
        <button onClick={() => setPage(0)} className="rounded-xl bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800">查询</button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">订单号</th>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="px-4 py-3 font-medium">金额</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">微信交易号</th>
              <th className="px-4 py-3 font-medium">创建时间</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading && <tr><td colSpan={7} className="px-4 py-6 text-gray-400">加载中...</td></tr>}
            {orders.map((order: any) => (
              <tr key={order.id}>
                <td className="px-4 py-4 font-mono text-xs text-gray-700">{order.orderNo}</td>
                <td className="px-4 py-4 text-gray-700">{order.username || order.userId}</td>
                <td className="px-4 py-4 text-gray-700">¥{centsToYuan(order.amountCents)}</td>
                <td className="px-4 py-4 text-gray-600">{statusLabel(order.status)}</td>
                <td className="px-4 py-4 text-xs text-gray-500">{order.wechatTransactionId || '-'}</td>
                <td className="px-4 py-4 text-xs text-gray-400">{order.createdAt?.replace('T', ' ').substring(0, 19)}</td>
                <td className="px-4 py-4">
                  <button onClick={() => setDetail(order)} className="text-xs text-blue-500 hover:text-blue-700">详情</button>
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
        <button onClick={() => setPage(p => p + 1)} disabled={data && page >= data.totalPages - 1}
          className="rounded-xl bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-40">下一页</button>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setDetail(null)}>
          <div className="max-h-[86vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold text-gray-900">订单详情</h2>
            <div className="grid gap-2 text-sm text-gray-600 md:grid-cols-2">
              <div>订单号：{detail.orderNo}</div>
              <div>状态：{statusLabel(detail.status)}</div>
              <div>金额：¥{centsToYuan(detail.amountCents)}</div>
              <div>用户：{detail.username || detail.userId}</div>
              <div>支付时间：{detail.paidAt ? detail.paidAt.replace('T', ' ').substring(0, 19) : '-'}</div>
              <div>开通时间：{detail.membershipGrantedAt ? detail.membershipGrantedAt.replace('T', ' ').substring(0, 19) : '-'}</div>
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-400">套餐快照</div>
              <pre className="max-h-60 overflow-auto rounded-xl bg-gray-50 p-3 text-xs text-gray-600">{detail.planSnapshotJson}</pre>
            </div>
            {detail.failureReason && <p className="text-sm text-red-500">{detail.failureReason}</p>}
            <button onClick={() => setDetail(null)} className="w-full rounded-xl bg-gray-100 py-2.5 text-sm text-gray-600 hover:bg-gray-200">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
