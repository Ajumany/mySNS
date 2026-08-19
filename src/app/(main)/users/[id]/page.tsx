'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ProfileHeader from '@/components/users/ProfileHeader';
import PostCard, { PostItem } from '@/components/posts/PostCard';
import { usePostModal } from '@/context/PostModalContext';

type UserProfile = {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
};

type Stats = {
  followingCount: number;
  followersCount: number;
  postsCount: number;
};

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: targetUserId } = use(params);
  const { refreshKey } = usePostModal();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [likedPosts, setLikedPosts] = useState<PostItem[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes'>('posts');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    followingCount: 0,
    followersCount: 0,
    postsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 1. 対象ユーザーのプロフィール取得
      const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, bio')
        .eq('id', targetUserId)
        .single();

      if (profError) throw profError;
      setProfile(profileData);

      // 2. フォロー関係の判定 (ログインユーザーが対象をフォローしているか)
      if (user.id !== targetUserId) {
        const { data: followRel } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle();

        setIsFollowing(!!followRel);
      }

      // 3. カウント集計（フォロー中数・フォロワー数・投稿数）
      const [
        { count: followingCount },
        { count: followersCount },
        { count: postsCount },
      ] = await Promise.all([
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', targetUserId),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', targetUserId),
        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', targetUserId),
      ]);

      setStats({
        followingCount: followingCount || 0,
        followersCount: followersCount || 0,
        postsCount: postsCount || 0,
      });

      // 4. 対象ユーザーの過去投稿一覧取得
      const { data: userPosts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          images,
          created_at,
          user_id,
          reply_to_id,
          profiles (
            id,
            display_name,
            avatar_url,
            bio
          ),
          likes (
            user_id
          ),
          replies:posts!reply_to_id (
            id
          )
        `)
        .eq('user_id', targetUserId)
        .is('reply_to_id', null) // 親投稿のみ表示
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;
      setPosts((userPosts as unknown as PostItem[]) || []);
    } catch (err) {
      console.error('Failed to fetch user page data:', err);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  // いいねした投稿の取得
  const fetchLikedPosts = useCallback(async () => {
    setLoadingLikes(true);
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          created_at,
          posts (
            id,
            content,
            images,
            created_at,
            user_id,
            reply_to_id,
            profiles (
              id,
              display_name,
              avatar_url,
              bio
            ),
            likes (
              user_id
            ),
            replies:posts!reply_to_id (
              id
            )
          )
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts = (data || [])
        .map((item) => item.posts)
        .filter(Boolean) as unknown as PostItem[];

      setLikedPosts(formattedPosts);
    } catch (err) {
      console.error('Failed to fetch liked posts:', err);
    } finally {
      setLoadingLikes(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, refreshKey]);

  useEffect(() => {
    if (activeTab === 'likes') {
      fetchLikedPosts();
    }
  }, [activeTab, fetchLikedPosts]);

  const handleFollowChange = (nextIsFollowing: boolean) => {
    setIsFollowing(nextIsFollowing);
    setStats((prev) => ({
      ...prev,
      followersCount: nextIsFollowing
        ? prev.followersCount + 1
        : Math.max(0, prev.followersCount - 1),
    }));
  };

  const handleDeletePost = (deletedPostId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    setLikedPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
    setStats((prev) => ({ ...prev, postsCount: Math.max(0, prev.postsCount - 1) }));
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">読み込み中...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-sm text-gray-500">ユーザーが存在しません。</div>;
  }

  const currentDisplayPosts = activeTab === 'posts' ? posts : likedPosts;

  return (
    <div>
      <ProfileHeader
        profile={profile}
        stats={stats}
        isFollowing={isFollowing}
        isSelf={currentUserId === targetUserId}
        onFollowChange={handleFollowChange}
      />

      {/* タブ切り替え */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 text-center text-sm font-bold transition hover:bg-gray-50 ${
            activeTab === 'posts'
              ? 'border-b-2 border-sky-500 text-sky-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ポスト
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('likes')}
          className={`flex-1 py-3 text-center text-sm font-bold transition hover:bg-gray-50 ${
            activeTab === 'likes'
              ? 'border-b-2 border-sky-500 text-sky-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          いいね
        </button>
      </div>

      {/* 投稿リスト */}
      <div className="divide-y divide-gray-100">
        {activeTab === 'likes' && loadingLikes ? (
          <div className="p-8 text-center text-sm text-gray-500">いいねを読み込み中...</div>
        ) : currentDisplayPosts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {activeTab === 'posts'
              ? 'まだポストがありません。'
              : 'まだいいねしたポストがありません。'}
          </div>
        ) : (
          currentDisplayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>
    </div>
  );
}