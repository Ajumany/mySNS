'use client';

import { useRef, useState } from 'react';
import { X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { usePostModal } from '@/context/PostModalContext';
import { supabase } from '@/lib/supabase';
import { processPostImage } from '@/lib/image';

const MAX_IMAGES = 2;

type ImageItem = {
  file: File;
  previewUrl: string;
};

export default function PostModal() {
  const { isOpen, closeModal, triggerRefresh } = usePostModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // 画像ファイル選択処理
  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
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

      setImages((prev) => [...prev, ...processedItems].slice(0, MAX_IMAGES));
    } catch (err) {
      console.error('Failed to process post images:', err);
      alert('画像の処理に失敗しました。');
    } finally {
      setIsProcessingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 画像削除
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      return updated;
    });
  };

  const isOverLimit = content.length > 140;
  const canSubmit =
    (content.trim().length > 0 || images.length > 0) &&
    !isOverLimit &&
    !isSubmitting &&
    !isProcessingImages;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // 画像アップロード処理
      const uploadedImageUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const fileExt = item.file.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/${Date.now()}_${i}.${fileExt}`;

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

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        images: uploadedImageUrls,
      });

      if (insertError) throw insertError;

      // リセットして閉じる
      setContent('');
      setImages([]);
      closeModal();
      triggerRefresh(); // タイムラインを自動更新
    } catch (err) {
      console.error('Post creation failed:', err);
      alert('投稿に失敗しました。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <button
            onClick={closeModal}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-gray-700">新しい投稿</span>
          <div className="w-6" />
        </div>

        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="いまどうしてる？"
            rows={3}
            className="w-full resize-none border-none outline-none text-base placeholder-gray-400"
            autoFocus
          />

          {/* 選択された画像のプレビューグリッド */}
          {images.length > 0 && (
            <div
              className={`mt-2 grid gap-2 ${
                images.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gray-100 border border-gray-200"
                >
                  <img
                    src={img.previewUrl}
                    alt={`添付画像 ${idx + 1}`}
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

          {/* 画像処理中のローディング表示 */}
          {isProcessingImages && (
            <div className="mt-2 flex items-center gap-2 text-xs text-sky-600 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              画像を最適化中...
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3 mt-3">
            <div className="flex items-center gap-3">
              {/* 画像添付ボタン */}
              <button
                type="button"
                disabled={images.length >= MAX_IMAGES || isProcessingImages}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full p-2 text-sky-500 hover:bg-sky-50 transition disabled:opacity-30"
                aria-label="画像を追加"
                title={images.length >= MAX_IMAGES ? '最大2枚までです' : '画像を追加（最大2枚）'}
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              <span
                className={`text-xs ${
                  isOverLimit ? 'font-bold text-red-500' : 'text-gray-400'
                }`}
              >
                {content.length} / 140
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
              disabled={!canSubmit}
              className="flex items-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? '送信中...' : 'ポスト'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}