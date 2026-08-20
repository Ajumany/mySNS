'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePostModal } from '@/context/PostModalContext';
import PostCard, { PostItem } from './PostCard';
import GroupTabBar from '@/components/groups/GroupTabBar';

export default function Timeline() {
  const { refreshKey, activeGroupId, activeGroupName } = usePostModal();
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

      if (activeGroupId) {
        // グループタイムライン取得 (group_id = activeGroupId)
        const { data: groupPosts, error: groupPostsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            images,
            created_at,
            user_id,
            reply_to_id,
            group_id,
            profiles (
              id,
              display_name,
              avatar_url
            ),
            likes (
              user_id
            ),
            replies:posts!reply_to_id (
              id
            )
          `)
          .is('reply_to_id', null)
          .eq('group_id', activeGroupId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (groupPostsError) throw groupPostsError;
        setPosts((groupPosts as unknown as PostItem[]) || []);
      } else {
        // フォロー中（全体）タイムライン取得 (group_id is null)
        const { data: followings, error: followError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        if (followError) throw followError;

        const targetIds = [
          user.id,
          ...(followings?.map((f) => f.following_id) || []),
        ];

        const { data: timelinePosts, error: postsError } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            images,
            created_at,
            user_id,
            reply_to_id,
            group_id,
            profiles (
              id,
              display_name,
              avatar_url
            ),
            likes (
              user_id
            ),
            replies:posts!reply_to_id (
              id
            )
          `)
          .is('reply_to_id', null)
          .is('group_id', null)
          .in('user_id', targetIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (postsError) throw postsError;
        setPosts((timelinePosts as unknown as PostItem[]) || []);
      }
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline, refreshKey]);

  const handleDeletePost = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
  };

  return (
    <div>
      {/* タイムライン上部 グループ切り替えタブバー */}
      <GroupTabBar />

      {loading ? (
        <div className="flex justify-center p-8 text-sm text-gray-500">
          読み込み中...
        </div>
      ) : posts.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          {activeGroupId
            ? `${activeGroupName || 'グループ'}にはまだポストがありません。最初のポストをしてみましょう！`
            : '表示できる投稿がありません。他のユーザーをフォローするか、新しくポストしてみましょう。'}
        </div>
      ) : (
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
      )}
    </div>
  );
}