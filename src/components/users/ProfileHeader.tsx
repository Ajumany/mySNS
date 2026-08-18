'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FollowButton from './FollowButton';

type ProfileHeaderProps = {
  profile: {
    id: string;
    display_name: string;
  };
  stats: {
    followingCount: number;
    followersCount: number;
    postsCount: number;
  };
  isFollowing: boolean;
  isSelf: boolean;
  onFollowChange: (isFollowing: boolean) => void;
};

export default function ProfileHeader({
  profile,
  stats,
  isFollowing,
  isSelf,
  onFollowChange,
}: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <div>
      {/* 上部ナビゲーションバー */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-6 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-900">{profile.display_name}</h1>
          <p className="text-xs text-gray-500">{stats.postsCount} 件のポスト</p>
        </div>
      </div>

      {/* プロフィール情報エリア */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-600">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
          <FollowButton
            targetUserId={profile.id}
            initialIsFollowing={isFollowing}
            isSelf={isSelf}
            onFollowChange={onFollowChange}
          />
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-900">{profile.display_name}</h2>
          <p className="text-xs font-mono text-gray-400">ID: {profile.id}</p>
        </div>

        <div className="mt-4 flex gap-4 text-sm text-gray-600">
          <div>
            <span className="font-bold text-gray-900">{stats.followingCount}</span>{' '}
            <span className="text-gray-500">フォロー中</span>
          </div>
          <div>
            <span className="font-bold text-gray-900">{stats.followersCount}</span>{' '}
            <span className="text-gray-500">フォロワー</span>
          </div>
        </div>
      </div>
    </div>
  );
}