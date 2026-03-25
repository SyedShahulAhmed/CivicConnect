import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Loader from "../Loader";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import {
  filterNotifications,
  formatNotificationTime,
  getNotificationDestination,
  groupNotifications,
  notificationTabs,
  notificationTypeMeta,
  type NotificationGroup,
  type NotificationTab,
} from "../../utils/notifications";

interface NotificationDropdownProps {
  onClose: () => void;
}

const tabClassName = (isActive: boolean) =>
  `rounded-full px-3 py-2 text-xs font-semibold transition ${
    isActive
      ? "bg-civic-blue text-white"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
  }`;

const NotificationDropdown = ({ onClose }: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAllAsRead,
    markManyAsRead,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");

  const filteredNotifications = useMemo(
    () => filterNotifications(notifications, activeTab),
    [activeTab, notifications],
  );
  const groupedNotifications = useMemo(
    () => groupNotifications(filteredNotifications),
    [filteredNotifications],
  );

  const handleOpenGroup = async (group: NotificationGroup) => {
    const unreadIds = group.items
      .filter((item) => !item.isRead)
      .map((item) => item._id);

    if (unreadIds.length) {
      await markManyAsRead(unreadIds);
    }

    onClose();
    navigate(getNotificationDestination(group.items[0], user?.role));
  };

  return (
    <div className="absolute right-0 mt-3 w-[min(28rem,calc(100vw-2rem))] rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-2 pb-4 dark:border-slate-800">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Track complaint activity, SLA alerts, and admin updates.
          </p>
        </div>
        {unreadCount ? (
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Mark all read
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 px-1">
        {notificationTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={tabClassName(activeTab === tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto pr-1">
        {isLoading ? (
          <Loader label="Loading notifications..." className="py-12" />
        ) : groupedNotifications.length ? (
          groupedNotifications.map((group) => {
            const meta = notificationTypeMeta[group.type];
            const Icon = meta.icon;

            return (
              <button
                key={group.key}
                type="button"
                onClick={() => void handleOpenGroup(group)}
                className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                  group.isRead
                    ? "border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950"
                    : `${meta.accentClassName} shadow-sm`
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 rounded-2xl p-2 ${meta.iconClassName}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {group.title}
                          </p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClassName}`}>
                            {meta.label}
                          </span>
                          {group.count > 1 ? (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-900">
                              {group.count}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {group.previewMessage}
                        </p>
                      </div>
                      {!group.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-civic-teal" /> : null}
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {formatNotificationTime(group.latestCreatedAt)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No notifications match this filter right now.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 px-2 pt-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {unreadCount ? `${unreadCount} unread` : "All caught up"}
        </p>
        <Link
          to="/notifications"
          onClick={onClose}
          className="rounded-full bg-civic-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;
