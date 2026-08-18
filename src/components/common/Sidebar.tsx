'use client';

import Link from 'next/link';
import { Home, Search, Settings, LogOut, Feather } from 'lucide-react';
import { usePostModal } from '@/context/PostModalContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const { openModal } = usePostModal();
  const router = useRouter();

  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-col justify-between border-r border-gray-200 p-4 md:flex">
      <div className="space-y-4">
        <div className="px-3 py-2 text-xl font-black text-sky-500 tracking-wider">
          SNS
        </div>

        <nav className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-4 rounded-full px-4 py-3 text-lg font-medium text-gray-800 transition hover:bg-gray-100"
          >
            <Home className="h-6 w-6" />
            ホーム
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-4 rounded-full px-4 py-3 text-lg font-medium text-gray-800 transition hover:bg-gray-100"
          >
            <Search className="h-6 w-6" />
            検索
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-4 rounded-full px-4 py-3 text-lg font-medium text-gray-800 transition hover:bg-gray-100"
          >
            <Settings className="h-6 w-6" />
            設定
          </Link>
        </nav>

        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sky-500 py-3 text-center font-bold text-white shadow transition hover:bg-sky-600"
        >
          <Feather className="h-5 w-5" />
          ポストする
        </button>
      </div>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" />
        ログアウト
      </button>
    </aside>
  );
}