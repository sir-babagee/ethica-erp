"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import { useAllStaff } from "@/services/staff";
import { useActivityLogs } from "@/services/activityLogs";
import type { ActivityLog } from "@/services/activityLogs";
import { ROLE_LABELS } from "@/constants/roles";

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

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const permissions = useAuthStore((s) => s.permissions);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [page, setPage] = useState(1);

  const { data: staffList, isLoading: staffLoading } = useAllStaff();
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
        <div className="border-b border-gray-100 px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{staff.email}</p>
        </div>
        <div className="flex flex-wrap gap-6 px-6 py-4">
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
                of <span className="font-medium">{pagination.total}</span> results
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
