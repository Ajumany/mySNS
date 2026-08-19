'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export type PostItem = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  reply_to_id?: string | null;
  profiles: {
    id: string;
    display_name: string;
  } | null;
  likes?: { user_id: string }[];
  replies?: { id: string }[];
};

type PostCardProps = {
  post: PostItem;
  currentUserId: string | null;
  onDelete?: (postId: string) => void;
};

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
  const router = useRouter();
  const isAuthor = currentUserId === post.user_id;

  // いいね状態
  const initialIsLiked = post.likes?.some((l) => l.user_id === currentUserId) ?? false;
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(post.likes?.length ?? 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const repliesCount = post.replies?.length ?? 0;
  const displayName = post.profiles?.display_name || '名称未設定';

  // いいねのトグル
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      if (nextState) {
        const { error } = await supabase.from('likes').insert({
          post_id: post.id,
          user_id: currentUserId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // ロールバック
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsLiking(false);
    }
  };

  // 投稿削除
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // カードクリックで詳細（スレッド）画面へ
  const handleCardClick = () => {
    router.push(`/posts/${post.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="flex cursor-pointer border-b border-gray-200 px-4 pt-3 pb-1.5 transition hover:bg-gray-50/60"
    >
      {/* アバター */}
      <div className="mr-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/users/${post.user_id}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-600 hover:opacity-80"
        >
          {displayName.slice(0, 1).toUpperCase()}
        </Link>
      </div>

      {/* コンテンツ */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate" onClick={(e) => e.stopPropagation()}>
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

        <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] text-gray-800 leading-normal">
          {post.content}
        </p>

        {/* アクションボタン群（リプライ & いいね） */}
        <div className="mt-1.5 -ml-1 flex items-center gap-6 text-gray-500 text-xs">
          {/* リプライボタン */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/posts/${post.id}`);
            }}
            className="flex items-center gap-1 hover:text-sky-500 transition group"
          >
            <div className="rounded-full p-1 group-hover:bg-sky-50">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span>{repliesCount}</span>
          </button>

          {/* いいねボタン */}
          <button
            onClick={handleToggleLike}
            className={`flex items-center gap-1 transition group ${isLiked ? 'text-pink-600' : 'hover:text-pink-600'
              }`}
          >
            <div className="rounded-full p-1 group-hover:bg-pink-50">
              <Heart
                className={`h-4 w-4 transition ${isLiked ? 'fill-pink-600 text-pink-600' : ''
                  }`}
              />
            </div>
            <span>{likesCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
}