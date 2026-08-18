'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setUserId(user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (profile) {
          setDisplayName(profile.display_name);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !displayName.trim() || saving) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMsg(true);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || '更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  // ログアウト処理
  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-6 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
          aria-label="戻る"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">設定</h1>
      </header>

      {/* 設定フォーム */}
      <div className="p-6">
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            プロフィールを更新しました。
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700">
              表示名
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名を入力"
              className="mt-2 w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-sky-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              タイムラインやプロフィール画面で表示される名前です。
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !displayName.trim()}
              className="rounded-full bg-sky-500 px-6 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>

        {/* ログアウトボタンエリア */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-lg border border-red-200 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}