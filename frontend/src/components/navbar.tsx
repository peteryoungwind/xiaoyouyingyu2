'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthModal } from './auth-modal';
import Link from 'next/link';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-gray-900 press-effect">
            小柚英语
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 press-effect">
                管理后台
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{user.username}</span>
                <button onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-900 press-effect">
                  退出
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)}
                className="text-sm bg-gray-900 text-white px-4 py-1.5 rounded-full press-effect hover:bg-gray-800">
                登录
              </button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
