'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSignUp) {
        // 新規登録
        if (!displayName.trim()) {
          throw new Error('表示名を入力してください。');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '認証エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-black text-sky-500">
          SNS
        </h1>

        <div className="mb-6 flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
            }}
            className={`flex-1 pb-2 text-center text-sm font-bold ${
              !isSignUp
                ? 'border-b-2 border-sky-500 text-sky-500'
                : 'text-gray-400'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
            }}
            className={`flex-1 pb-2 text-center text-sm font-bold ${
              isSignUp
                ? 'border-b-2 border-sky-500 text-sky-500'
                : 'text-gray-400'
            }`}
          >
            新規登録
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-700">
                表示名
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: たろう"
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-sky-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sky-500 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {loading
              ? '処理中...'
              : isSignUp
              ? 'アカウント作成'
              : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}