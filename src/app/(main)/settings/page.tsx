'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Camera, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/common/Avatar';

const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
          .select('display_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (profile) {
          setDisplayName(profile.display_name || '');
          setAvatarUrl(profile.avatar_url || null);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // 画像ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイル形式バリデーション
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMsg('JPG、PNG、WebP、GIF形式の画像を選択してください。');
      return;
    }

    // ファイルサイズバリデーション (2MB上限)
    if (file.size > MAX_AVATAR_SIZE) {
      setErrorMsg('画像サイズは2MB以下にしてください。');
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // 画像の削除（頭文字デフォルトに戻す）
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl(null);
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !displayName.trim() || displayName.trim().length > MAX_DISPLAY_NAME_LENGTH || saving) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg(false);

    try {
      let finalAvatarUrl = avatarUrl;

      // 新しい画像ファイルが選択されている場合は Storage にアップロード
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() || 'png';
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(filePath);

        finalAvatarUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setPreviewUrl(null);
      setSuccessMsg(true);
      router.refresh();
    } catch (err: any) {
      console.error('Update profile error:', err);
      setErrorMsg(err.message || '更新に失敗しました。');
    } finally {
      setSaving(false);
    }
  };

  // ログアウト処理
  const handleSignOut = async () => {
    if (!confirm('ログアウトしますか？')) return;
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        読み込み中...
      </div>
    );
  }

  const currentDisplayAvatar = previewUrl || avatarUrl;

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
          {/* アイコン画像設定 */}
          <div>
            <label className="block text-sm font-bold text-gray-700">
              アイコン画像
            </label>

            <div className="mt-3 flex items-center gap-4">
              <div className="relative group">
                <Avatar
                  src={currentDisplayAvatar}
                  name={displayName || 'U'}
                  size="xl"
                  className="shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="画像を変更"
                >
                  <Camera className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    画像を選択
                  </button>

                  {currentDisplayAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      削除
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  2MB以下の JPG / PNG / WebP / GIF
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* 表示名設定 */}
          <div>
            <label className="block text-sm font-bold text-gray-700">
              表示名
            </label>
            <input
              type="text"
              required
              maxLength={MAX_DISPLAY_NAME_LENGTH}
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