'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PostCard, { PostItem } from '@/components/posts/PostCard';

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: postId } = use(params);
  const router = useRouter();

  const [mainPost, setMainPost] = useState<PostItem | null>(null);
  const [replies, setReplies] = useState<PostItem[]>([]);
  const [replyContent, setReplyContent] = useState('');
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
          created_at,
          user_id,
          reply_to_id,
          profiles (
            id,
            display_name
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
          created_at,
          user_id,
          reply_to_id,
          profiles (
            id,
            display_name
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

  // リプライ送信
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || replyContent.length > 140 || submitting || !currentUserId) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: currentUserId,
          reply_to_id: postId,
          content: replyContent.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          reply_to_id,
          profiles (
            id,
            display_name
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
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-xs ${
              replyContent.length > 140 ? 'font-bold text-red-500' : 'text-gray-400'
            }`}
          >
            {replyContent.length} / 140
          </span>
          <button
            type="submit"
            disabled={!replyContent.trim() || replyContent.length > 140 || submitting}
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