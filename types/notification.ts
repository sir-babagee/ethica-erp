export type NotificationType = "info" | "warning" | "success" | "error";
export type NotificationTargetType = "user" | "role" | "all";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  targetStaffId: string | null;
  targetRole: string | null;
  sentById: string | null;
  /** Internal metadata (e.g. applicationId) — not shown in the UI */
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
