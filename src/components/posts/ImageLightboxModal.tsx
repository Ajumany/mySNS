'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

type ImageLightboxModalProps = {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function ImageLightboxModal({
  imageUrl,
  isOpen,
  onClose,
}: ImageLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm cursor-zoom-out animate-in fade-in duration-200"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2.5 text-white/90 transition hover:bg-black/80 hover:text-white"
        aria-label="閉じる"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] max-w-[95vw] items-center justify-center cursor-default"
      >
        <img
          src={imageUrl}
          alt="拡大画像"
          className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>
  );
}
