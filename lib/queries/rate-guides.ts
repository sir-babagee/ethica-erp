"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  RateGuide,
  CreateRateGuidePayload,
  UpdateRateGuidePayload,
  BulkReplaceRateGuidesPayload,
} from "@/types";

const QUERY_KEY = "rate-guides";

export function useRateGuides() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await api.get<RateGuide[]>("/api/proxy/rate-guides");
      return res.data;
    },
  });
}

export function useCreateRateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRateGuidePayload) =>
      api
        .post<RateGuide>("/api/proxy/rate-guides", payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useUpdateRateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRateGuidePayload }) =>
      api
        .patch<RateGuide>(`/api/proxy/rate-guides/${id}`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeleteRateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/api/proxy/rate-guides/${id}`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useBulkReplaceRateGuides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkReplaceRateGuidesPayload) =>
      api
        .post<{ inserted: number }>("/api/proxy/rate-guides/bulk-replace", payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export type { RateGuide };
