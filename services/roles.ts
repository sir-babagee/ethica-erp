"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type Role = {
  id: string;
  /** Immutable slug, e.g. "fund_accountant" */
  name: string;
  /** Human-readable label set by the admin, e.g. "Fund Accountant" */
  label: string;
  /** True for the admin role — cannot be deleted or have its slug changed. */
  isSystem: boolean;
  /** Nullable integer; roles with a higher tier are valid escalation targets. */
  escalationTier: number | null;
  /** Permission keys assigned to this role. */
  permissions: string[];
  createdAt: string;
};

export type CreateRoleInput = {
  name: string;
  label: string;
  escalationTier?: number | null;
};

export type UpdateRoleInput = {
  label?: string;
  escalationTier?: number | null;
};

export type UserPermissionOverride = {
  permissionKey: string;
  /** true = explicitly granted on top of role; false = explicitly revoked from role */
  granted: boolean;
};

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get<{ data: Role[] }>("/api/proxy/roles");
      return res.data.data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      const res = await api.post<{ message: string; data: Role }>(
        "/api/proxy/roles",
        input
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateRoleInput }) => {
      const res = await api.patch<{ message: string; data: Role }>(
        `/api/proxy/roles/${id}`,
        input
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<{ message: string }>(`/api/proxy/roles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      permissions,
    }: {
      id: string;
      permissions: string[];
    }) => {
      const res = await api.put<{ message: string; data: Role }>(
        `/api/proxy/roles/${id}/permissions`,
        { permissions }
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUserPermissionOverrides(staffId: string) {
  return useQuery({
    queryKey: ["staff", staffId, "permissions"],
    queryFn: async () => {
      const res = await api.get<{ data: UserPermissionOverride[] }>(
        `/api/proxy/staff/${staffId}/permissions`
      );
      return res.data.data;
    },
    enabled: !!staffId,
  });
}

export function useSetUserPermissionOverride(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (override: UserPermissionOverride) => {
      const res = await api.post(
        `/api/proxy/staff/${staffId}/permissions`,
        override
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId, "permissions"] });
    },
  });
}

export function useRemoveUserPermissionOverride(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (permissionKey: string) => {
      const res = await api.delete(
        `/api/proxy/staff/${staffId}/permissions/${permissionKey}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", staffId, "permissions"] });
    },
  });
}
