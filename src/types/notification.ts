export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationPayload {
  id?: string;
  title?: string;
  content?: string;
  read?: boolean;
  isRead?: boolean;
  createdAt?: string;
}
