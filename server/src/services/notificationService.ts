import type { FilterQuery, Types } from "mongoose";

import { NotificationModel, type NotificationType } from "../models/Notification";
import { UserModel } from "../models/User";

export type NotificationListTab = "all" | "unread" | "alerts" | "resolved";

interface NotificationListOptions {
  page?: number;
  limit?: number;
  tab?: NotificationListTab;
  search?: string;
}

interface NotificationPayload {
  _id: string;
  complaintId?: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const notificationRetentionWindowMs = 30 * 24 * 60 * 60 * 1000;
const alertNotificationTypes: NotificationType[] = ["sla_warning", "complaint_created", "admin_message"];
const slaAlertPattern = /(sla|overdue|deadline|violation)/i;
const resolvedPattern = /(resolved|closed|issue resolved|status resolved)/i;
const complaintCreatedPattern = /(new complaint submitted|complaint submitted|new complaint)/i;

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const cleanupExpiredNotificationsForUser = async (userId: string) => {
  const cutoff = new Date(Date.now() - notificationRetentionWindowMs);
  await NotificationModel.deleteMany({
    userId,
    createdAt: { $lt: cutoff },
  });
};

const inferNotificationType = ({
  title,
  message,
  type,
}: {
  title: string;
  message: string;
  type?: NotificationType;
}): NotificationType => {
  if (type && type !== "status_updated") {
    return type;
  }

  const content = `${title} ${message}`;

  if (slaAlertPattern.test(content)) {
    return "sla_warning";
  }

  if (resolvedPattern.test(content)) {
    return "resolved";
  }

  if (complaintCreatedPattern.test(content)) {
    return "complaint_created";
  }

  return type || "status_updated";
};

const serializeNotification = (notification: {
  _id: unknown;
  complaintId?: unknown;
  title: string;
  message: string;
  type?: NotificationType;
  read?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}): NotificationPayload => ({
  _id: String(notification._id),
  complaintId: notification.complaintId == null ? undefined : String(notification.complaintId),
  title: notification.title,
  message: notification.message,
  type: inferNotificationType(notification),
  isRead: Boolean(notification.read),
  createdAt: new Date(notification.createdAt).toISOString(),
  updatedAt: new Date(notification.updatedAt).toISOString(),
});

const buildNotificationQuery = (
  userId: string,
  { tab = "all", search = "" }: Pick<NotificationListOptions, "tab" | "search">,
): FilterQuery<any> => {
  const normalizedSearch = search.trim();
  const conditions: FilterQuery<any>[] = [{ userId }];

  if (tab === "unread") {
    conditions.push({ read: false });
  } else if (tab === "alerts") {
    conditions.push({
      $or: [
        { type: { $in: alertNotificationTypes } },
        { title: { $regex: slaAlertPattern } },
        { message: { $regex: slaAlertPattern } },
      ],
    });
  } else if (tab === "resolved") {
    conditions.push({
      $or: [
        { type: "resolved" },
        { title: { $regex: resolvedPattern } },
        { message: { $regex: resolvedPattern } },
      ],
    });
  }

  if (normalizedSearch) {
    const pattern = escapeRegex(normalizedSearch);
    conditions.push({
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { message: { $regex: pattern, $options: "i" } },
      ],
    });
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
};

export const createComplaintStatusNotification = async ({
  userId,
  complaintId,
  title,
  message,
  type = "status_updated",
}: {
  userId: string | Types.ObjectId;
  complaintId?: string | Types.ObjectId;
  title: string;
  message: string;
  type?: NotificationType;
}) => {
  return NotificationModel.create({
    userId,
    complaintId,
    title,
    message,
    type,
    read: false,
  });
};

const createNotificationsForAdmins = async ({
  complaintId,
  title,
  message,
  type,
}: {
  complaintId?: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
}) => {
  const admins = await UserModel.find({ role: "admin" }).select("_id").lean();

  if (!admins.length) {
    return [];
  }

  return NotificationModel.insertMany(
    admins.map((admin) => ({
      userId: admin._id,
      complaintId,
      title,
      message,
      type,
      read: false,
    })),
  );
};

export const notifyAdminsAboutNewComplaint = async ({
  complaintId,
  complaintTitle,
  complaintAddress,
  complaintIdLabel,
}: {
  complaintId: string | Types.ObjectId;
  complaintTitle: string;
  complaintAddress: string;
  complaintIdLabel: string;
}) => {
  return createNotificationsForAdmins({
    complaintId,
    title: "New complaint submitted",
    message: `A new complaint '${complaintTitle}' (${complaintIdLabel}) was submitted for ${complaintAddress}.`,
    type: "complaint_created",
  });
};

export const notifyAdminsAboutSlaViolation = async ({
  complaintId,
  complaintTitle,
  complaintIdLabel,
  department,
  deadline,
}: {
  complaintId: string | Types.ObjectId;
  complaintTitle: string;
  complaintIdLabel: string;
  department: string;
  deadline: Date;
}) => {
  return createNotificationsForAdmins({
    complaintId,
    title: "SLA violation alert",
    message: `Complaint '${complaintTitle}' (${complaintIdLabel}) assigned to ${department} is overdue since ${deadline.toLocaleString()}.`,
    type: "sla_warning",
  });
};

export const listNotificationsForUser = async (
  userId: string,
  { page = 1, limit = 12, tab = "all", search = "" }: NotificationListOptions = {},
) => {
  await cleanupExpiredNotificationsForUser(userId);

  const safePage = Number.isFinite(page) ? Math.max(1, page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 12;
  const skip = (safePage - 1) * safeLimit;
  const query = buildNotificationQuery(userId, { tab, search });

  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    NotificationModel.countDocuments(query),
    NotificationModel.countDocuments({ userId, read: false }),
  ]);

  return {
    items: items.map(serializeNotification),
    unreadCount,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
};

export const countUnreadNotificationsForUser = async (userId: string) => {
  await cleanupExpiredNotificationsForUser(userId);
  return NotificationModel.countDocuments({ userId, read: false });
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true },
  ).lean();

  return notification ? serializeNotification(notification) : null;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const result = await NotificationModel.updateMany(
    { userId, read: false },
    { $set: { read: true } },
  );

  return result.modifiedCount;
};

export const deleteNotificationForUser = async (notificationId: string, userId: string) => {
  const notification = await NotificationModel.findOneAndDelete({
    _id: notificationId,
    userId,
  }).lean();

  return notification ? serializeNotification(notification) : null;
};

export const deleteNotificationsForUser = async (notificationIds: string[], userId: string) => {
  const uniqueIds = Array.from(new Set(notificationIds.filter(Boolean)));

  if (!uniqueIds.length) {
    return 0;
  }

  const result = await NotificationModel.deleteMany({
    _id: { $in: uniqueIds },
    userId,
  });

  return result.deletedCount || 0;
};

export const deleteAllNotificationsForUser = async (userId: string) => {
  const result = await NotificationModel.deleteMany({ userId });
  return result.deletedCount || 0;
};
