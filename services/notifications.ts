"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Notification, NotificationsResponse } from "@/types";

const QUERY_KEY = "notifications";

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: async () => {
      const res = await api.get<NotificationsResponse>(
        "/api/proxy/notifications",
        { params: { page, limit } }
      );
      return res.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [QUERY_KEY, "unread-count"],
    queryFn: async () => {
      const res = await api.get<{ count: number }>(
        "/api/proxy/notifications/unread-count"
      );
      return res.data.count;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/api/proxy/notifications/${notificationId}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/api/proxy/notifications/read-all"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export type { Notification };
