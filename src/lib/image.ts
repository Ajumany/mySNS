/**
 * アバター用画像のリサイズ・中央クロップ・圧縮処理
 * スマホの高画質写真（5MB〜15MB等）も、ブラウザ側で 512x512px / 50KB〜150KB 程度の軽量なJPEGに自動変換します。
 */
export async function processAvatarImage(
  file: File,
  targetSize = 512,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const minDim = Math.min(width, height);
        // 中央から正方形領域を算出
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        const canvas = document.createElement('canvas');
        // 元画像がtargetSizeより小さい場合は拡大せず元のサイズに合わせる
        const finalSize = Math.min(targetSize, minDim);
        canvas.width = finalSize;
        canvas.height = finalSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 中央の正方形を切り抜いて canvas に描画
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, finalSize, finalSize);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File(
              [blob],
              `${cleanName}.jpg`,
              {
                type: 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました。'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsDataURL(file);
  });
}
