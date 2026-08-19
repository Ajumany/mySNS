'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, User, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function MobileNav() {
  const pathname = usePathname();
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

  const navItems = [
    {
      href: '/',
      label: 'ホーム',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      href: '/search',
      label: '検索',
      icon: Search,
      isActive: pathname.startsWith('/search'),
    },
    {
      href: currentUserId ? `/users/${currentUserId}` : '/login',
      label: 'プロフィール',
      icon: User,
      isActive: currentUserId ? pathname === `/users/${currentUserId}` : false,
    },
    {
      href: '/settings',
      label: '設定',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-14 w-full items-center justify-around border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center p-2 transition ${
              item.isActive
                ? 'text-sky-500 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label={item.label}
          >
            <Icon
              className={`h-6 w-6 transition ${
                item.isActive ? 'stroke-[2.5]' : 'stroke-2'
              }`}
            />
            {item.isActive && (
              <span className="absolute bottom-1 h-1 w-1 rounded-full bg-sky-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}