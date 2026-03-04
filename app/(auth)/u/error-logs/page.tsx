"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS, ADMIN_ROLE } from "@/constants/roles";
import { useErrorLogs, type ErrorLog, type ErrorLogsFilters } from "@/services/errorLogs";
import ErrorLogDetailModal from "./_components/ErrorLogDetailModal";

function StatusBadge({ isResolved }: { isResolved: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isResolved
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isResolved ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {isResolved ? "Resolved" : "Open"}
    </span>
  );
}

export default function ErrorLogsPage() {
  const router = useRouter();
  const { user, permissions } = useAuthStore();

  const isAdmin = user?.role === ADMIN_ROLE;
  const hasPermission =
    isAdmin || permissions.includes(PERMISSIONS.ERROR_LOGS_VIEW);

  useEffect(() => {
    if (user && !hasPermission) {
      router.replace("/u/dashboard");
    }
  }, [user, hasPermission, router]);

  const [filters, setFilters] = useState<ErrorLogsFilters>({
    isResolved: "",
    startDate: "",
    endDate: "",
    page: 1,
  });

  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

  const { data, isLoading, isError, refetch } = useErrorLogs(filters);

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  function handleFilterChange(
    key: keyof ErrorLogsFilters,
    value: string | number
  ) {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }

    if (!hasPermission && !user) return null;

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Error Logs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Crashes reported by the frontend error boundary. Click any row to
          examine the full stack trace.
        </p>
      </div>

      {/* Summary chips */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Errors</p>
            <p className="text-lg font-bold text-gray-900">
              {isLoading ? "—" : (pagination?.total ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          value={filters.isResolved ?? ""}
          onChange={(e) =>
            handleFilterChange(
              "isResolved",
              e.target.value as "" | "true" | "false"
            )
          }
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">All statuses</option>
          <option value="false">Open only</option>
          <option value="true">Resolved only</option>
        </select>

        <input
          type="date"
          value={filters.startDate ?? ""}
          onChange={(e) => handleFilterChange("startDate", e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          placeholder="Start date"
        />
        <input
          type="date"
          value={filters.endDate ?? ""}
          onChange={(e) => handleFilterChange("endDate", e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          placeholder="End date"
        />

        {(filters.isResolved || filters.startDate || filters.endDate) && (
          <button
            onClick={() =>
              setFilters({ isResolved: "", startDate: "", endDate: "", page: 1 })
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-sm hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Error</th>
              <th className="px-5 py-3.5">Reported by</th>
              <th className="px-5 py-3.5">Page</th>
              <th className="px-5 py-3.5">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 animate-pulse rounded bg-gray-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && isError && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-red-500"
                >
                  Failed to load error logs. Please try again.
                </td>
              </tr>
            )}

            {!isLoading && !isError && logs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-gray-400"
                >
                  No error logs found. When crashes are detected they will
                  appear here.
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="cursor-pointer transition-colors hover:bg-primary/5"
                >
                  <td className="px-5 py-3.5">
                    <StatusBadge isResolved={log.isResolved} />
                  </td>
                  <td className="max-w-xs px-5 py-3.5">
                    <p className="truncate font-medium text-gray-900">
                      {log.errorName ?? "Error"}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {log.errorMessage}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {log.staff
                      ? `${log.staff.firstName} ${log.staff.lastName}`
                      : "—"}
                  </td>
                  <td className="max-w-[180px] px-5 py-3.5">
                    {log.url ? (
                      <span className="truncate block font-mono text-xs text-gray-500">
                        {log.url.replace(/^https?:\/\/[^/]+/, "")}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} &middot;{" "}
            {pagination.total} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() =>
                setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() =>
                setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedLog && (
        <ErrorLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onStatusChange={() => {
            refetch();
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}
