'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Search, User, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MobileNav() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    }
    loadUser();
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-14 w-full items-center justify-around border-t border-gray-200 bg-white md:hidden">
      <Link href="/" className="p-2 text-gray-700 hover:text-sky-500" aria-label="ホーム">
        <Home className="h-6 w-6" />
      </Link>
      <Link href="/search" className="p-2 text-gray-700 hover:text-sky-500" aria-label="検索">
        <Search className="h-6 w-6" />
      </Link>
      <Link
        href={currentUserId ? `/users/${currentUserId}` : '/login'}
        className="p-2 text-gray-700 hover:text-sky-500"
        aria-label="プロフィール"
      >
        <User className="h-6 w-6" />
      </Link>
      <Link href="/settings" className="p-2 text-gray-700 hover:text-sky-500" aria-label="設定">
        <Settings className="h-6 w-6" />
      </Link>
    </nav>
  );
}