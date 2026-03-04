"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ErrorLogStaff = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type ErrorLog = {
  id: string;
  errorName: string | null;
  errorMessage: string;
  errorStack: string | null;
  digest: string | null;
  url: string | null;
  userAgent: string | null;
  staffId: string | null;
  staff: ErrorLogStaff | null;
  metadata: Record<string, unknown> | null;
  isResolved: boolean;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
};

export type ErrorLogsPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ErrorLogsResponse = {
  message: string;
  data: {
    logs: ErrorLog[];
    pagination: ErrorLogsPagination;
  };
};

export type ErrorLogResponse = {
  message: string;
  data: ErrorLog;
};

export type ErrorLogsFilters = {
  isResolved?: "true" | "false" | "";
  staffId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type CreateErrorLogPayload = {
  errorName?: string;
  errorMessage: string;
  errorStack?: string;
  digest?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useErrorLogs(filters: ErrorLogsFilters) {
  return useQuery({
    queryKey: ["error-logs", filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (filters.isResolved !== undefined && filters.isResolved !== "")
        params.isResolved = filters.isResolved;
      if (filters.staffId) params.staffId = filters.staffId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const res = await api.get<ErrorLogsResponse>("/api/proxy/error-logs", {
        params,
      });
      return res.data.data;
    },
  });
}

export function useErrorLog(id: string | null) {
  return useQuery({
    queryKey: ["error-logs", id],
    queryFn: async () => {
      const res = await api.get<ErrorLogResponse>(
        `/api/proxy/error-logs/${id}`
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useResolveErrorLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/proxy/error-logs/${id}/resolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["error-logs"] });
    },
  });
}

export function useUnresolveErrorLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/api/proxy/error-logs/${id}/unresolve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["error-logs"] });
    },
  });
}

/** Fire-and-forget — used by the error boundary. Swallows its own errors. */
export async function reportErrorToServer(
  payload: CreateErrorLogPayload
): Promise<void> {
  try {
    await api.post("/api/proxy/error-logs", payload);
  } catch {
    // Never throw from the error reporter — that would cause an infinite loop.
  }
}
