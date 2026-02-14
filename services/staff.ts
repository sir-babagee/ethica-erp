"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Staff } from "@/types/auth";

export type CreateStaffInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export type CreateStaffResponse = {
  message: string;
  data: Staff & { tempPassword: string };
};

export function useCreateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStaffInput) => {
      const res = await api.post<CreateStaffResponse>(
        "/api/proxy/staff",
        input
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useAllStaff() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await api.get<{ data: Staff[] }>("/api/proxy/staff");
      return res.data.data;
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (input: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await api.patch("/api/proxy/staff/password", input);
      return res.data;
    },
  });
}
