"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/services/notifications";
import type { Notification } from "@/services/notifications";

// ─── Icons ────────────────────────────────────────────────────────────────────

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeStyles: Record<string, string> = {
  success: "border-l-emerald-500 bg-emerald-50/50",
  info: "border-l-sky-500 bg-sky-50/50",
  warning: "border-l-amber-500 bg-amber-50/50",
  error: "border-l-red-500 bg-red-50/50",
};

const typeIcons: Record<string, string> = {
  success: "✓",
  info: "ℹ",
  warning: "⚠",
  error: "✕",
};

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="animate-pulse border-l-4 border-l-gray-200 px-6 py-4">
      <div className="flex gap-3">
        <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded bg-gray-200" />
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-1/4 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotificationRow({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  return (
    <div
      className={`cursor-pointer border-l-4 px-6 py-4 transition-colors hover:bg-gray-50/80 ${
        typeStyles[notification.type] ?? typeStyles.info
      } ${!notification.isRead ? "opacity-100" : "opacity-60"}`}
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
      }}
    >
      <div className="flex gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 text-sm shadow-sm">
          {typeIcons[notification.type] ?? "ℹ"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-medium text-gray-900 ${!notification.isRead ? "" : "font-normal"}`}
            >
              {notification.title}
            </p>
            {!notification.isRead && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
            {notification.message}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            {timeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data, isLoading } = useNotifications(1, 20);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.data ?? [];
  const hasUnread = unreadCount > 0;

  function handleOpen() {
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleMarkOne(id: string) {
    markAsRead.mutate(id);
  }

  function handleMarkAll() {
    markAllAsRead.mutate(undefined, { onSuccess: () => setIsOpen(false) });
  }

  return (
    <>
      {/* Bell trigger */}
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-label="Open notifications"
      >
        <BellIcon className="h-5 w-5" />
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
            <p className="text-xs text-gray-500">
              {hasUnread ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close notifications"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <BellIcon className="h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-500">No notifications yet</p>
              <p className="text-sm text-gray-400">
                You&apos;ll see updates here when activity occurs.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={handleMarkOne}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-3">
            <button
              onClick={handleMarkAll}
              disabled={!hasUnread || markAllAsRead.isPending}
              className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markAllAsRead.isPending ? "Marking…" : "Mark all as read"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
