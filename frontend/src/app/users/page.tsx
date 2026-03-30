'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.getUsers(),
    enabled: isAdmin,
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) => api.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  if (!isAdmin) return <div className="text-center py-12 text-gray-400">无权限访问</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-6 py-3 font-medium">用户名</th>
              <th className="px-6 py-3 font-medium">角色</th>
              <th className="px-6 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(users || []).map((u: any) => (
              <tr key={u.id}>
                <td className="px-6 py-4 text-gray-900">{u.username}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.role !== 'ADMIN' && (
                    <button onClick={() => deleteUser.mutate(u.id)}
                      className="text-xs text-red-500 hover:text-red-700">删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
