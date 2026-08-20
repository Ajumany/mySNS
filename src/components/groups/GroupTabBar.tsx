'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Users, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePostModal } from '@/context/PostModalContext';
import GroupModal, { GroupItem } from './GroupModal';

export default function GroupTabBar() {
  const { activeGroupId, setActiveGroup } = usePostModal();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groupToView, setGroupToView] = useState<GroupItem | null>(null);

  // 参加中グループ一覧を取得
  const fetchMyGroups = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          role,
          groups (
            id,
            name,
            description,
            invite_code,
            created_by
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const groupList = (data || [])
        .map((item: any) => ({
          ...item.groups,
          role: item.role,
        }))
        .filter(Boolean) as GroupItem[];

      setGroups(groupList);
    } catch (err) {
      console.error('Failed to load my groups:', err);
    }
  }, []);

  useEffect(() => {
    async function initUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchMyGroups(user.id);
      }
    }
    initUser();
  }, [fetchMyGroups]);

  const handleGroupSuccess = (newGroupId: string, newGroupName: string) => {
    if (currentUserId) fetchMyGroups(currentUserId);
    setActiveGroup(newGroupId, newGroupName);
  };

  const handleGroupLeaveOrDelete = (deletedGroupId: string) => {
    if (currentUserId) fetchMyGroups(currentUserId);
    if (activeGroupId === deletedGroupId) {
      setActiveGroup(null, null);
    }
  };

  const handleOpenDetail = (e: React.MouseEvent, group: GroupItem) => {
    e.stopPropagation();
    setGroupToView(group);
    setModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-gray-200 bg-white/80 backdrop-blur-md scrollbar-none">
        {/* フォロー中（全体）タブ */}
        <button
          type="button"
          onClick={() => setActiveGroup(null, null)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition flex-shrink-0 ${
            activeGroupId === null
              ? 'bg-sky-500 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          フォロー中
        </button>

        {/* 参加中グループ一覧 */}
        {groups.map((group) => {
          const isActive = activeGroupId === group.id;
          return (
            <div
              key={group.id}
              onClick={() => setActiveGroup(group.id, group.name)}
              className={`group flex items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pl-3.5 pr-2 text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="truncate max-w-[120px]">{group.name}</span>
              <button
                type="button"
                onClick={(e) => handleOpenDetail(e, group)}
                className={`rounded-full p-0.5 transition ${
                  isActive
                    ? 'text-white/80 hover:bg-sky-600 hover:text-white'
                    : 'text-gray-400 hover:bg-gray-300 hover:text-gray-700'
                }`}
                title="グループ情報・招待コード"
                aria-label="グループ情報"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        {/* グループ追加ボタン */}
        <button
          type="button"
          onClick={() => {
            setGroupToView(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-500 transition hover:border-sky-400 hover:text-sky-600 flex-shrink-0"
          title="グループを作成または参加"
        >
          <Plus className="h-3.5 w-3.5" />
          グループ追加
        </button>
      </div>

      {/* グループ作成 / 参加 / 詳細モーダル */}
      <GroupModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setGroupToView(null);
        }}
        onSuccess={handleGroupSuccess}
        onLeaveOrDelete={handleGroupLeaveOrDelete}
        groupToView={groupToView}
        currentUserId={currentUserId}
      />
    </>
  );
}
