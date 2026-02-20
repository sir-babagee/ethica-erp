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

type AnalyticsApiResponse = {
  message: string;
  data: AnalyticsData;
};

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await api.get<AnalyticsApiResponse>("/api/proxy/analytics");
  return res.data.data;
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });
}
