'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type FollowButtonProps = {
  targetUserId: string;
  initialIsFollowing: boolean;
  isSelf: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
};

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  isSelf,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isSelf) return null;

  const handleToggleFollow = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        // フォロー解除
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        // フォロー登録
        const { error } = await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

        if (error) throw error;
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (err) {
      console.error('Follow toggle failed:', err);
      alert('フォロー操作に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={loading}
      className={`rounded-full px-4 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
        isFollowing
          ? isHovered
            ? 'border border-red-200 bg-red-50 text-red-600'
            : 'border border-gray-300 bg-white text-gray-900'
          : 'bg-gray-900 text-white hover:bg-gray-800'
      }`}
    >
      {isFollowing
        ? isHovered
          ? 'フォロー解除'
          : 'フォロー中'
        : 'フォロー'}
    </button>
  );
}