import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useAuth } from "../hooks/useAuth";
import type { AppNotification } from "../services/api";
import {
  deleteNotification as deleteNotificationRequest,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { getUnreadNotificationCount } from "../utils/notifications";

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markManyAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const previewLimit = 24;

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const unreadCount = useMemo(() => getUnreadNotificationCount(notifications), [notifications]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getNotifications({
        limit: previewLimit,
        page: 1,
      });
      setNotifications(response.items);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    setNotifications((current) =>
      current.map((item) =>
        item._id === notificationId ? { ...item, isRead: true } : item,
      ),
    );
  }, []);

  const markManyAsRead = useCallback(async (notificationIds: string[]) => {
    const uniqueIds = Array.from(new Set(notificationIds));

    if (!uniqueIds.length) {
      return;
    }

    await Promise.all(uniqueIds.map((notificationId) => markNotificationAsRead(notificationId)));
    setNotifications((current) =>
      current.map((item) =>
        uniqueIds.includes(item._id) ? { ...item, isRead: true } : item,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await deleteNotificationRequest(notificationId);
    setNotifications((current) => current.filter((item) => item._id !== notificationId));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, refreshNotifications]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refreshNotifications,
      markAsRead,
      markManyAsRead,
      markAllAsRead,
      deleteNotification,
    }),
    [deleteNotification, isLoading, markAllAsRead, markAsRead, markManyAsRead, notifications, refreshNotifications, unreadCount],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
