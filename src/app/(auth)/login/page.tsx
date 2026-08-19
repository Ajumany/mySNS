'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MailCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMailSent, setIsMailSent] = useState(false);
  const [isResetMailSent, setIsResetMailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email.trim()) {
          throw new Error('メールアドレスを入力してください。');
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (error) throw error;
        setIsResetMailSent(true);
      } else if (isSignUp) {
        if (!displayName.trim()) {
          throw new Error('表示名を入力してください。');
        }
        if (displayName.trim().length > 50) {
          throw new Error('表示名は50文字以内で入力してください。');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() },
            // メールリンクの遷移先をコールバックAPIに指定
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        // メール確認が必要な場合（セッションがまだ null の場合）
        if (data.user && !data.session) {
          setIsMailSent(true);
        } else {
          window.location.href = '/';
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/';
      }
    } catch (err: any) {
      setErrorMsg(err.message || '認証エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // サインアップ時のメール送信完了画面
  if (isMailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">確認メールを送信しました</h2>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">{email}</strong> 宛に認証リンクを送信しました。メール内のリンクをクリックすると自動的にログインが完了します。
          </p>
          <button
            onClick={() => {
              setIsMailSent(false);
              setIsSignUp(false);
              setIsForgotPassword(false);
            }}
            className="mt-6 text-xs text-sky-600 hover:underline font-bold"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  // パスワード再設定メール送信完了画面
  if (isResetMailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">再設定メールを送信しました</h2>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">{email}</strong> 宛にパスワード再設定リンクを送信しました。メール内のリンクから新しいパスワードを設定してください。
          </p>
          <button
            onClick={() => {
              setIsResetMailSent(false);
              setIsForgotPassword(false);
              setIsSignUp(false);
            }}
            className="mt-6 text-xs text-sky-600 hover:underline font-bold"
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-black text-sky-500">
          mySNS
        </h1>

        {isForgotPassword ? (
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setErrorMsg('');
              }}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 font-bold mb-3"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              ログインに戻る
            </button>
            <h2 className="text-base font-bold text-gray-900">
              パスワードの再設定
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              ご登録のメールアドレス宛に再設定リンクをお送りします。
            </p>
          </div>
        ) : (
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
        )}

        {errorMsg && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && !isForgotPassword && (
            <div>
              <label className="block text-xs font-bold text-gray-700">
                ユーザー名
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例: あずま"
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 bg-white outline-none focus:border-sky-500"
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
              className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 bg-white outline-none focus:border-sky-500"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">
                  パスワード
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setErrorMsg('');
                    }}
                    className="text-[11px] text-sky-600 hover:underline"
                  >
                    パスワードをお忘れですか？
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 bg-white outline-none focus:border-sky-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-sky-500 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            {loading
              ? '処理中...'
              : isForgotPassword
              ? '再設定メールを送信'
              : isSignUp
              ? 'アカウント作成'
              : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}