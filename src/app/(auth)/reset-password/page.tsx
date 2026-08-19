'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MAX_PASSWORD_LENGTH = 72;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      setErrorMsg('パスワードは6文字以上で入力してください。');
      return;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      setErrorMsg(`パスワードは${MAX_PASSWORD_LENGTH}文字以内で入力してください。`);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('パスワードが一致しません。');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setErrorMsg(err.message || 'パスワードの再設定に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-2 text-center text-2xl font-black text-sky-500">
          mySNS
        </h1>
        <h2 className="mb-6 text-center text-sm font-bold text-gray-700">
          新しいパスワードの設定
        </h2>

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-gray-800">
              パスワードを更新しました
            </p>
            <p className="text-xs text-gray-500">
              ホーム画面へ自動で移動します...
            </p>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700">
                  新しいパスワード
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    maxLength={MAX_PASSWORD_LENGTH}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上の新しいパスワード"
                    className="w-full rounded-lg border border-gray-300 p-2.5 pr-10 text-sm text-gray-900 bg-white outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">
                  新しいパスワード（確認用）
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={MAX_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="もう一度パスワードを入力"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 bg-white outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full rounded-full bg-sky-500 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
              >
                {loading ? '更新中...' : 'パスワードを再設定'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
