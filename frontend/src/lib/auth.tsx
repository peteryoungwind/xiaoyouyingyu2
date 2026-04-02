'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  username: string;
  role: string;
  token: string;
  membershipExpireAt?: string;
  membershipActive?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (data: AuthUser) => void;
  logout: () => void;
  refreshMembership: () => void;
  isAdmin: boolean;
  isPremium: boolean;
  membershipExpireAt: string;
  membershipActive: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, login: () => {}, logout: () => {}, refreshMembership: () => {},
  isAdmin: false, isPremium: false, membershipExpireAt: '', membershipActive: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const membershipExpireAt = localStorage.getItem('membershipExpireAt') || '';
    const membershipActive = localStorage.getItem('membershipActive') === 'true';
    if (token && username && role) setUser({ token, username, role, membershipExpireAt, membershipActive });
  }, []);

  const login = (data: AuthUser) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    localStorage.setItem('role', data.role);
    localStorage.setItem('membershipExpireAt', data.membershipExpireAt || '');
    localStorage.setItem('membershipActive', String(data.membershipActive || false));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('membershipExpireAt');
    localStorage.removeItem('membershipActive');
    setUser(null);
  };

  const refreshMembership = async () => {
    if (!user) return;
    try {
      const { api } = await import('@/lib/api');
      const data = await api.getMembership();
      const updated = { ...user, membershipExpireAt: data.membershipExpireAt, membershipActive: data.membershipActive };
      localStorage.setItem('membershipExpireAt', data.membershipExpireAt || '');
      localStorage.setItem('membershipActive', String(data.membershipActive || false));
      setUser(updated);
    } catch {}
  };

  const isAdmin = user?.role === 'ADMIN';
  const membershipActive = user?.membershipActive || false;
  const isPremium = isAdmin || membershipActive;

  return (
    <AuthContext.Provider value={{
      user, login, logout, refreshMembership,
      isAdmin, isPremium,
      membershipExpireAt: user?.membershipExpireAt || '',
      membershipActive,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
