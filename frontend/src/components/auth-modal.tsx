'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login({ username, password })
        : await api.register({ username, password });
      login(data);
      onClose();
      setUsername('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="glass rounded-apple-lg p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95"
           onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-center mb-5">
          {isLogin ? '登录' : '注册'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="username" placeholder="用户名" value={username} autoComplete="new-password"
            onChange={e => setUsername(e.target.value)}
            className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-300 text-sm" />
          <input type="password" name="password" placeholder="密码" value={password} autoComplete="new-password"
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-300 text-sm" />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-gray-900 text-white rounded-apple text-sm font-medium press-effect hover:bg-gray-800 disabled:opacity-50">
            {loading ? '处理中...' : isLogin ? '登录' : '注册'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-4">
          {isLogin ? '没有账号？' : '已有账号？'}
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-gray-600 ml-1 hover:underline">
            {isLogin ? '注册' : '登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
