import type { NextFunction, Response } from "express";

import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpError } from "../middleware/errorHandler";
import {
  countUnreadNotificationsForUser,
  deleteAllNotificationsForUser,
  deleteNotificationForUser,
  deleteNotificationsForUser,
  listNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationListTab,
} from "../services/notificationService";

const allowedTabs: NotificationListTab[] = ["all", "unread", "alerts", "resolved"];

const parseNotificationTab = (value: unknown): NotificationListTab => {
  if (typeof value === "string" && allowedTabs.includes(value as NotificationListTab)) {
    return value as NotificationListTab;
  }

  return "all";
};

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const requestedLimit = Number(req.query.limit || 12);
    const requestedPage = Number(req.query.page || 1);
    const notifications = await listNotificationsForUser(req.user.id, {
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
      limit: Number.isFinite(requestedLimit) ? requestedLimit : 12,
      tab: parseNotificationTab(req.query.tab),
      search: typeof req.query.search === "string" ? req.query.search : "",
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const notification = await markNotificationAsRead(String(req.params.id), req.user.id);

    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    const unreadCount = await countUnreadNotificationsForUser(req.user.id);

    res.json({
      success: true,
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const modifiedCount = await markAllNotificationsAsRead(req.user.id);

    res.json({
      success: true,
      data: {
        modifiedCount,
        unreadCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const notification = await deleteNotificationForUser(String(req.params.id), req.user.id);

    if (!notification) {
      throw new HttpError(404, "Notification not found");
    }

    const unreadCount = await countUnreadNotificationsForUser(req.user.id);

    res.json({
      success: true,
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSelectedNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const notificationIds = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
      : [];

    if (!notificationIds.length) {
      throw new HttpError(400, "Select at least one notification to delete");
    }

    const deletedCount = await deleteNotificationsForUser(notificationIds, req.user.id);
    const unreadCount = await countUnreadNotificationsForUser(req.user.id);

    res.json({
      success: true,
      data: {
        deletedCount,
        unreadCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAllNotifications = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new HttpError(401, "Authentication required");
    }

    const deletedCount = await deleteAllNotificationsForUser(req.user.id);

    res.json({
      success: true,
      data: {
        deletedCount,
        unreadCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
