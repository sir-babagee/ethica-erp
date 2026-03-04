"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useBranches } from "@/services/branches";
import { useUpdateStaff } from "@/services/staff";
import { ADMIN_ROLE } from "@/constants/roles";
import { useRoles } from "@/services/roles";

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function BadgeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    </svg>
  );
}

function BranchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const permissions = useAuthStore((s) => s.permissions);
  const { data: branches } = useBranches();
  const { data: roles = [] } = useRoles();
  const updateStaff = useUpdateStaff();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [saveError, setSaveError] = useState("");

  const isAdmin = user?.role === ADMIN_ROLE;

  const getRoleLabel = (roleSlug: string) =>
    roles.find((r) => r.name === roleSlug)?.label ?? roleSlug.replace(/_/g, " ");

  const branchName = user?.branchId
    ? branches?.find((b) => b.id === user.branchId)?.name ?? "—"
    : "Not assigned";

  function startEditing() {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setSelectedBranchId(user?.branchId ?? "");
    setSaveError("");
    setEditing(true);
  }

  async function saveProfile() {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      setSaveError("First name and last name are required.");
      return;
    }
    setSaveError("");
    try {
      const res = await updateStaff.mutateAsync({
        id: user.id,
        input: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          branchId: selectedBranchId || null,
        },
      });
      setAuth(
        {
          ...user,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          branchId: res.data.branchId ?? null,
        },
        permissions,
      );
      setEditing(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? "Failed to save profile";
      setSaveError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-gray-500">
          View your account details and branch assignment.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">{user.email}</p>

          {/* ── Edit form (admins only) ───────────────────────────────────── */}
          {isAdmin && editing ? (
            <div className="mt-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleLabel(user.role)}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
                  Branch
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">— Unassign branch —</option>
                  {(branches ?? [])
                    .filter((b) => b.isActive)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                </select>
              </div>

              {saveError && (
                <p className="text-xs text-red-500">{saveError}</p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={updateStaff.isPending}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {updateStaff.isPending ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ── Read-only view ──────────────────────────────────────────── */
            <div className="mt-8 space-y-6">
              <InfoRow label="Email" value={user.email} icon={MailIcon} />
              <InfoRow
                label="Role"
                value={getRoleLabel(user.role)}
                icon={BadgeIcon}
              />
              <InfoRow label="Branch" value={branchName} icon={BranchIcon} />
              {isAdmin && (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit profile
                </button>
              )}
            </div>
          )}

          {user.requiresPasswordChange && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-medium text-amber-800">
                Password change required
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                You must update your password before continuing.
              </p>
              <Link
                href="/u/change-password"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900"
              >
                Change password →
              </Link>
            </div>
          )}

          {!user.requiresPasswordChange && (
            <div className="mt-6">
              <Link
                href="/u/change-password"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
              >
                Change password
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
