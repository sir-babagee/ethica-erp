"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CustomerDetail, CustomersResponse } from "@/types";

export function useCustomers(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["customers", page, limit],
    enabled,
    queryFn: async () => {
      const res = await api.get<CustomersResponse>("/api/proxy/customers", {
        params: { page, limit },
      });
      return res.data;
    },
  });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await api.get<{ data: CustomerDetail }>(
        `/api/proxy/customers/${id}`
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useApproveCustomer(customerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch<{ data: CustomerDetail }>(
        `/api/proxy/staff/customers/${customerId}/approve`
      );
      return res.data;
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useEscalateCustomer(customerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { toRole: string; reason?: string }) => {
      const res = await api.patch<{ data: CustomerDetail }>(
        `/api/proxy/staff/customers/${customerId}/escalate`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
