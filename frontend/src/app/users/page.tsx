'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, isAuthExpiredError } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [membershipModal, setMembershipModal] = useState<any>(null);
  const [addDays, setAddDays] = useState(30);
  const [expireAt, setExpireAt] = useState('');
  const [remark, setRemark] = useState('');
  const [membershipMsg, setMembershipMsg] = useState('');

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.getUsers(),
    enabled: isAdmin,
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleAddDays = async () => {
    if (!membershipModal) return;
    try {
      await api.grantUserMembership(membershipModal.id, { operation: 'EXTEND_DAYS', days: addDays, reason: remark });
      setMembershipMsg(`成功追加 ${addDays} 天`);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: any) {
      if (isAuthExpiredError(err)) return;
      setMembershipMsg(err.message || '操作失败');
    }
  };

  const handleSetExpire = async () => {
    if (!membershipModal || !expireAt) return;
    try {
      await api.grantUserMembership(membershipModal.id, { operation: 'SET_EXPIRE_AT', expireAt, reason: remark });
      setMembershipMsg('到期时间已更新');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: any) {
      if (isAuthExpiredError(err)) return;
      setMembershipMsg(err.message || '操作失败');
    }
  };

  const handleSetPermanent = async () => {
    if (!membershipModal) return;
    try {
      await api.grantUserMembership(membershipModal.id, { operation: 'PERMANENT', permanent: true, reason: remark });
      setMembershipMsg('已设置为永久会员');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err: any) {
      if (isAuthExpiredError(err)) return;
      setMembershipMsg(err.message || '操作失败');
    }
  };

  const openMembershipModal = (user: any) => {
    setMembershipModal(user);
    setAddDays(30);
    setExpireAt(user.membershipExpireAt ? user.membershipExpireAt.substring(0, 16) : '');
    setRemark('');
    setMembershipMsg('');
  };

  if (!isAdmin) return <div className="text-center py-12 text-gray-400">无权限访问</div>;

  const getMembershipStatus = (u: any) => {
    if (u.role === 'ADMIN') return { label: '管理员', color: 'text-blue-600' };
    if (u.membershipPermanent) return { label: '永久会员', color: 'text-purple-600' };
    if (u.membershipExpireAt && new Date(u.membershipExpireAt) > new Date()) return { label: '会员中', color: 'text-amber-600' };
    if (u.membershipExpireAt) return { label: '已过期', color: 'text-gray-400' };
    return { label: '未开通', color: 'text-gray-400' };
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
      <div className="space-y-4">
        <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">用户名</th>
                <th className="px-4 py-3 font-medium">角色</th>
                <th className="px-4 py-3 font-medium">会员状态</th>
                <th className="px-4 py-3 font-medium">到期时间</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(users || []).map((u: any) => {
                const ms = getMembershipStatus(u);
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-4 text-gray-900">{u.username}</td>
                    <td className="px-4 py-4">
                      <select value={u.role}
                        onChange={e => updateRole.mutate({ id: u.id, role: e.target.value })}
                        disabled={u.role === 'ADMIN' && (users || []).filter((x: any) => x.role === 'ADMIN').length <= 1}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-100">
                        <option value="USER">普通用户</option>
                        <option value="PREMIUM_USER">高级用户</option>
                        <option value="ADMIN">管理员</option>
                      </select>
                    </td>
                    <td className={`px-4 py-4 text-xs font-medium ${ms.color}`}>{ms.label}</td>
                    <td className="px-4 py-4 text-xs text-gray-500">
                      {u.membershipPermanent ? '永久' : (u.membershipExpireAt ? u.membershipExpireAt.replace('T', ' ').substring(0, 19) : '-')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {u.role !== 'ADMIN' && (
                          <>
                            <button onClick={() => openMembershipModal(u)}
                              className="text-xs text-blue-500 hover:text-blue-700">会员设置</button>
                            <button onClick={() => deleteUser.mutate(u.id)}
                              className="text-xs text-red-500 hover:text-red-700">删除</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 md:hidden">
          {(users || []).map((u: any) => {
            const ms = getMembershipStatus(u);
            return (
              <div key={u.id} className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{u.username}</p>
                    <p className={`mt-1 text-xs font-medium ${ms.color}`}>{ms.label}</p>
                  </div>
                  <select value={u.role}
                    onChange={e => updateRole.mutate({ id: u.id, role: e.target.value })}
                    disabled={u.role === 'ADMIN' && (users || []).filter((x: any) => x.role === 'ADMIN').length <= 1}
                    className="w-full text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-blue-100 sm:w-auto">
                    <option value="USER">普通用户</option>
                    <option value="PREMIUM_USER">高级用户</option>
                    <option value="ADMIN">管理员</option>
                  </select>
                </div>
                <div className="break-all text-xs text-gray-500">
                  到期时间：{u.membershipPermanent ? '永久' : (u.membershipExpireAt ? u.membershipExpireAt.replace('T', ' ').substring(0, 19) : '-')}
                </div>
                {u.role !== 'ADMIN' && (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openMembershipModal(u)}
                      className="text-xs text-blue-500 hover:text-blue-700">会员设置</button>
                    <button onClick={() => deleteUser.mutate(u.id)}
                      className="text-xs text-red-500 hover:text-red-700">删除</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Membership Modal */}
      {membershipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setMembershipModal(null)}>
          <div className="max-h-[80vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="break-all font-semibold text-gray-900">会员设置 - {membershipModal.username}</h3>
            <div className="break-all text-sm text-gray-500">
              当前到期时间：{membershipModal.membershipPermanent ? '永久' : (membershipModal.membershipExpireAt ? membershipModal.membershipExpireAt.replace('T', ' ').substring(0, 19) : '未设置')}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">追加天数</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="number" value={addDays} onChange={e => setAddDays(Number(e.target.value))} min={1}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <button onClick={handleAddDays}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm hover:bg-blue-600">追加</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">直接设置到期时间</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input type="datetime-local" value={expireAt} onChange={e => setExpireAt(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
                  <button onClick={handleSetExpire}
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800">设置</button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">备注</label>
                <input type="text" value={remark} onChange={e => setRemark(e.target.value)} placeholder="操作原因"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-blue-100" />
              </div>

              <button onClick={handleSetPermanent}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700">设置为永久会员</button>
            </div>

            {membershipMsg && <p className="text-sm text-green-600">{membershipMsg}</p>}

            <button onClick={() => setMembershipModal(null)}
              className="w-full py-2.5 text-sm rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
