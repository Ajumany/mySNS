'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PostCard, { PostItem } from './PostCard';

export default function Timeline() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      setCurrentUserId(user.id);

      // 1. フォローしているユーザーのID一覧を取得
      const { data: followings, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followError) throw followError;

      const targetIds = [
        user.id,
        ...(followings?.map((f) => f.following_id) || []),
      ];

      // 2. 自分 + フォロー中ユーザーの投稿を取得（最新50件）
      const { data: timelinePosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            id,
            display_name
          )
        `)
        .in('user_id', targetIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Supabaseのネスト結果の型補正
      setPosts((timelinePosts as unknown as PostItem[]) || []);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleDeletePost = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8 text-sm text-gray-500">
        読み込み中...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        表示できる投稿がありません。他のユーザーをフォローするか、新しくポストしてみましょう。
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onDelete={handleDeletePost}
        />
      ))}
    </div>
  );
}