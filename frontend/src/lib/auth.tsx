'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthUser {
  username: string;
  role: string;
  token: string;
  membershipExpireAt?: string;
  membershipActive?: boolean;
  hasPassword?: boolean;
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

const STORAGE_KEYS = {
  token: 'token',
  username: 'username',
  role: 'role',
  membershipExpireAt: 'membershipExpireAt',
  membershipActive: 'membershipActive',
  hasPassword: 'hasPassword',
} as const;

function loadStoredUser(): AuthUser | null {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  const username = localStorage.getItem(STORAGE_KEYS.username);
  const role = localStorage.getItem(STORAGE_KEYS.role);
  if (!token || !username || !role) return null;
  return {
    token,
    username,
    role,
    membershipExpireAt: localStorage.getItem(STORAGE_KEYS.membershipExpireAt) || '',
    membershipActive: localStorage.getItem(STORAGE_KEYS.membershipActive) === 'true',
    hasPassword: localStorage.getItem(STORAGE_KEYS.hasPassword) === 'true',
  };
}

function persistUser(data: AuthUser) {
  localStorage.setItem(STORAGE_KEYS.token, data.token);
  localStorage.setItem(STORAGE_KEYS.username, data.username);
  localStorage.setItem(STORAGE_KEYS.role, data.role);
  localStorage.setItem(STORAGE_KEYS.membershipExpireAt, data.membershipExpireAt || '');
  localStorage.setItem(STORAGE_KEYS.membershipActive, String(data.membershipActive || false));
  localStorage.setItem(STORAGE_KEYS.hasPassword, String(data.hasPassword || false));
}

function clearStoredUser() {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const storedUser = loadStoredUser();
    if (storedUser) setUser(storedUser);

    const handleAuthExpired = () => {
      clearStoredUser();
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = (data: AuthUser) => {
    persistUser(data);
    setUser(data);
  };

  const logout = () => {
    clearStoredUser();
    setUser(null);
  };

  const refreshMembership = async () => {
    if (!user) return;
    try {
      const { api } = await import('@/lib/api');
      const data = await api.getMembership();
      const updated = { ...user, membershipExpireAt: data.membershipExpireAt, membershipActive: data.membershipActive };
      persistUser(updated);
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
