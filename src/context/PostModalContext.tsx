'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type PostModalContextType = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
  activeGroupId: string | null;
  activeGroupName: string | null;
  setActiveGroup: (id: string | null, name: string | null) => void;
};

const PostModalContext = createContext<PostModalContextType | undefined>(undefined);

export function PostModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const setActiveGroup = (id: string | null, name: string | null) => {
    setActiveGroupId(id);
    setActiveGroupName(name);
  };

  return (
    <PostModalContext.Provider
      value={{
        isOpen,
        openModal: () => setIsOpen(true),
        closeModal: () => setIsOpen(false),
        refreshKey,
        triggerRefresh,
        activeGroupId,
        activeGroupName,
        setActiveGroup,
      }}
    >
      {children}
    </PostModalContext.Provider>
  );
}

export const usePostModal = () => {
  const context = useContext(PostModalContext);
  if (!context) {
    throw new Error('usePostModal must be used within a PostModalProvider');
  }
  return context;
};