import type { AppNotification } from "./api";
import api from "./api";
import type { NotificationTab } from "../utils/notifications";

export interface NotificationListParams {
  page?: number;
  limit?: number;
  tab?: NotificationTab;
  search?: string;
}

export interface NotificationListResult {
  items: AppNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface NotificationApiResponse {
  data: NotificationListResult;
}

export const getNotifications = async (params: NotificationListParams = {}) => {
  const response = await api.get<NotificationApiResponse>("/notifications", {
    params,
  });

  return response.data.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  await api.patch(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async () => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (notificationId: string) => {
  await api.delete(`/notifications/${notificationId}`);
};

export const deleteSelectedNotifications = async (ids: string[]) => {
  await api.delete("/notifications/selected", {
    data: { ids },
  });
};

export const deleteAllNotifications = async () => {
  await api.delete("/notifications");
};
