import type { IconType } from "react-icons";
import {
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiClipboard,
  FiEdit3,
  FiMessageSquare,
} from "react-icons/fi";

import type { AppNotification, NotificationType, UserRole } from "../services/api";

export type NotificationTab = "all" | "unread" | "alerts" | "resolved";

export interface NotificationGroup {
  key: string;
  type: NotificationType;
  count: number;
  title: string;
  previewMessage: string;
  messages: string[];
  latestCreatedAt: string;
  complaintId?: string;
  isRead: boolean;
  items: AppNotification[];
}

export interface NotificationTypeMeta {
  label: string;
  icon: IconType;
  accentClassName: string;
  badgeClassName: string;
  iconClassName: string;
}

export const notificationTypeMeta: Record<NotificationType, NotificationTypeMeta> = {
  complaint_created: {
    label: "Created",
    icon: FiClipboard,
    accentClassName: "border-sky-200 bg-sky-50 hover:border-sky-300 dark:border-sky-900/60 dark:bg-sky-950/30",
    badgeClassName: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200",
    iconClassName: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-200",
  },
  status_updated: {
    label: "Update",
    icon: FiEdit3,
    accentClassName: "border-blue-200 bg-blue-50 hover:border-blue-300 dark:border-blue-900/60 dark:bg-blue-950/30",
    badgeClassName: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
    iconClassName: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200",
  },
  sla_warning: {
    label: "Alert",
    icon: FiAlertTriangle,
    accentClassName: "border-rose-200 bg-rose-50 hover:border-rose-300 dark:border-rose-900/60 dark:bg-rose-950/30",
    badgeClassName: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200",
    iconClassName: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200",
  },
  resolved: {
    label: "Resolved",
    icon: FiCheckCircle,
    accentClassName: "border-emerald-200 bg-emerald-50 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/30",
    badgeClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
    iconClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  admin_message: {
    label: "Message",
    icon: FiMessageSquare,
    accentClassName: "border-violet-200 bg-violet-50 hover:border-violet-300 dark:border-violet-900/60 dark:bg-violet-950/30",
    badgeClassName: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200",
    iconClassName: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200",
  },
};

export const formatNotificationTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const alertNotificationTypes: NotificationType[] = [
  "sla_warning",
  "complaint_created",
  "admin_message",
];
const slaAlertPattern = /(sla|overdue|deadline|violation)/i;
const resolvedPattern = /(resolved|closed|issue resolved|status resolved)/i;

const isAlertNotification = (notification: AppNotification) => {
  if (alertNotificationTypes.includes(notification.type)) {
    return true;
  }

  return slaAlertPattern.test(`${notification.title} ${notification.message}`);
};

const isResolvedNotification = (notification: AppNotification) => {
  if (notification.type === "resolved") {
    return true;
  }

  return resolvedPattern.test(`${notification.title} ${notification.message}`);
};

export const filterNotifications = (notifications: AppNotification[], tab: NotificationTab) =>
  notifications.filter((notification) => {
    if (tab === "unread") {
      return !notification.isRead;
    }

    if (tab === "alerts") {
      return isAlertNotification(notification);
    }

    if (tab === "resolved") {
      return isResolvedNotification(notification);
    }

    return true;
  });

const shouldGroupNotification = (notification: AppNotification) => notification.type === "status_updated";

const createGroupTitle = (notifications: AppNotification[]) => {
  const [latest] = notifications;

  if (!latest) {
    return "Notification";
  }

  if (notifications.length === 1) {
    return latest.title;
  }

  switch (latest.type) {
    case "status_updated":
      return `${notifications.length} updates on your complaint`;
    case "resolved":
      return `${notifications.length} complaints resolved`;
    case "complaint_created":
      return `${notifications.length} new complaints created`;
    case "sla_warning":
      return `${notifications.length} SLA alerts`;
    case "admin_message":
      return `${notifications.length} admin messages`;
    default:
      return latest.title;
  }
};

const createGroupPreviewMessage = (notifications: AppNotification[]) => {
  const [latest] = notifications;

  if (!latest) {
    return "";
  }

  if (notifications.length === 1) {
    return latest.message;
  }

  switch (latest.type) {
    case "status_updated":
      return "We grouped similar status changes so you can review the latest complaint activity faster.";
    case "resolved":
      return "Multiple complaints were marked resolved recently.";
    case "sla_warning":
      return "Several SLA warnings need timely attention.";
    case "complaint_created":
      return "Multiple new complaint submissions came in recently.";
    case "admin_message":
      return "You have several messages from the administration team.";
    default:
      return latest.message;
  }
};

export const groupNotifications = (notifications: AppNotification[]): NotificationGroup[] => {
  const grouped = new Map<string, AppNotification[]>();

  notifications.forEach((notification) => {
    const key = shouldGroupNotification(notification)
      ? `${notification.type}:${notification.complaintId || "general"}`
      : notification._id;
    const existing = grouped.get(key) || [];
    existing.push(notification);
    grouped.set(key, existing);
  });

  return Array.from(grouped.entries())
    .map(([key, items]) => {
      const sortedItems = items
        .slice()
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
      const [latest] = sortedItems;

      return {
        key,
        type: latest.type,
        count: sortedItems.length,
        title: createGroupTitle(sortedItems),
        previewMessage: createGroupPreviewMessage(sortedItems),
        messages: sortedItems.map((item) => item.message),
        latestCreatedAt: latest.createdAt,
        complaintId: latest.complaintId,
        isRead: sortedItems.every((item) => item.isRead),
        items: sortedItems,
      } satisfies NotificationGroup;
    })
    .sort((left, right) => new Date(right.latestCreatedAt).getTime() - new Date(left.latestCreatedAt).getTime());
};

export const getNotificationDestination = (notification: Pick<AppNotification, "complaintId">, role: UserRole = "citizen") => {
  if (notification.complaintId) {
    return `/complaints/${notification.complaintId}`;
  }

  return role === "admin" ? "/admin" : "/dashboard";
};

export const getUnreadNotificationCount = (notifications: AppNotification[]) => notifications.filter((notification) => !notification.isRead).length;

export const notificationTabs: Array<{ key: NotificationTab; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "alerts", label: "Alerts" },
  { key: "resolved", label: "Resolved" },
];

export const emptyStateIcon = FiBell;
