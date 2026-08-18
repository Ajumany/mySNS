'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type PostModalContextType = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
};

const PostModalContext = createContext<PostModalContextType | undefined>(undefined);

export function PostModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <PostModalContext.Provider
      value={{
        isOpen,
        openModal: () => setIsOpen(true),
        closeModal: () => setIsOpen(false),
        refreshKey,
        triggerRefresh,
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