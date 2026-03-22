import { create } from 'zustand';

export interface NotificationItem {
  id: string;
  type: 'TEAM_REGISTERED' | 'PLAYER_REGISTERED' | 'PLAYER_AUTO_LINKED' | 'CONTACT_MESSAGE';
  message: string;
  read: boolean;
  createdAt: string;
  team?: { id: string; name: string; slug: string };
  player?: { id: string; firstName: string; lastName: string };
  staff?: { id: string; firstName: string; lastName: string };
  metadata?: any;
}

interface NotificationsState {
  notifications: NotificationItem[];
  unreadCount: number;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  dismissNotification: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  notificationsEnabled: true,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.length }),
  dismissNotification: (id) =>
    set((s) => {
      const notifications = s.notifications.filter((n) => n.id !== id);
      return { notifications, unreadCount: Math.max(0, s.unreadCount - 1) };
    }),
}));
