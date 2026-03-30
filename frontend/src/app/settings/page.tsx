'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const { user } = useAuth();
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [msg, setMsg] = useState('');

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword({ oldPassword: oldPwd, newPassword: newPwd });
      setMsg('密码修改成功');
      setOldPwd('');
      setNewPwd('');
    } catch (err: any) {
      setMsg(err.message || '修改失败');
    }
  };

  if (!user) return <div className="text-center py-12 text-gray-400">请先登录</div>;

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900">设置</h1>
      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-medium text-gray-900">修改密码</h2>
        <form onSubmit={handleChangePwd} className="space-y-3">
          <input type="password" placeholder="当前密码" value={oldPwd}
            onChange={e => setOldPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-0 outline-none text-sm focus:ring-2 focus:ring-blue-100" />
          <input type="password" placeholder="新密码" value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border-0 outline-none text-sm focus:ring-2 focus:ring-blue-100" />
          {msg && <p className="text-sm text-gray-500">{msg}</p>}
          <button type="submit"
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800">保存</button>
        </form>
      </div>
    </div>
  );
}
