import Sidebar from '@/components/common/Sidebar';
import MobileNav from '@/components/common/MobileNav';
import FloatingPostButton from '@/components/posts/FloatingPostButton';
import PostModal from '@/components/posts/PostModal';
import { PostModalProvider } from '@/context/PostModalContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PostModalProvider>
      <div className="flex min-h-screen justify-center bg-white text-gray-900">
        {/* 左サイドバー (PC) */}
        <Sidebar />

        {/* 中央メインコンテンツエリア */}
        <main className="w-full max-w-xl min-h-screen border-r border-gray-200 pb-20 md:pb-0">
          {children}
        </main>

        {/* モバイル用 UI */}
        <FloatingPostButton />
        <MobileNav />

        {/* 共通投稿モーダル */}
        <PostModal />
      </div>
    </PostModalProvider>
  );
}