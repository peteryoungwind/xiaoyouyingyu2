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
          <Sidebar />
          <div className="ml-56 min-h-screen flex flex-col">
            <TopBar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
