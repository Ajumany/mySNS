'use client';

import Link from 'next/link';
import { Home, Settings } from 'lucide-react';

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-40 flex h-14 w-full items-center justify-around border-t border-gray-200 bg-white md:hidden">
      <Link href="/" className="p-2 text-gray-700 hover:text-sky-500">
        <Home className="h-6 w-6" />
      </Link>
      <Link href="/settings" className="p-2 text-gray-700 hover:text-sky-500">
        <Settings className="h-6 w-6" />
      </Link>
    </nav>
  );
}