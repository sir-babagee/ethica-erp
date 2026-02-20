"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Investment,
  InvestmentsResponse,
  CustomerLookupResult,
  CreateInvestmentPayload,
} from "@/types";

const QUERY_KEY = "investments";

export function useInvestments(page = 1, limit = 20, status?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, status],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (status) params.status = status;
      const res = await api.get<InvestmentsResponse>(
        "/api/proxy/investments",
        { params }
      );
      return res.data;
    },
  });
}

export function useInvestment(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const res = await api.get<Investment>(`/api/proxy/investments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export interface CustomerSearchResult {
  id: string;
  customerId: string;
  name: string;
  type: "personal" | "corporate";
}

export function useCustomerSearch(q: string) {
  return useQuery({
    queryKey: ["customer-search", q],
    queryFn: async () => {
      const res = await api.get<CustomerSearchResult[]>("/api/proxy/investments/customer-search", { params: { q } });
      return res.data;
    },
    enabled: q.trim().length >= 1,
    staleTime: 10_000,
  });
}

export function useCustomerLookup(code: string) {
  return useQuery({
    queryKey: ["customer-lookup", code],
    queryFn: async () => {
      const res = await api.get<CustomerLookupResult>(
        "/api/proxy/investments/customer-lookup",
        { params: { code } }
      );
      return res.data;
    },
    enabled: code.length >= 3,
    retry: false,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvestmentPayload) =>
      api.post<Investment>("/api/proxy/investments", payload).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useApproveInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Investment>(`/api/proxy/investments/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useRejectInvestment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api
        .patch<Investment>(`/api/proxy/investments/${id}/reject`, { reason })
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export type { Investment };
