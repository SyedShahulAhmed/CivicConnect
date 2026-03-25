import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiTrash2,
} from "react-icons/fi";

import Loader from "../components/Loader";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";
import { useToast } from "../hooks/useToast";
import type { AppNotification } from "../services/api";
import { extractApiError } from "../services/api";
import {
  deleteAllNotifications,
  deleteNotification,
  deleteSelectedNotifications,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import {
  formatNotificationTime,
  getNotificationDestination,
  getUnreadNotificationCount,
  notificationTabs,
  notificationTypeMeta,
  type NotificationTab,
} from "../utils/notifications";

const pageSize = 12;

const tabClassName = (isActive: boolean) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-civic-blue text-white shadow-sm"
      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
  }`;

const NotificationHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<NotificationTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getNotifications({
        page,
        limit: pageSize,
        search,
        tab,
      });

      setNotifications(response.items);
      setTotal(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      setUnreadTotal(response.unreadCount);
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not load notifications",
        message: extractApiError(error),
      });
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, showToast, tab]);

  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  useEffect(() => {
    setSelectedIds([]);
  }, [page, search, tab]);

  useEffect(() => {
    let isMounted = true;

    const timeoutId = window.setTimeout(() => {
      if (isMounted) {
        void loadNotifications();
      }
    }, 150);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [loadNotifications]);

  const visibleUnreadCount = useMemo(
    () => getUnreadNotificationCount(notifications),
    [notifications],
  );
  const selectedUnreadCount = useMemo(
    () => notifications.filter((item) => selectedIds.includes(item._id) && !item.isRead).length,
    [notifications, selectedIds],
  );
  const allVisibleSelected = useMemo(
    () => notifications.length > 0 && notifications.every((item) => selectedIds.includes(item._id)),
    [notifications, selectedIds],
  );

  const toggleSelection = (notificationId: string) => {
    setSelectedIds((current) =>
      current.includes(notificationId)
        ? current.filter((item) => item !== notificationId)
        : [...current, notificationId],
    );
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !notifications.some((item) => item._id === id));
      }

      const merged = new Set([...current, ...notifications.map((item) => item._id)]);
      return Array.from(merged);
    });
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    setActiveNotificationId(notification._id);

    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id);
        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadTotal((current) => Math.max(0, current - 1));
        await refreshNotifications();
      }

      navigate(getNotificationDestination(notification, user?.role));
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not open notification",
        message: extractApiError(error),
      });
    } finally {
      setActiveNotificationId(null);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setActiveNotificationId(notificationId);

    try {
      await markNotificationAsRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadTotal((current) => Math.max(0, current - 1));
      await refreshNotifications();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not update notification",
        message: extractApiError(error),
      });
    } finally {
      setActiveNotificationId(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setActiveNotificationId(notificationId);

    try {
      const target = notifications.find((item) => item._id === notificationId);
      await deleteNotification(notificationId);
      setNotifications((current) => current.filter((item) => item._id !== notificationId));
      setSelectedIds((current) => current.filter((item) => item !== notificationId));
      if (target && !target.isRead) {
        setUnreadTotal((current) => Math.max(0, current - 1));
      }
      await refreshNotifications();
      await loadNotifications();
      showToast({
        tone: "success",
        title: "Notification deleted",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not delete notification",
        message: extractApiError(error),
      });
    } finally {
      setActiveNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsBulkUpdating(true);

    try {
      await markAllNotificationsAsRead();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadTotal(0);
      await refreshNotifications();
      showToast({
        tone: "success",
        title: "All notifications marked as read",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not update notifications",
        message: extractApiError(error),
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) {
      return;
    }

    setIsBulkUpdating(true);

    try {
      await deleteSelectedNotifications(selectedIds);
      setNotifications((current) => current.filter((item) => !selectedIds.includes(item._id)));
      setUnreadTotal((current) => Math.max(0, current - selectedUnreadCount));
      setSelectedIds([]);
      await refreshNotifications();
      await loadNotifications();
      showToast({
        tone: "success",
        title: "Selected notifications deleted",
        message: `${selectedIds.length} notifications were removed.`,
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not delete selected notifications",
        message: extractApiError(error),
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!total) {
      return;
    }

    setIsBulkUpdating(true);

    try {
      await deleteAllNotifications();
      setNotifications([]);
      setSelectedIds([]);
      setUnreadTotal(0);
      setTotal(0);
      setTotalPages(1);
      setPage(1);
      await refreshNotifications();
      showToast({
        tone: "success",
        title: "All notifications deleted",
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not delete notifications",
        message: extractApiError(error),
      });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-14">
      <div className="rounded-[2.5rem] border border-slate-200 bg-[var(--panel)] p-6 shadow-soft dark:border-slate-800 lg:p-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to={user?.role === "admin" ? "/admin" : "/dashboard"}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <FiArrowLeft size={16} />
              Back to dashboard
            </Link>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Notification Center</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">Monitor every alert, update, and resolution</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              Review your full notification history, search past events, and clear what you have already handled.
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:min-w-[18rem]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Unread total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{unreadTotal}</p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {total} notifications in the last 30 days.
            </p>
            <button
              type="button"
              onClick={() => void handleMarkAllAsRead()}
              disabled={isBulkUpdating || unreadTotal === 0}
              className="rounded-full bg-civic-blue px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBulkUpdating ? "Updating..." : "Mark all as read"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <FiSearch className="text-slate-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or message"
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {notificationTabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={tabClassName(tab === item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <label className="inline-flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                disabled={!notifications.length || isLoading}
                className="h-4 w-4 rounded border-slate-300 text-civic-blue focus:ring-civic-blue/30"
              />
              Select page
            </label>
            <p>{visibleUnreadCount} unread on this page</p>
            <p>{selectedIds.length} selected</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDeleteSelected()}
              disabled={isBulkUpdating || selectedIds.length === 0}
              className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-slate-950 dark:text-rose-300"
            >
              Delete selected
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteAll()}
              disabled={isBulkUpdating || total === 0}
              className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete all
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <p>Page {page} of {totalPages}</p>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <Loader label="Loading notification history..." className="min-h-[40vh]" />
          ) : notifications.length ? (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const meta = notificationTypeMeta[notification.type];
                const Icon = meta.icon;
                const isBusy = activeNotificationId === notification._id;
                const isSelected = selectedIds.includes(notification._id);

                return (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => void handleOpenNotification(notification)}
                    className={`w-full rounded-[1.75rem] border p-5 text-left transition ${
                      notification.isRead
                        ? "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                        : `${meta.accentClassName} shadow-sm`
                    } ${isSelected ? "ring-2 ring-civic-blue/20" : ""}`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <label
                          className="mt-1 inline-flex items-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelection(notification._id)}
                            className="h-4 w-4 rounded border-slate-300 text-civic-blue focus:ring-civic-blue/30"
                            aria-label={`Select notification ${notification.title}`}
                          />
                        </label>
                        <div className={`rounded-2xl p-3 ${meta.iconClassName}`}>
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </p>
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badgeClassName}`}>
                              {meta.label}
                            </span>
                            {!notification.isRead ? (
                              <span className="rounded-full bg-civic-teal px-2.5 py-1 text-[11px] font-semibold text-white">
                                Unread
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            {notification.message}
                          </p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            {formatNotificationTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {!notification.isRead ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleMarkAsRead(notification._id);
                            }}
                            disabled={isBusy || isBulkUpdating}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiCheck size={14} />
                              Mark read
                            </span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDelete(notification._id);
                          }}
                          disabled={isBusy || isBulkUpdating}
                          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-slate-950 dark:text-rose-300"
                        >
                          <span className="inline-flex items-center gap-2">
                            <FiTrash2 size={14} />
                            Delete
                          </span>
                        </button>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 px-6 py-16 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No notifications found for this filter.
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {(page - 1) * pageSize + (notifications.length ? 1 : 0)}-
            {(page - 1) * pageSize + notifications.length} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <span className="inline-flex items-center gap-2">
                <FiChevronLeft size={14} />
                Previous
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <span className="inline-flex items-center gap-2">
                Next
                <FiChevronRight size={14} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotificationHistory;
