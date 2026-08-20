'use client';

import { useState } from 'react';
import { X, Plus, KeyRound, Copy, Check, Users, LogOut, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type GroupItem = {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_by: string;
  role?: string;
  members_count?: number;
};

type GroupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (groupId: string, groupName: string) => void;
  onLeaveOrDelete?: (groupId: string) => void;
  groupToView?: GroupItem | null;
  currentUserId: string | null;
};

function generateInviteCode(): string {
  // 誤読しやすい文字（I, O, 1, 0）を除いた28文字
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function GroupModal({
  isOpen,
  onClose,
  onSuccess,
  onLeaveOrDelete,
  groupToView,
  currentUserId,
}: GroupModalProps) {
  const [tab, setTab] = useState<'create' | 'join'>(groupToView ? 'create' : 'join');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // グループ作成処理
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading || !currentUserId) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const inviteCode = generateInviteCode();

      // 1. groups テーブルに作成
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim(),
          invite_code: inviteCode,
          created_by: currentUserId,
        })
        .select('id, name')
        .single();

      if (groupError) throw groupError;

      // 2. group_members テーブルにオーナーとして追加
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUserId,
          role: 'owner',
        });

      if (memberError) throw memberError;

      setName('');
      setDescription('');
      onSuccess(newGroup.id, newGroup.name);
      onClose();
    } catch (err: any) {
      console.error('Failed to create group:', err);
      setErrorMsg(err.message || 'グループの作成に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 招待コードで参加処理
  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCodeInput.trim().toUpperCase();
    if (!cleanCode || loading || !currentUserId) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. 招待コードに合致するグループを検索
      const { data: targetGroup, error: findError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', cleanCode)
        .single();

      if (findError || !targetGroup) {
        throw new Error('招待コードが見つかりません。コードを確認してください。');
      }

      // 2. 既にメンバーでないか確認
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', targetGroup.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existingMember) {
        // すでに参加済みの場合はそのグループを選択して完了
        onSuccess(targetGroup.id, targetGroup.name);
        onClose();
        return;
      }

      // 3. メンバーとして追加
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: targetGroup.id,
          user_id: currentUserId,
          role: 'member',
        });

      if (joinError) throw joinError;

      setInviteCodeInput('');
      onSuccess(targetGroup.id, targetGroup.name);
      onClose();
    } catch (err: any) {
      console.error('Failed to join group:', err);
      setErrorMsg(err.message || 'グループの参加に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  // 招待コードのコピー
  const handleCopyCode = () => {
    if (!groupToView) return;
    navigator.clipboard.writeText(groupToView.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // グループ退会・削除
  const handleLeaveOrDelete = async () => {
    if (!groupToView || !currentUserId || loading) return;
    const isOwner = groupToView.created_by === currentUserId;
    const confirmText = isOwner
      ? 'このグループを削除しますか？（投稿やメンバーも削除されます）'
      : 'このグループから退会しますか？';

    if (!confirm(confirmText)) return;

    setLoading(true);
    try {
      if (isOwner) {
        const { error } = await supabase.from('groups').delete().eq('id', groupToView.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupToView.id)
          .eq('user_id', currentUserId);
        if (error) throw error;
      }

      onLeaveOrDelete?.(groupToView.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to leave/delete group:', err);
      alert('操作に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold text-gray-900">
            {groupToView ? 'グループ情報' : 'グループの追加'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* グループ詳細表示モード */}
        {groupToView ? (
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{groupToView.name}</h3>
              {groupToView.description && (
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  {groupToView.description}
                </p>
              )}
            </div>

            {/* 招待コード共有カード */}
            <div className="rounded-xl bg-sky-50 p-4 border border-sky-100">
              <label className="block text-xs font-bold text-sky-800">
                招待コード
              </label>
              <p className="mt-0.5 text-[11px] text-sky-600">
                このコードを友達に教えてグループに招待できます。
              </p>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-white p-2.5 border border-sky-200">
                <span className="font-mono text-base font-bold tracking-widest text-sky-900">
                  {groupToView.invite_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 rounded-md bg-sky-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-sky-600"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      コピー完了
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      コピー
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLeaveOrDelete}
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {groupToView.created_by === currentUserId ? (
                  <>
                    <Trash2 className="h-4 w-4" />
                    グループを削除
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    グループを退会
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* 作成 / 参加 切り替えモード */
          <div className="mt-4">
            <div className="mb-4 flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setTab('join');
                  setErrorMsg('');
                }}
                className={`flex-1 pb-2 text-center text-xs font-bold ${
                  tab === 'join'
                    ? 'border-b-2 border-sky-500 text-sky-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                招待コードで参加
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('create');
                  setErrorMsg('');
                }}
                className={`flex-1 pb-2 text-center text-xs font-bold ${
                  tab === 'create'
                    ? 'border-b-2 border-sky-500 text-sky-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                グループを新規作成
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            {tab === 'join' ? (
              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700">
                    招待コード
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                    placeholder="例: G8K2NX"
                    className="mt-1 w-full uppercase font-mono tracking-widest rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-none focus:border-sky-500"
                    autoFocus
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    教えてもらった6桁の英数字コードを入力してください。
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !inviteCodeInput.trim()}
                  className="w-full rounded-full bg-sky-500 py-2 text-xs font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {loading ? '参加中...' : 'グループに参加'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700">
                    グループ名
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={50}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: ゲーム部、読書サークル"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-none focus:border-sky-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700">
                    説明（任意）
                  </label>
                  <textarea
                    rows={2}
                    maxLength={160}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="グループの簡単な説明"
                    className="mt-1 w-full resize-none rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full rounded-full bg-sky-500 py-2 text-xs font-bold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {loading ? '作成中...' : 'グループを作成'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
