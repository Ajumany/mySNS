'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { usePostModal } from '@/context/PostModalContext';
import { supabase } from '@/lib/supabase';

export default function PostModal() {
  const { isOpen, closeModal, triggerRefresh } = usePostModal();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > 140 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      setContent('');
      closeModal();
      triggerRefresh(); // タイムラインを自動更新
    } catch (err) {
      console.error('Post creation failed:', err);
      alert('投稿に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverLimit = content.length > 140;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <button
            onClick={closeModal}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">新しい投稿</span>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="いまどうしてる？"
            rows={4}
            className="w-full resize-none border-none outline-none text-base placeholder-gray-400"
            autoFocus
          />

          <div className="flex items-center justify-between border-t pt-3">
            <span
              className={`text-xs ${
                isOverLimit ? 'font-bold text-red-500' : 'text-gray-400'
              }`}
            >
              {content.length} / 140
            </span>

            <button
              type="submit"
              disabled={!content.trim() || isOverLimit || isSubmitting}
              className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? '送信中...' : 'ポスト'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}