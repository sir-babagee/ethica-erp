"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  useInvestments,
  useApproveInvestment,
  useRejectInvestment,
} from "@/lib/queries/investments";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS, ROLES } from "@/constants/roles";
import type { Investment } from "@/types";

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function RejectModal({
  investment,
  onConfirm,
  onCancel,
  loading,
}: {
  investment: Investment;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Reject Investment</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Investment Ref: <strong>{investment.investmentRef}</strong>
          </p>
        </div>
        <div className="px-6 py-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Reason for rejection (optional)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for rejecting this investment entry…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);

  const canCreate = permissions.includes(PERMISSIONS.INVESTMENTS_CREATE);
  const canApprove = permissions.includes(PERMISSIONS.INVESTMENTS_APPROVE);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rejectTarget, setRejectTarget] = useState<Investment | null>(null);

  const { data, isLoading, error } = useInvestments(
    page,
    20,
    statusFilter === "all" ? undefined : statusFilter
  );

  const approveMutation = useApproveInvestment();
  const rejectMutation = useRejectInvestment();

  async function handleApprove(investment: Investment) {
    try {
      await approveMutation.mutateAsync(investment.id);
      toast.success(`Investment ${investment.investmentRef} approved.`);
    } catch {
      toast.error("Failed to approve investment.");
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({ id: rejectTarget.id, reason });
      toast.success(`Investment ${rejectTarget.investmentRef} rejected.`);
      setRejectTarget(null);
    } catch {
      toast.error("Failed to reject investment.");
    }
  }

  const isFundAccountant = user?.role === ROLES.FUND_ACCOUNTANT;

  const filterTabs: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-1 text-gray-500">Mudarabah Fund investment entries</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load transactions. Please try again later.
        </div>
      </div>
    );
  }

  const investments = data?.data ?? [];
  const pagination = data;

  return (
    <>
      {rejectTarget && (
        <RejectModal
          investment={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={rejectMutation.isPending}
        />
      )}

      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="mt-1 text-gray-500">
              {isFundAccountant
                ? "Your Mudarabah Fund investment entries"
                : "All Mudarabah Fund investment entries"}
            </p>
          </div>
          {canCreate && (
            <Link
              href="/u/transactions/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Investment Entry
            </Link>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Investment Ref
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Customer
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tenor
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Start
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    End
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rate (%)
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  {canApprove && (
                    <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {investments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canApprove ? 9 : 8}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No investment entries found.
                    </td>
                  </tr>
                ) : (
                  investments.map((inv) => (
                    <tr key={inv.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {inv.investmentRef}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {inv.customerName}
                        </p>
                        <p className="text-xs text-gray-500">{inv.customerCode}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(inv.investmentAmount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {inv.tenorDays} days
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(inv.startDate)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(inv.endDate)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {Number(inv.indicativeRate).toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      {canApprove && (
                        <td className="whitespace-nowrap px-5 py-4">
                          {inv.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(inv)}
                                disabled={approveMutation.isPending}
                                className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectTarget(inv)}
                                className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{" "}
                of <span className="font-medium">{pagination.total}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
