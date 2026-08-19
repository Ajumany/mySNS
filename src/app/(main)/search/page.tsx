'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/common/Avatar';

type Profile = {
  id: string;
  display_name: string;
  avatar_url?: string | null;
};

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      let req = supabase.from('profiles').select('id, display_name, avatar_url').limit(30);

      if (query.trim()) {
        // 表示名であいまい検索
        req = req.ilike('display_name', `%${query.trim()}%`);
      } else {
        // 未入力時は新着順に表示
        req = req.order('created_at', { ascending: false });
      }

      const { data, error } = await req;
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(keyword);
  }, [keyword, fetchUsers]);

  return (
    <div>
      {/* 検索ヘッダー */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 p-3 backdrop-blur-md">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="ユーザー名で検索..."
            className="w-full rounded-full bg-gray-100 py-2 pl-9 pr-4 text-sm text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </header>

      {/* 検索結果一覧 */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">検索中...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            該当するユーザーが見つかりませんでした。
          </div>
        ) : (
          users.map((profile) => {
            const isSelf = profile.id === currentUserId;
            return (
              <Link
                key={profile.id}
                href={`/users/${profile.id}`}
                className="flex items-center justify-between p-4 transition hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    src={profile.avatar_url}
                    name={profile.display_name}
                    size="lg"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 truncate">
                        {profile.display_name}
                      </span>
                      {isSelf && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                          あなた
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs text-gray-400 truncate block">
                      ID: {profile.id}
                    </span>
                  </div>
                </div>

                <div className="flex items-center text-xs font-semibold text-sky-500">
                  プロフィールへ
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}