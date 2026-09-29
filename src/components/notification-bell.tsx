"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  Truck,
  CircleCheck,
  X,
} from "lucide-react";

type NotificationItem = {
  id: string;
  recipient_id: string;
  recipient_type:
    | "customer"
    | "delivery_partner"
    | "admin";
  type: string;
  title: string;
  message: string;
  order_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationBellProps = {
  recipientId: string;
  recipientType:
    | "customer"
    | "delivery_partner"
    | "admin";
};

export default function NotificationBell({
  recipientId,
  recipientType,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<
    NotificationItem[]
  >([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  async function loadNotifications() {
    if (!recipientId) return;

    try {
      setLoading(true);

      const response = await fetch(
        `/api/notifications?recipientId=${encodeURIComponent(
          recipientId,
        )}&recipientType=${encodeURIComponent(
          recipientType,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load notifications.",
        );
      }

      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error(
        "Notification loading error:",
        error,
      );
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(
    notificationId: string,
  ) {
    try {
      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to update notification.",
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error,
      );
    }
  }

  async function markAllAsRead() {
    if (!recipientId || unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch(
        "/api/notifications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            markAll: true,
            recipientId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to mark notifications as read.",
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error,
      );
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = window.setInterval(
      loadNotifications,
      15000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [recipientId, recipientType]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  function formatTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const now = new Date();
    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / 60000,
    );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  }

  function getNotificationIcon(type: string) {
    const normalizedType =
      type.toLowerCase();

    if (
      normalizedType.includes("delivery") ||
      normalizedType.includes("assigned")
    ) {
      return (
        <Truck className="h-4 w-4" />
      );
    }

    if (
      normalizedType.includes("delivered") ||
      normalizedType.includes("complete")
    ) {
      return (
        <CircleCheck className="h-4 w-4" />
      );
    }

    if (
      normalizedType.includes("order") ||
      normalizedType.includes("package")
    ) {
      return (
        <Package className="h-4 w-4" />
      );
    }

    return <Bell className="h-4 w-4" />;
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      {/* Notification button */}
      <button
        type="button"
        onClick={() =>
          setOpen((current) => !current)
        }
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-surface-2 hover:text-brand"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-[19px] w-[19px]" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="fixed left-3 right-3 top-[122px] z-50 w-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-slate-900">
                  Notifications
                </h3>

                {unreadCount > 0 && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-slate-400">
                Stay updated with your deliveries
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 hover:text-teal-700"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Mark all
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close notifications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading &&
            notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <Bell className="h-5 w-5 animate-pulse text-slate-400" />
                </div>

                <p className="text-sm font-medium text-slate-600">
                  Loading notifications...
                </p>
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Bell className="h-6 w-6 text-slate-400" />
                </div>

                <p className="text-sm font-semibold text-slate-800">
                  All caught up
                </p>

                <p className="mt-1 text-center text-xs text-slate-400">
                  You don't have any notifications
                  right now.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(
                  (notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        if (
                          !notification.is_read
                        ) {
                          markAsRead(
                            notification.id,
                          );
                        }
                      }}
                      className={`group relative flex w-full gap-3 px-4 py-3.5 text-left transition ${
                        notification.is_read
                          ? "bg-white hover:bg-slate-50"
                          : "bg-teal-50/40 hover:bg-teal-50/70"
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <span className="absolute left-0 top-0 h-full w-0.5 bg-teal-600" />
                      )}

                      {/* Icon */}
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          notification.is_read
                            ? "bg-slate-100 text-slate-500"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {getNotificationIcon(
                          notification.type,
                        )}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-5 ${
                              notification.is_read
                                ? "font-medium text-slate-700"
                                : "font-semibold text-slate-900"
                            }`}
                          >
                            {notification.title}
                          </p>

                          {!notification.is_read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-600" />
                          )}
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-400">
                            {formatTime(
                              notification.created_at,
                            )}
                          </span>

                          {notification.is_read && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Check className="h-3 w-3" />
                              Read
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2.5">
              <p className="text-center text-[11px] text-slate-400">
                Showing your latest{" "}
                {notifications.length}{" "}
                notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}