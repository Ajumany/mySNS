import Timeline from '@/components/posts/Timeline';

export default function HomePage() {
  return (
    <div>
      {/* 固定ヘッダー */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md">
        <h1 className="text-lg font-bold text-gray-900">ホーム</h1>
      </header>

      {/* タイムライン */}
      <Timeline />
    </div>
  );
}