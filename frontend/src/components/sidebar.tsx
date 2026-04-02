'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LayoutDashboard, BookOpen, CalendarDays, Users, Settings, ShieldCheck, GraduationCap, Ticket } from 'lucide-react';

const navItems = [
  { href: '/', label: '主页', icon: LayoutDashboard },
  { href: '/topics', label: '主题', icon: BookOpen },
  { href: '/calendar', label: '日历', icon: CalendarDays },
  { href: '/learning-center', label: '学习中心', icon: GraduationCap },
  { href: '/admin', label: '管理后台', icon: ShieldCheck, adminOnly: true },
  { href: '/users', label: '用户管理', icon: Users, adminOnly: true },
  { href: '/redeem-codes', label: '卡密管理', icon: Ticket, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isPremium } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-white border-r border-gray-100 flex flex-col z-40">
      <div className="h-16 flex items-center px-5 gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">XY</span>
        </div>
        <span className="font-semibold text-gray-900">小柚英语</span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(item => {
          if (item.adminOnly && !isAdmin) return null;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
                ${active ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <Link href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors
            ${pathname.startsWith('/settings') ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Settings size={18} />
          设置
        </Link>
      </div>
    </aside>
  );
}
