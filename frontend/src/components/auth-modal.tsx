'use client';
import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useToast } from '@/components/toast-provider';

type LoginMode = 'password' | 'wechat';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<LoginMode>('password');
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [wechatSession, setWechatSession] = useState<{
    ticketId: string;
    pollToken: string;
    expiresAt: string;
    qrContent: string;
  } | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const { login } = useAuth();
  const { showToast } = useToast();

  const clearPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollInFlightRef.current = false;
  };

  const resetWechatState = () => {
    clearPolling();
    setWechatSession(null);
    setWechatLoading(false);
  };

  const resetAllState = () => {
    resetFormState();
    resetWechatState();
    setMode('password');
    setIsLogin(true);
  };

  const stopWechatLoginSession = async () => {
    clearPolling();
    if (!wechatSession) return;
    const ticketId = wechatSession.ticketId;
    setWechatSession(null);
    try {
      await api.cancelWechatPcLoginSession(ticketId);
    } catch {}
  };

  const resetFormState = () => {
    setUsername('');
    setPassword('');
    setLoading(false);
  };

  const startWechatLogin = async () => {
    setWechatLoading(true);
    await stopWechatLoginSession();
    try {
      const session = await api.createWechatPcLoginSession();
      setWechatSession(session);
    } catch (err: any) {
      const message = err.message || '获取微信登录二维码失败';
      showToast(message, 'error');
    } finally {
      setWechatLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      clearPolling();
      return;
    }
    return () => clearPolling();
  }, [open]);

  useEffect(() => {
    if (open && mode === 'wechat' && !wechatSession && !wechatLoading) {
      void startWechatLogin();
    }
  }, [open, mode, wechatSession, wechatLoading]);

  useEffect(() => {
    if (!open || mode !== 'wechat' || !wechatSession) {
      clearPolling();
      return;
    }

    const poll = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        const data = await api.pollWechatPcLoginSession(wechatSession.ticketId, wechatSession.pollToken);
        if (data.status === 'CONFIRMED' && data.token && data.username && data.role) {
          clearPolling();
          login({
            token: data.token,
            username: data.username,
            role: data.role,
            membershipExpireAt: data.membershipExpireAt,
            membershipActive: data.membershipActive,
            hasPassword: data.hasPassword,
          });
          resetAllState();
          onClose();
          showToast('登录成功');
        }
      } catch (err: any) {
        clearPolling();
        const message = err.message || '微信登录失败';
        showToast(message, 'error');
      } finally {
        pollInFlightRef.current = false;
      }
    };

    poll();
    pollTimerRef.current = setInterval(poll, 2500);
    return () => clearPolling();
  }, [open, mode, wechatSession, login, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const actionText = isLogin ? '登录' : '注册';
      const data = isLogin
        ? await api.login({ username, password })
        : await api.register({ username, password });
      login(data);
      resetAllState();
      onClose();
      showToast(`${actionText}成功`);
    } catch (err: any) {
      const message = err.message || '服务异常，请稍后重试';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = async (nextMode: LoginMode) => {
    if (nextMode === 'password') {
      await stopWechatLoginSession();
      resetWechatState();
    } else {
      resetFormState();
    }
    setMode(nextMode);
  };

  const handleClose = async () => {
    await stopWechatLoginSession();
    resetAllState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { void handleClose(); }}>
      <div className="glass rounded-apple-lg p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95"
           onClick={e => e.stopPropagation()}>
        <div className="mb-5 grid grid-cols-2 rounded-apple bg-gray-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => { void switchMode('password'); }}
            className={`rounded-apple py-2 transition ${mode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            账号登录
          </button>
          <button
            type="button"
            onClick={() => { void switchMode('wechat'); }}
            className={`rounded-apple py-2 transition ${mode === 'wechat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            微信扫码
          </button>
        </div>

        {mode === 'password' ? (
          <>
            <h2 className="text-xl font-semibold text-center mb-5">
              {isLogin ? '登录' : '注册'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="username" placeholder="用户名" value={username} autoComplete="username"
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-300 text-sm" />
              <input type="password" name="password" placeholder="密码" value={password} autoComplete={isLogin ? 'current-password' : 'new-password'}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-apple bg-gray-100 border-0 outline-none focus:ring-2 focus:ring-gray-300 text-sm" />
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gray-900 text-white rounded-apple text-sm font-medium press-effect hover:bg-gray-800 disabled:opacity-50">
                {loading ? '处理中...' : isLogin ? '登录' : '注册'}
              </button>
            </form>
            <p className="text-center text-xs text-gray-400 mt-4">
              {isLogin ? '没有账号？' : '已有账号？'}
              <button onClick={() => { setIsLogin(!isLogin); }}
                className="text-gray-600 ml-1 hover:underline">
                {isLogin ? '注册' : '登录'}
              </button>
            </p>
          </>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-semibold">微信扫码登录</h2>
            <p className="text-sm text-gray-500">使用已登录的小程序扫码，并在手机上确认登录。</p>
            <div className="mx-auto flex min-h-[236px] items-center justify-center rounded-apple bg-white p-4 shadow-sm">
              {wechatSession ? (
                <QRCodeSVG value={wechatSession.qrContent} size={200} includeMargin />
              ) : (
                <p className="text-sm text-gray-400">{wechatLoading ? '二维码生成中...' : '点击下方按钮获取二维码'}</p>
              )}
            </div>
            {wechatSession && (
              <p className="text-xs text-gray-400 break-all">二维码有效期至：{new Date(wechatSession.expiresAt).toLocaleString()}</p>
            )}
            <button
              type="button"
              onClick={startWechatLogin}
              disabled={wechatLoading}
              className="w-full py-2.5 bg-gray-900 text-white rounded-apple text-sm font-medium press-effect hover:bg-gray-800 disabled:opacity-50"
            >
              {wechatLoading ? '刷新中...' : wechatSession ? '刷新二维码' : '获取二维码'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
