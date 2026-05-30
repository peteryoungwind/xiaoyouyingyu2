import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/top-bar';

export const metadata: Metadata = {
  title: '小柚英语 - 口语主题练习',
  description: '英语口语主题管理系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#F5F7FA]">
        <Providers>
          <div className="min-h-screen overflow-x-hidden md:flex">
            <Sidebar />
            <div className="min-h-screen min-w-0 flex flex-1 flex-col md:ml-56">
              <TopBar />
              <main className="flex-1 overflow-x-hidden px-4 py-4 pb-28 md:p-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
