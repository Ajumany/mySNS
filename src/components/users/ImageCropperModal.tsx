'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

type ImageCropperModalProps = {
  imageSrc: string | null;
  fileName?: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewUrl: string) => void;
};

const VIEWPORT_SIZE = 280; // クロップ領域の表示サイズ (px)
const OUTPUT_SIZE = 512; // 出力画像のサイズ (px)

export default function ImageCropperModal({
  imageSrc,
  fileName = 'avatar.jpg',
  isOpen,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 初期化
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen, imageSrc]);

  // 画像ロード時のサイズ取得
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // 画像の基本拡大倍率（ビューポート全体を覆う最小倍率）
  const baseScale = imageSize
    ? Math.max(VIEWPORT_SIZE / imageSize.width, VIEWPORT_SIZE / imageSize.height)
    : 1;

  // 表示上の画像サイズ
  const displayWidth = imageSize ? imageSize.width * baseScale * zoom : VIEWPORT_SIZE;
  const displayHeight = imageSize ? imageSize.height * baseScale * zoom : VIEWPORT_SIZE;

  // 移動可能な最大オフセット（画像の端が枠内に入らないように制限）
  const maxOffsetX = Math.max(0, (displayWidth - VIEWPORT_SIZE) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - VIEWPORT_SIZE) / 2);

  const clampOffset = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (!imageSize) return { x: 0, y: 0 };
      const curDisplayW = imageSize.width * baseScale * currentZoom;
      const curDisplayH = imageSize.height * baseScale * currentZoom;
      const curMaxX = Math.max(0, (curDisplayW - VIEWPORT_SIZE) / 2);
      const curMaxY = Math.max(0, (curDisplayH - VIEWPORT_SIZE) / 2);
      return {
        x: Math.max(-curMaxX, Math.min(curMaxX, x)),
        y: Math.max(-curMaxY, Math.min(curMaxY, y)),
      };
    },
    [imageSize, baseScale]
  );

  // ポインタードラッグ開始
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // ポインタードラッグ中
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset(clampOffset(newX, newY, zoom));
  };

  // ポインタードラッグ終了
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // ズーム変更時の位置補正
  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom));
  };

  // マウスホイールでのズーム
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    handleZoomChange(zoom + delta);
  };

  // 切り抜き決定処理
  const handleCrop = async () => {
    if (!imageRef.current || !imageSize || isProcessing) return;

    setIsProcessing(true);
    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // ビューポート上の座標系から元画像の切り抜き領域（正方形）を逆算
      const currentScale = baseScale * zoom;
      const cropSizeInOriginal = VIEWPORT_SIZE / currentScale;

      const centerInOriginalX = imageSize.width / 2 - offset.x / currentScale;
      const centerInOriginalY = imageSize.height / 2 - offset.y / currentScale;

      const sx = centerInOriginalX - cropSizeInOriginal / 2;
      const sy = centerInOriginalY - cropSizeInOriginal / 2;

      ctx.drawImage(
        img,
        sx,
        sy,
        cropSizeInOriginal,
        cropSizeInOriginal,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }

          const cleanName = fileName.replace(/\.[^/.]+$/, '');
          const croppedFile = new File([blob], `${cleanName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          const previewUrl = URL.createObjectURL(blob);
          onCropComplete(croppedFile, previewUrl);
          setIsProcessing(false);
          onClose();
        },
        'image/jpeg',
        0.88
      );
    } catch (err) {
      console.error('Crop failed:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-gray-900">画像の調整</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* クロップビューポート */}
        <div className="my-4 flex flex-col items-center">
          <div
            ref={containerRef}
            onWheel={handleWheel}
            className="relative overflow-hidden rounded-xl bg-gray-900 select-none shadow-inner"
            style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
          >
            {/* ドラッグ操作可能な画像コンテナ */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="調整対象"
                onLoad={handleImageLoad}
                draggable={false}
                style={{
                  width: displayWidth,
                  height: displayHeight,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            </div>

            {/* 円形アバターのプレビューマスクオーバーレイ */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* 外側半透明 + 中央くり抜き */}
              <div
                className="rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                style={{ width: VIEWPORT_SIZE - 20, height: VIEWPORT_SIZE - 20 }}
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            ドラッグで移動、スライダーで拡大縮小
          </p>
        </div>

        {/* ズームコントロール */}
        <div className="mb-5 flex items-center gap-3 px-2">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.2)}
            disabled={zoom <= 1}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            aria-label="縮小"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-sky-500"
          />

          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.2)}
            disabled={zoom >= 3}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            aria-label="拡大"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-gray-300 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={isProcessing}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-sky-500 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {isProcessing ? '処理中...' : '決定'}
          </button>
        </div>
      </div>
    </div>
  );
}
