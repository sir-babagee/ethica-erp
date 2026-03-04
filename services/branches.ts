"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Branch, CreateBranchPayload, UpdateBranchPayload } from "@/types";

const BRANCHES_KEY = "branches";

export function useBranches() {
  return useQuery({
    queryKey: [BRANCHES_KEY],
    queryFn: async () => {
      const res = await api.get<Branch[]>("/api/proxy/branches");
      return res.data;
    },
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBranchPayload) =>
      api
        .post<Branch>("/api/proxy/branches", payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBranchPayload }) =>
      api
        .patch<Branch>(`/api/proxy/branches/${id}`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [BRANCHES_KEY] });
    },
  });
}
