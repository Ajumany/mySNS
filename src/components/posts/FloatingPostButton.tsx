'use client';

import { Feather } from 'lucide-react';
import { usePostModal } from '@/context/PostModalContext';

export default function FloatingPostButton() {
  const { openModal } = usePostModal();

  return (
    <button
      onClick={openModal}
      className="fixed bottom-18 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition hover:bg-sky-600 active:scale-95 md:hidden"
      aria-label="新規投稿"
    >
      <Feather className="h-6 w-6" />
    </button>
  );
}