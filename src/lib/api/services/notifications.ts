import { apiClient } from '@/lib/api/client';

export type NotificationType =
  | 'risk_approved'
  | 'risk_rejected'
  | 'risk_closed'
  | 'risk_submitted'
  | 'new_meeting'
  | 'new_action_item'
  | 'action_item_comment'
  | 'meeting_minutes';

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
  entityId?: string;
  entityModel?: string;
}

export interface NotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
}

export const notificationsService = {
  getNotifications: (userId: string) =>
    apiClient.get<{ success: boolean; data: NotificationsResult }>(
      `/notifications?userId=${userId}`
    ),

  markAsRead: (notificationId: string, userId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read?userId=${userId}`),

  markAllAsRead: (userId: string) =>
    apiClient.patch(`/notifications/read-all?userId=${userId}`),

  deleteNotification: (notificationId: string, userId: string) =>
    apiClient.delete(`/notifications/${notificationId}?userId=${userId}`),
};
