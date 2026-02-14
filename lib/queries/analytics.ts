"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type CustomerRow = {
  id: string;
  status: "unverified" | "approved" | "rejected";
  [key: string]: unknown;
};

type CustomersResponse = {
  data: CustomerRow[];
  pagination: {
    total: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
  };
};

export function useCustomerAnalytics() {
  return useQuery({
    queryKey: ["customers", "analytics"],
    queryFn: async () => {
      const res = await api.get<CustomersResponse>(
        "/api/proxy/customers",
        { params: { page: 1, limit: 1000 } }
      );
      const { data: rows, pagination } = res.data;
      const unverified = rows.filter((r) => r.status === "unverified").length;
      const approved = rows.filter((r) => r.status === "approved").length;
      const rejected = rows.filter((r) => r.status === "rejected").length;
      return {
        total: pagination.total,
        unverified,
        approved,
        rejected,
      };
    },
  });
}
