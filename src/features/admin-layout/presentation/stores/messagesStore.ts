import { create } from 'zustand';

interface MessagesState {
  unreadMessageCount: number;
  setUnreadMessageCount: (count: number) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  unreadMessageCount: 0,
  setUnreadMessageCount: (count) => set({ unreadMessageCount: count }),
}));
