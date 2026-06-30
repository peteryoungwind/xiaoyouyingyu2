'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { LayoutDashboard, BookOpen, CalendarDays, Users, Settings, ShieldCheck, GraduationCap, Ticket, Library, BookOpenText, CreditCard, ReceiptText, Inbox } from 'lucide-react';

const navItems = [
  { href: '/', label: '主页', icon: LayoutDashboard },
  { href: '/topics', label: '主题', icon: BookOpen },
  { href: '/calendar', label: '日历', icon: CalendarDays },
  { href: '/learning-center', label: '学习中心', icon: GraduationCap },
  { href: '/admin', label: '管理后台', icon: ShieldCheck, adminOnly: true },
  { href: '/admin/topic-submissions', label: '话题提交', icon: Inbox, adminOnly: true },
  { href: '/admin/word-books', label: '单词训练', icon: Library, adminOnly: true },
  { href: '/admin/daily-articles', label: '外刊管理', icon: BookOpenText, adminOnly: true },
  { href: '/admin/membership-plans', label: '会员套餐', icon: CreditCard, adminOnly: true },
  { href: '/admin/membership-orders', label: '会员订单', icon: ReceiptText, adminOnly: true },
  { href: '/users', label: '用户管理', icon: Users, adminOnly: true },
  { href: '/redeem-codes', label: '卡密管理', icon: Ticket, adminOnly: true },
];

function isPathMatch(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);
  const activeHref = visibleNavItems
    .filter(item => isPathMatch(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-56 md:flex-col md:border-r md:border-gray-100 md:bg-white">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-sm font-bold text-white">XY</span>
          </div>
          <span className="font-semibold text-gray-900">小柚英语</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {visibleNavItems.map(item => {
            const active = item.href === activeHref;
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors
                  ${active ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <Link href="/settings"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors
              ${pathname.startsWith('/settings') ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Settings size={18} />
            设置
          </Link>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur md:hidden">
        <div className="flex items-center justify-around gap-1">
          {visibleNavItems.map(item => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors sm:text-[11px] ${active ? 'text-blue-500' : 'text-gray-500'}`}
              >
                <item.icon size={18} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition-colors sm:text-[11px] ${pathname.startsWith('/settings') ? 'text-blue-500' : 'text-gray-500'}`}
          >
            <Settings size={18} />
            <span className="truncate">设置</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
