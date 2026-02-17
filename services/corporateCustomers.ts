"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CorporateCustomerDetail, CorporateCustomersResponse } from "@/types";

export function useCorporateCustomers(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ["corporate-customers", page, limit],
    enabled,
    queryFn: async () => {
      const res = await api.get<CorporateCustomersResponse>(
        "/api/proxy/corporate-customers",
        { params: { page, limit } }
      );
      return res.data;
    },
  });
}

export function useCorporateCustomer(id: string | null) {
  return useQuery({
    queryKey: ["corporate-customer", id],
    queryFn: async () => {
      const res = await api.get<{ data: CorporateCustomerDetail }>(
        `/api/proxy/corporate-customers/${id}`
      );
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useApproveCorporateCustomer(customerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api.patch<{ data: CorporateCustomerDetail }>(
        `/api/proxy/staff/corporate-customers/${customerId}/approve`
      );
      return res.data;
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["corporate-customer", customerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["corporate-customers"] });
    },
  });
}

export function useRejectCorporateCustomer(customerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reason: string) => {
      const res = await api.patch<{ data: CorporateCustomerDetail }>(
        `/api/proxy/staff/corporate-customers/${customerId}/reject`,
        { reason }
      );
      return res.data;
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["corporate-customer", customerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["corporate-customers"] });
    },
  });
}

export function useEscalateCorporateCustomer(customerId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { toRole: string; reason?: string }) => {
      const res = await api.patch<{ data: CorporateCustomerDetail }>(
        `/api/proxy/staff/corporate-customers/${customerId}/escalate`,
        payload
      );
      return res.data;
    },
    onSuccess: () => {
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["corporate-customer", customerId] });
      }
      queryClient.invalidateQueries({ queryKey: ["corporate-customers"] });
    },
  });
}
