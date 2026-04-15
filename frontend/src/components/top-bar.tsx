'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthModal } from './auth-modal';
import { Bell, Crown } from 'lucide-react';

export function TopBar() {
  const { user, logout, isAdmin, isPremium, membershipExpireAt } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const getMembershipLabel = () => {
    if (isAdmin) return '管理员';
    if (isPremium) return '会员中';
    return '普通用户';
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">XY</div>
          <span className="truncate text-sm font-semibold text-gray-900">小柚英语</span>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 md:gap-4">
          <button className="text-gray-400 hover:text-gray-600">
            <Bell size={20} />
          </button>
          {user ? (
            <div className="flex min-w-0 items-center gap-1.5 md:gap-3">
              {!isAdmin && (
                <span className={`hidden rounded-full px-2.5 py-1 text-xs md:flex md:items-center md:gap-1 ${
                  isPremium ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isPremium && <Crown size={12} />}
                  {getMembershipLabel()}
                </span>
              )}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="max-w-14 truncate text-sm text-gray-700 sm:max-w-24 md:max-w-none">{user.username}</span>
              <button onClick={logout} className="shrink-0 text-xs text-gray-400 hover:text-gray-600">退出</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="rounded-xl bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 md:px-4">
              登录
            </button>
          )}
        </div>
      </header>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
