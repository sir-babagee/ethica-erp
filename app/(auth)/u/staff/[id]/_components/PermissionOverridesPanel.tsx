"use client";

import toast from "react-hot-toast";
import { PERMISSION_GROUPS } from "@/constants/roles";
import {
  useRoles,
  useUserPermissionOverrides,
  useSetUserPermissionOverride,
  useRemoveUserPermissionOverride,
} from "@/services/roles";

type Props = {
  staffId: string;
  staffRole: string;
};

export default function PermissionOverridesPanel({ staffId, staffRole }: Props) {
  const { data: roles = [] } = useRoles();
  const { data: overrides = [], isLoading } = useUserPermissionOverrides(staffId);
  const setOverride = useSetUserPermissionOverride(staffId);
  const removeOverride = useRemoveUserPermissionOverride(staffId);

  const roleData = roles.find((r) => r.name === staffRole);
  const rolePermissions = new Set(roleData?.permissions ?? []);

  const overrideMap = new Map(overrides.map((o) => [o.permissionKey, o.granted]));

  const getEffectiveState = (permKey: string) => {
    if (overrideMap.has(permKey)) {
      return overrideMap.get(permKey) ? "granted" : "revoked";
    }
    return rolePermissions.has(permKey) ? "role" : "none";
  };

  const handleGrant = async (permKey: string) => {
    try {
      await setOverride.mutateAsync({ permissionKey: permKey, granted: true });
      toast.success("Permission granted");
    } catch {
      toast.error("Failed to grant permission");
    }
  };

  const handleRevoke = async (permKey: string) => {
    try {
      await setOverride.mutateAsync({ permissionKey: permKey, granted: false });
      toast.success("Permission revoked");
    } catch {
      toast.error("Failed to revoke permission");
    }
  };

  const handleRemoveOverride = async (permKey: string) => {
    try {
      await removeOverride.mutateAsync(permKey);
      toast.success("Override removed — reverted to role default");
    } catch {
      toast.error("Failed to remove override");
    }
  };

  const isMutating = setOverride.isPending || removeOverride.isPending;

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Permission Overrides</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Permission Overrides</h2>
        <p className="mt-1 text-sm text-gray-500">
          Grant or revoke specific permissions for this staff member, independent
          of their role&apos;s defaults.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-300" />
            Not assigned
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
            From role
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Explicitly granted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-400" />
            Explicitly revoked
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="bg-gray-50/60 px-5 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {group.permissions.map((perm) => {
                  const state = getEffectiveState(perm.key);
                  const hasOverride = overrideMap.has(perm.key);

                  return (
                    <div
                      key={perm.key}
                      className="flex items-center justify-between gap-4 px-5 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                            state === "granted"
                              ? "bg-emerald-500"
                              : state === "revoked"
                                ? "bg-red-400"
                                : state === "role"
                                  ? "bg-blue-400"
                                  : "bg-gray-300"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {perm.label}
                          </p>
                          <p className="font-mono text-xs text-gray-400">
                            {perm.key}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {hasOverride ? (
                          <>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                state === "granted"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {state === "granted" ? "Override: Granted" : "Override: Revoked"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOverride(perm.key)}
                              disabled={isMutating}
                              className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Remove Override
                            </button>
                          </>
                        ) : (
                          <>
                            {!rolePermissions.has(perm.key) && (
                              <button
                                type="button"
                                onClick={() => handleGrant(perm.key)}
                                disabled={isMutating}
                                className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Grant
                              </button>
                            )}
                            {rolePermissions.has(perm.key) && (
                              <button
                                type="button"
                                onClick={() => handleRevoke(perm.key)}
                                disabled={isMutating}
                                className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Revoke
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
