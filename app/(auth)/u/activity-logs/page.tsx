"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import { useActivityLogs } from "@/services/activityLogs";
import { useAllStaff } from "@/services/staff";
import type { ActivityLog } from "@/services/activityLogs";

import { LIMIT } from "./_components/constants";
import Header from "./_components/Header";
import FilterPanel from "./_components/FilterPanel";
import ActionBadge from "./_components/ActionBadge";
import RoleBadge from "./_components/RoleBadge";
import SkeletonRows from "./_components/SkeletonRows";
import LogDetailModal from "./_components/LogDetailModal";

export default function ActivityLogsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  useEffect(() => {
    if (user && !permissions.includes(PERMISSIONS.ACTIVITY_LOGS_VIEW)) {
      router.replace("/u/dashboard");
    }
  }, [user, permissions, router]);

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const [staffRole, setStaffRole] = useState("");
  const [staffId, setStaffId] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const hasActiveFilters =
    !!staffRole || !!staffId || !!action || !!startDate || !!endDate;

  function handleClearFilters() {
    setStaffRole("");
    setStaffId("");
    setAction("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  function applyFilter(setter: (v: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  const { data: staffList } = useAllStaff();

  const { data, isLoading, error } = useActivityLogs({
    staffId: staffId || undefined,
    staffRole: !staffId && staffRole ? staffRole : undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: LIMIT,
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  if (user && !permissions.includes(PERMISSIONS.ACTIVITY_LOGS_VIEW)) {
    return null;
  }

  if (error) {
    const isBackendDown =
      (error as { response?: { status?: number } })?.response?.status === 503;
    return (
      <div className="p-8">
        <Header />
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {isBackendDown
            ? "Unable to connect to the API server. Please ensure the backend is running."
            : "Failed to load activity logs. Please try again later."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Header />

      <FilterPanel
        staffRole={staffRole}
        staffId={staffId}
        action={action}
        startDate={startDate}
        endDate={endDate}
        hasActiveFilters={hasActiveFilters}
        staffList={staffList}
        onStaffRoleChange={(val) => applyFilter(setStaffRole, val)}
        onStaffIdChange={(val) => applyFilter(setStaffId, val)}
        onActionChange={(val) => applyFilter(setAction, val)}
        onStartDateChange={(val) => applyFilter(setStartDate, val)}
        onEndDateChange={(val) => applyFilter(setEndDate, val)}
        onClearFilters={handleClearFilters}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {!isLoading && pagination && (
          <div className="border-b border-gray-100 px-6 py-3">
            <p className="text-sm text-gray-500">
              {pagination.total === 0
                ? "No activity logs found"
                : `${pagination.total.toLocaleString()} log${pagination.total !== 1 ? "s" : ""} found`}
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Staff
                </th>
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
              {isLoading ? (
                <SkeletonRows />
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                      <span className="text-sm">
                        No activity logs match your filters
                      </span>
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
                      <p className="text-sm font-medium text-gray-900">
                        {log.staff
                          ? `${log.staff.firstName} ${log.staff.lastName}`
                          : "—"}
                      </p>
                      {log.staff && (
                        <div className="mt-1">
                          <RoleBadge role={log.staff.role} />
                        </div>
                      )}
                    </td>
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

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
