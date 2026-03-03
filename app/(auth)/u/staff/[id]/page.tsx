"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS, ROLE_LABELS, ROLES, CREATABLE_ROLES } from "@/constants/roles";
import { useAllStaff, useUpdateStaff } from "@/services/staff";
import { useBranches } from "@/services/branches";
import { useActivityLogs } from "@/services/activityLogs";
import type { ActivityLog } from "@/services/activityLogs";

import { LIMIT } from "@/app/(auth)/u/activity-logs/_components/constants";
import ActionBadge from "@/app/(auth)/u/activity-logs/_components/ActionBadge";
import SkeletonRows from "@/app/(auth)/u/activity-logs/_components/SkeletonRows";
import LogDetailModal from "@/app/(auth)/u/activity-logs/_components/LogDetailModal";

function BackIcon({ className }: { className?: string }) {
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
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

interface EditForm {
  firstName: string;
  lastName: string;
  role: string;
  branchId: string;
}

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const permissions = useAuthStore((s) => s.permissions);
  const isAdmin = permissions.includes(PERMISSIONS.STAFF_CREATE);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    role: "",
    branchId: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<EditForm>>({});

  const { data: staffList, isLoading: staffLoading } = useAllStaff();
  const { data: branches } = useBranches();
  const updateStaff = useUpdateStaff();
  const staff = staffList?.find((s) => s.id === id);

  const { data, isLoading: logsLoading, error } = useActivityLogs({
    staffId: id,
    page,
    limit: LIMIT,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (permissions.length > 0 && !permissions.includes(PERMISSIONS.STAFF_CREATE)) {
      router.replace("/u/dashboard");
    }
  }, [permissions, router]);

  const openEdit = () => {
    if (!staff) return;
    setEditForm({
      firstName: staff.firstName,
      lastName: staff.lastName,
      role: staff.role,
      branchId: staff.branchId ?? "",
    });
    setEditErrors({});
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditErrors({});
  };

  const validateEdit = (): boolean => {
    const next: Partial<EditForm> = {};
    if (!editForm.firstName.trim()) next.firstName = "First name is required";
    if (!editForm.lastName.trim()) next.lastName = "Last name is required";
    // Role is locked for admin accounts — skip validation
    if (!isTargetAdmin && !editForm.role) next.role = "Role is required";
    setEditErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEdit()) return;

    updateStaff.mutate(
      {
        id,
        input: {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          // Never send role when editing an admin account
          ...(!isTargetAdmin && { role: editForm.role }),
          branchId: editForm.branchId || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Staff details updated successfully");
          setIsEditing(false);
        },
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Failed to update staff";
          toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
        },
      }
    );
  };

  // When the target is an admin, role cannot be changed — only name and branch are editable
  const isTargetAdmin = staff?.role === ROLES.ADMIN;

  const resolvedBranchName =
    staff?.branchId
      ? (branches?.find((b) => b.id === staff.branchId)?.name ?? "—")
      : "—";

  const activeBranches = (branches ?? []).filter((b) => b.isActive);

  if (staffLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-40 rounded-xl border border-gray-200 bg-gray-100" />
          <div className="h-64 rounded-xl border border-gray-200 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-8">
        <Link
          href="/u/staff"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
        >
          <BackIcon className="h-4 w-4" />
          Back to Staff
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <p className="text-amber-800">Staff member not found.</p>
          <Link
            href="/u/staff"
            className="mt-4 inline-block text-sm font-medium text-amber-700 underline hover:text-amber-900"
          >
            Return to staff list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link
        href="/u/staff"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
      >
        <BackIcon className="h-4 w-4" />
        Back to Staff
      </Link>

      {/* Staff info card */}
      <div className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {staff.firstName} {staff.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{staff.email}</p>
          </div>
          {isAdmin && !isEditing && (
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <PencilIcon className="h-4 w-4" />
              Edit Details
            </button>
          )}
        </div>

        {/* View mode */}
        {!isEditing && (
          <div className="flex flex-wrap gap-x-8 gap-y-5 px-6 py-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Role
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {ROLE_LABELS[staff.role] ?? staff.role.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Branch
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {resolvedBranchName}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Status
              </p>
              <p className="mt-1">
                {staff.requiresPasswordChange ? (
                  <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    Password change required
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                    Active
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Joined
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {staff.createdAt
                  ? new Date(staff.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <form onSubmit={handleSaveEdit} className="px-6 py-5">
            <p className="mb-4 text-sm font-medium text-gray-500">
              {isTargetAdmin
                ? "Admin accounts — only name and branch can be updated. Role and email cannot be changed."
                : "Edit staff details below. Email address cannot be changed."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* First name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {editErrors.firstName && (
                  <p className="mt-1 text-xs text-red-600">
                    {editErrors.firstName}
                  </p>
                )}
              </div>

              {/* Last name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, lastName: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {editErrors.lastName && (
                  <p className="mt-1 text-xs text-red-600">
                    {editErrors.lastName}
                  </p>
                )}
              </div>

              {/* Email — read-only */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <span className="text-sm text-gray-500">{staff.email}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    (cannot be changed)
                  </span>
                </div>
              </div>

              {/* Role — locked when target is admin */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Role
                </label>
                {isTargetAdmin ? (
                  <>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                      <span className="text-sm text-gray-500">
                        {ROLE_LABELS[staff.role] ?? staff.role}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        (cannot be changed)
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, role: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select role</option>
                      {CREATABLE_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    {editErrors.role && (
                      <p className="mt-1 text-xs text-red-600">
                        {editErrors.role}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Branch */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Branch{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <select
                  value={editForm.branchId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, branchId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">No branch assigned</option>
                  {activeBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Determines which branch is recorded on journal entries posted
                  by this staff member.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={updateStaff.isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateStaff.isPending}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {updateStaff.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Activity logs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Activity Logs
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            Failed to load activity logs. Please try again later.
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {!logsLoading && pagination && (
            <div className="border-b border-gray-100 px-6 py-3">
              <p className="text-sm text-gray-500">
                {pagination.total === 0
                  ? "No activity logs"
                  : `${pagination.total.toLocaleString()} log${pagination.total !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date &amp; Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {logsLoading ? (
                  <SkeletonRows columnCount={4} />
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-16 text-center text-gray-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <svg
                          className="h-8 w-8 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-sm">No activity logs yet</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: ActivityLog) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="cursor-pointer transition-colors hover:bg-primary/5"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="line-clamp-2 max-w-xs">
                          {log.description ?? "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">
                        {log.ipAddress ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>{" "}
                results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
