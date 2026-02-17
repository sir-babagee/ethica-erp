"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivityLogStaff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type ActivityLog = {
  id: string;
  staffId: string;
  action: string;
  category: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  staff: ActivityLogStaff;
};

export type ActivityLogsPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ActivityLogsResponse = {
  message: string;
  data: {
    logs: ActivityLog[];
    pagination: ActivityLogsPagination;
  };
};

export type ActivityLogsFilters = {
  staffId?: string;
  staffRole?: string;
  action?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useActivityLogs(filters: ActivityLogsFilters) {
  return useQuery({
    queryKey: ["activity-logs", filters],
    queryFn: async () => {
      // Only include truthy values in the params object
      const params: Record<string, string | number> = {};
      if (filters.staffId)   params.staffId   = filters.staffId;
      if (filters.staffRole) params.staffRole = filters.staffRole;
      if (filters.action)    params.action    = filters.action;
      if (filters.category)  params.category  = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      if (filters.page)      params.page      = filters.page;
      if (filters.limit)     params.limit     = filters.limit;

      const res = await api.get<ActivityLogsResponse>(
        "/api/proxy/activity-logs",
        { params }
      );
      return res.data.data;
    },
  });
}
