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
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-end px-6">
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-600">
            <Bell size={20} />
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              {!isAdmin && (
                <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  isPremium ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {isPremium && <Crown size={12} />}
                  {getMembershipLabel()}
                </span>
              )}
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-700">{user.username}</span>
              <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">退出</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="text-sm bg-blue-500 text-white px-4 py-1.5 rounded-xl hover:bg-blue-600">
              登录
            </button>
          )}
        </div>
      </header>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
