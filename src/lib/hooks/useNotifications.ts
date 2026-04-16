'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { notificationsService, AppNotification } from '@/lib/api/services/notifications';
import { useAuth } from '@/lib/auth/AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_URL || '';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<import('socket.io-client').Socket | null>(null);
  const fetchedRef = useRef(false);
  /** Tracks IDs already in state so socket duplicates don't inflate the badge */
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationsService.getNotifications(user.id);
      if (res.data?.success && res.data.data) {
        const { notifications: fetched, unreadCount: count } = res.data.data;
        seenIdsRef.current = new Set(fetched.map((n) => n._id));
        setNotifications(fetched);
        setUnreadCount(count);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    if (!user?.id || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchNotifications();
  }, [user?.id, fetchNotifications]);

  // Socket.io real-time updates
  useEffect(() => {
    if (!user?.id || !SOCKET_URL) return;

    let socket: import('socket.io-client').Socket;

    const connect = async () => {
      const { io } = await import('socket.io-client');
      socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('joinRoom', user.id);
      });

      socket.on('notification', (incoming: AppNotification) => {
        // Skip if this ID was already delivered via the initial fetch or a prior socket event
        if (seenIdsRef.current.has(incoming._id)) return;
        seenIdsRef.current.add(incoming._id);
        setNotifications((prev) => [incoming, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    };

    connect();

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;
      await notificationsService.markAsRead(notificationId, user.id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [user?.id]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    await notificationsService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [user?.id]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user?.id) return;
      const wasUnread = notifications.find((n) => n._id === notificationId && !n.read);
      await notificationsService.deleteNotification(notificationId, user.id);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    },
    [user?.id, notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
