'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export type PostItem = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    id: string;
    display_name: string;
  } | null;
};

type PostCardProps = {
  post: PostItem;
  currentUserId: string | null;
  onDelete?: (postId: string) => void;
};

// 相対時刻フォーマット用ヘルパー
function formatRelativeTime(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}秒前`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}分前`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}時間前`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}日前`;

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

export default function PostCard({ post, currentUserId, onDelete }: PostCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isAuthor = currentUserId === post.user_id;

  const handleDelete = async () => {
    if (!confirm('この投稿を削除しますか？') || isDeleting) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', currentUserId!);

      if (error) throw error;
      onDelete?.(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('投稿の削除に失敗しました。');
      setIsDeleting(false);
    }
  };

  const displayName = post.profiles?.display_name || '名称未設定';

  return (
    <article className="flex border-b border-gray-200 p-4 transition hover:bg-gray-50/50">
      {/* 簡易アバター（イニシャル） */}
      <div className="mr-3 flex-shrink-0">
        <Link
          href={`/users/${post.user_id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600 hover:opacity-80"
        >
          {displayName.slice(0, 1).toUpperCase()}
        </Link>
      </div>

      {/* 本文エリア */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <Link
              href={`/users/${post.user_id}`}
              className="truncate font-bold text-gray-900 hover:underline"
            >
              {displayName}
            </Link>
            <span className="text-gray-400">·</span>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>

          {/* 投稿者本人の場合のみ削除ボタンを表示 */}
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-gray-400 hover:text-red-500 disabled:opacity-50"
              title="削除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 投稿テキスト */}
        <p className="mt-1 whitespace-pre-wrap break-words text-[15px] text-gray-800 leading-relaxed">
          {post.content}
        </p>
      </div>
    </article>
  );
}