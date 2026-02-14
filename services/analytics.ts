"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type AnalyticsData = {
  newCustomersToday: number;
  newCustomersThisWeek: number;
  totalCustomers: number;
  unverified: number;
  approved: number;
  rejected: number;
  totalStaff: number;
};

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await api.get<{ data: AnalyticsData }>(
        "/api/proxy/analytics"
      );
      return res.data.data;
    },
  });
}
