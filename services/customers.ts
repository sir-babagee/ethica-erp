"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCustomers(page = 1, limit = 10) {
  return useQuery({
    queryKey: ["customers", page, limit],
    queryFn: async () => {
      const res = await api.get("/api/proxy/customers", {
        params: { page, limit },
      });
      return res.data;
    },
  });
}
