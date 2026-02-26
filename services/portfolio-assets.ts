"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PortfolioAsset,
  PortfolioAssetsResponse,
  CreatePortfolioAssetPayload,
} from "@/types";

const QUERY_KEY = "portfolio-assets";

export function usePortfolioAssets(page = 1, limit = 20) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit],
    queryFn: async () => {
      const res = await api.get<PortfolioAssetsResponse>(
        "/api/proxy/portfolio-assets",
        { params: { page, limit } }
      );
      return res.data;
    },
  });
}

export function usePortfolioAsset(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const res = await api.get<PortfolioAsset>(
        `/api/proxy/portfolio-assets/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreatePortfolioAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePortfolioAssetPayload) =>
      api
        .post<PortfolioAsset>("/api/proxy/portfolio-assets", payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export type { PortfolioAsset };
