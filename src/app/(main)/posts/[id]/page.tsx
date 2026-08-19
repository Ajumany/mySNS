'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PostCard, { PostItem } from '@/components/posts/PostCard';
import { processPostImage } from '@/lib/image';

const MAX_IMAGES = 2;

type ImageItem = {
  file: File;
  previewUrl: string;
};

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mainPost, setMainPost] = useState<PostItem | null>(null);
  const [replies, setReplies] = useState<PostItem[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [replyImages, setReplyImages] = useState<ImageItem[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPostAndReplies = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // 1. メイン投稿の取得
      const { data: postData, error: postError } = await supabase
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
            avatar_url
          ),
          likes (
            user_id
          ),
          replies:posts!reply_to_id (
            id
          )
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      setMainPost(postData as unknown as PostItem);

      // 2. リプライ一覧の取得（古い順に並べて会話順に）
      const { data: repliesData, error: repliesError } = await supabase
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
            avatar_url
          ),
          likes (
            user_id
          ),
          replies:posts!reply_to_id (
            id
          )
        `)
        .eq('reply_to_id', postId)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;
      setReplies((repliesData as unknown as PostItem[]) || []);
    } catch (err) {
      console.error('Failed to load post detail:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostAndReplies();
  }, [fetchPostAndReplies]);

  // 返信用画像選択
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - replyImages.length;
    if (remainingSlots <= 0) return;

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    setIsProcessingImages(true);
    try {
      const processedItems: ImageItem[] = await Promise.all(
        filesToProcess.map(async (file) => {
          const optimizedFile = await processPostImage(file, 1400, 0.85);
          return {
            file: optimizedFile,
            previewUrl: URL.createObjectURL(optimizedFile),
          };
        })
      );

      setReplyImages((prev) => [...prev, ...processedItems].slice(0, MAX_IMAGES));
    } catch (err) {
      console.error('Failed to process reply images:', err);
      alert('画像の処理に失敗しました。');
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setReplyImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const isOverLimit = replyContent.length > 140;
  const canSubmitReply =
    (replyContent.trim().length > 0 || replyImages.length > 0) &&
    !isOverLimit &&
    !submitting &&
    !isProcessingImages &&
    !!currentUserId;

  // リプライ送信
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitReply || !currentUserId) return;

    setSubmitting(true);
    try {
      // 画像アップロード処理
      const uploadedImageUrls: string[] = [];

      for (let i = 0; i < replyImages.length; i++) {
        const item = replyImages[i];
        const fileExt = item.file.name.split('.').pop() || 'jpg';
        const filePath = `${currentUserId}/${Date.now()}_reply_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, item.file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('post-images').getPublicUrl(filePath);

        uploadedImageUrls.push(publicUrl);
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUserId,
          reply_to_id: postId,
          content: replyContent.trim(),
          images: uploadedImageUrls,
        })
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
            avatar_url
          ),
          likes (
            user_id
          ),
          replies:posts!reply_to_id (
            id
          )
        `)
        .single();

      if (error) throw error;

      setReplyContent('');
      setReplyImages([]);
      setReplies((prev) => [...prev, data as unknown as PostItem]);
      // メイン投稿のリプライ数を+1更新
      setMainPost((prev) =>
        prev
          ? {
              ...prev,
              replies: [...(prev.replies || []), { id: data.id }],
            }
          : null
      );
    } catch (err) {
      console.error('Failed to reply:', err);
      alert('返信の送信に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMainPost = () => {
    router.push('/');
  };

  const handleDeleteReply = (deletedId: string) => {
    setReplies((prev) => prev.filter((r) => r.id !== deletedId));
    setMainPost((prev) =>
      prev
        ? {
            ...prev,
            replies: prev.replies?.filter((r) => r.id !== deletedId) || [],
          }
        : null
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-gray-500">読み込み中...</div>;
  }

  if (!mainPost) {
    return <div className="p-8 text-center text-sm text-gray-500">投稿が見つかりませんでした。</div>;
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
        <h1 className="text-lg font-bold text-gray-900">会話</h1>
      </header>

      {/* メイン投稿 */}
      <PostCard
        post={mainPost}
        currentUserId={currentUserId}
        onDelete={handleDeleteMainPost}
      />

      {/* インライン返信フォーム */}
      <form onSubmit={handleSendReply} className="border-b border-gray-200 p-4 bg-gray-50/50">
        <div className="flex gap-3">
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="返信をポスト..."
            rows={2}
            className="w-full resize-none rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-sky-500 placeholder-gray-400"
          />
        </div>

        {/* 返信画像のプレビューグリッド */}
        {replyImages.length > 0 && (
          <div
            className={`mt-2 grid gap-2 ${
              replyImages.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {replyImages.map((img, idx) => (
              <div
                key={idx}
                className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-100 border border-gray-200"
              >
                <img
                  src={img.previewUrl}
                  alt={`返信添付画像 ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition"
                  aria-label="画像を削除"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 画像処理中インジケータ */}
        {isProcessingImages && (
          <div className="mt-2 flex items-center gap-2 text-xs text-sky-600 font-medium">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            画像を最適化中...
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={replyImages.length >= MAX_IMAGES || isProcessingImages}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full p-1.5 text-sky-500 hover:bg-sky-50 transition disabled:opacity-30"
              aria-label="画像を追加"
              title={replyImages.length >= MAX_IMAGES ? '最大2枚までです' : '画像を追加（最大2枚）'}
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <span
              className={`text-xs ${
                isOverLimit ? 'font-bold text-red-500' : 'text-gray-400'
              }`}
            >
              {replyContent.length} / 140
            </span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImagesChange}
            className="hidden"
          />

          <button
            type="submit"
            disabled={!canSubmitReply}
            className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? '送信中...' : '返信する'}
          </button>
        </div>
      </form>

      {/* リプライ一覧 */}
      <div className="divide-y divide-gray-100">
        {replies.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">返信はまだありません。</div>
        ) : (
          replies.map((reply) => (
            <PostCard
              key={reply.id}
              post={reply}
              currentUserId={currentUserId}
              onDelete={handleDeleteReply}
            />
          ))
        )}
      </div>
    </div>
  );
}