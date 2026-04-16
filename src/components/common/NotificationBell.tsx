'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { AppNotification, NotificationType } from '@/lib/api/services/notifications';

// ─── Icon map per notification type ─────────────────────────────────────────

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  risk_approved: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </span>
  ),
  risk_rejected: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </span>
  ),
  risk_closed: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </span>
  ),
  risk_submitted: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </span>
  ),
  new_meeting: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100">
      <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </span>
  ),
  new_action_item: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100">
      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    </span>
  ),
  action_item_comment: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100">
      <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </span>
  ),
  meeting_minutes: (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100">
      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </span>
  ),
};

// ─── Time formatting ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Notification row ────────────────────────────────────────────────────────

const NotificationRow: React.FC<{
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate: (link: string, id: string) => void;
}> = ({ notification, onRead, onDelete, onNavigate }) => (
  <div
    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 group relative ${
      !notification.read ? 'bg-blue-50/40' : ''
    }`}
    onClick={() => onNavigate(notification.link, notification._id)}
  >
    {/* Unread dot */}
    {!notification.read && (
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D4A72C]" />
    )}

    {TYPE_ICON[notification.type]}

    <div className="flex-1 min-w-0">
      <p className={`text-sm leading-snug ${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
        {notification.title}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
      <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
    </div>

    {/* Actions revealed on hover */}
    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
      {!notification.read && (
        <button
          title="Mark as read"
          onClick={(e) => { e.stopPropagation(); onRead(notification._id); }}
          className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
      )}
      <button
        title="Delete"
        onClick={(e) => { e.stopPropagation(); onDelete(notification._id); }}
        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavigate = (link: string, id: string) => {
    markAsRead(id);
    setOpen(false);
    router.push(link);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Notifications"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="sm:w-5 sm:h-5">
          <path
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-5-5.96V4a1 1 0 10-2 0v1.04C6.64 5.36 5 7.92 5 11v3.159c0 .538-.214 1.055-.595 1.436L3 17h5m7 0v1a3 3 0 11-6 0v-1m6 0H9"
            stroke="#D4A72C"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#2a9d8f] font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-[#D4A72C] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11c0-3.07-1.64-5.64-5-5.96V4a1 1 0 10-2 0v1.04C6.64 5.36 5 7.92 5 11v3.159c0 .538-.214 1.055-.595 1.436L3 17h5m7 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">All caught up</p>
                <p className="text-xs text-gray-400 mt-0.5">No notifications yet</p>
              </div>
            )}

            {!loading &&
              notifications.map((n) => (
                <NotificationRow
                  key={n._id}
                  notification={n}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onNavigate={handleNavigate}
                />
              ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-center">
              <span className="text-xs text-gray-400">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
