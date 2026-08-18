'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type FollowListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: 'following' | 'followers';
};

type Profile = {
  id: string;
  display_name: string;
};

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
}: FollowListModalProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchList() {
      setLoading(true);
      try {
        if (type === 'following') {
          // このユーザーがフォローしている人一覧
          const { data, error } = await supabase
            .from('follows')
            .select(`
              profiles!follows_following_id_fkey (
                id,
                display_name
              )
            `)
            .eq('follower_id', userId);

          if (error) throw error;
          const mapped = data
            ?.map((d: any) => d.profiles)
            .filter(Boolean) as Profile[];
          setUsers(mapped || []);
        } else {
          // このユーザーをフォローしている人一覧
          const { data, error } = await supabase
            .from('follows')
            .select(`
              profiles!follows_follower_id_fkey (
                id,
                display_name
              )
            `)
            .eq('following_id', userId);

          if (error) throw error;
          const mapped = data
            ?.map((d: any) => d.profiles)
            .filter(Boolean) as Profile[];
          setUsers(mapped || []);
        }
      } catch (err) {
        console.error('Failed to load follow list:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchList();
  }, [isOpen, userId, type]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="font-bold text-gray-900">
            {type === 'following' ? 'フォロー中' : 'フォロワー'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ユーザー一覧 */}
        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-500">読み込み中...</div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              ユーザーが見つかりませんでした。
            </div>
          ) : (
            users.map((u) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 transition hover:bg-gray-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-600">
                  {u.display_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-gray-900 truncate">
                    {u.display_name}
                  </div>
                  <div className="font-mono text-xs text-gray-400 truncate">
                    ID: {u.id}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}