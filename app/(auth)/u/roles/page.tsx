"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS, PERMISSION_GROUPS, ADMIN_ROLE } from "@/constants/roles";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useUpdateRolePermissions,
} from "@/services/roles";
import type { Role } from "@/services/roles";

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ─── Role Form Modal ───────────────────────────────────────────────────────────

type RoleFormModalProps = {
  role?: Role;
  onClose: () => void;
};

function RoleFormModal({ role, onClose }: RoleFormModalProps) {
  const isEditing = !!role;
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const updateRolePermissions = useUpdateRolePermissions();

  const [label, setLabel] = useState(role?.label ?? "");
  const [name, setName] = useState(role?.name ?? "");
  const [escalationTier, setEscalationTier] = useState<string>(
    role?.escalationTier != null ? String(role.escalationTier) : ""
  );
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(role?.permissions ?? [])
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPending =
    createRole.isPending || updateRole.isPending || updateRolePermissions.isPending;

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!label.trim()) next.label = "Label is required";
    if (!isEditing && !name.trim()) next.name = "Slug is required";
    if (!isEditing && name.trim() && !/^[a-z][a-z0-9_]*$/.test(name.trim())) {
      next.name = "Slug must be lowercase letters, numbers and underscores only";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const tier = escalationTier.trim() ? parseInt(escalationTier, 10) : null;

    try {
      if (isEditing) {
        await updateRole.mutateAsync({
          id: role.id,
          input: { label: label.trim(), escalationTier: tier },
        });
        await updateRolePermissions.mutateAsync({
          id: role.id,
          permissions: Array.from(selectedPermissions),
        });
        toast.success("Role updated");
      } else {
        const res = await createRole.mutateAsync({
          name: name.trim(),
          label: label.trim(),
          escalationTier: tier,
        });
        await updateRolePermissions.mutateAsync({
          id: res.data.id,
          permissions: Array.from(selectedPermissions),
        });
        toast.success("Role created");
      }
      onClose();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : isEditing ? "Failed to update role" : "Failed to create role";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? `Edit Role: ${role.label}` : "New Role"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {/* Label */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Fund Accountant"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              {errors.label && (
                <p className="mt-1 text-xs text-red-600">{errors.label}</p>
              )}
            </div>

            {/* Slug — only for creation */}
            {!isEditing && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Slug{" "}
                  <span className="font-normal text-gray-400">
                    (unique identifier, cannot be changed later)
                  </span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  placeholder="e.g. fund_accountant"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>
            )}

            {/* Escalation Tier */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Escalation Tier{" "}
                <span className="font-normal text-gray-400">
                  (optional — higher number = higher in escalation chain)
                </span>
              </label>
              <input
                type="number"
                min="1"
                value={escalationTier}
                onChange={(e) => setEscalationTier(e.target.value)}
                placeholder="Leave blank if not in escalation chain"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Permissions matrix */}
            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">Permissions</p>
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </p>
                    <div className="space-y-1.5">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.key}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.has(perm.key)}
                            onChange={() => togglePermission(perm.key)}
                            className="h-4 w-4 rounded border-gray-300 accent-primary"
                          />
                          <div>
                            <span className="text-sm text-gray-800">{perm.label}</span>
                            <span className="ml-2 font-mono text-xs text-gray-400">
                              {perm.key}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {isPending && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isPending ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ───────────────────────────────────────────────────────

function DeleteConfirm({
  role,
  onConfirm,
  onCancel,
  isPending,
}: {
  role: Role;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Delete Role</h2>
          <p className="mt-0.5 text-sm text-gray-500">This action cannot be undone.</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the role{" "}
            <span className="font-semibold">{role.label}</span>? Staff members
            currently assigned this role will need to be reassigned.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isPending && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Delete Role
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  const canAccess =
    user?.role === ADMIN_ROLE || permissions.includes(PERMISSIONS.ROLES_MANAGE);

  useEffect(() => {
    if (user && !canAccess) {
      router.replace("/u/dashboard");
    }
  }, [user, canAccess, router]);

  const { data: roles = [], isLoading } = useRoles();
  const deleteRole = useDeleteRole();

  const [formTarget, setFormTarget] = useState<Role | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success(`Role "${deleteTarget.label}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to delete role";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  if (user && !canAccess) {
    return null;
  }

  return (
    <>
      {formTarget !== null && (
        <RoleFormModal
          role={formTarget === "new" ? undefined : formTarget}
          onClose={() => setFormTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          role={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={deleteRole.isPending}
        />
      )}

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="mt-1 text-gray-500">
              Create roles, assign permissions to them, and control what each
              role can do in the system.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormTarget("new")}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            New Role
          </button>
        </div>

        {/* Roles table */}
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Slug
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Escalation Tier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Permissions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                        No roles found. Create your first role to get started.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="transition-colors hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {role.label}
                            </span>
                            {role.isSystem && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                System
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-500">
                            {role.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {role.escalationTier != null ? (
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              Tier {role.escalationTier}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {role.isSystem ? (
                            <span className="text-xs text-gray-400">All permissions</span>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {role.permissions.length}{" "}
                              <span className="text-gray-400">
                                {role.permissions.length === 1
                                  ? "permission"
                                  : "permissions"}
                              </span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setFormTarget(role)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            {!role.isSystem && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(role)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                              >
                                <TrashIcon className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info note */}
        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Note:</span> The{" "}
            <span className="font-mono font-medium">admin</span> system role
            always has all permissions and cannot be deleted or have its slug
            changed. Permission changes take effect the next time a staff member
            logs in.
          </p>
        </div>
      </div>
    </>
  );
}
