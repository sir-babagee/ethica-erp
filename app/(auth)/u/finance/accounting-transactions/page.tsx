"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import {
  useJournalEntries,
  useApproveJournalEntry,
} from "@/services/finance";
import { fmtCurrency } from "@/utils/formatters";
import type { JournalEntry, SourceModule } from "@/types";

const SOURCE_MODULE_LABELS: Record<SourceModule, string> = {
  manual: "Manual",
  trade: "Trade",
  subscription: "Subscription",
  redemption: "Redemption",
  nav_adjustment: "NAV Adjustment",
  fx_revaluation: "FX Revaluation",
  purification: "Purification",
  management_fee: "Management Fee",
  payroll: "Payroll",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getJournalTotals(journal: JournalEntry) {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of journal.lines) {
    if (line.debitAmount != null) totalDebit += Number(line.debitAmount);
    if (line.creditAmount != null) totalCredit += Number(line.creditAmount);
  }
  return { totalDebit, totalCredit };
}

function ApproveButton({ journal }: { journal: JournalEntry }) {
  const approve = useApproveJournalEntry();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError("");
    try {
      await approve.mutateAsync(journal.id);
      setConfirming(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? "Failed to approve";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
      setConfirming(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          void handleApprove();
        }}
        disabled={approve.isPending}
        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
          confirming
            ? "bg-green-600 text-white hover:bg-green-700"
            : "border border-green-300 text-green-700 hover:bg-green-50"
        }`}
      >
        {approve.isPending
          ? "Posting…"
          : confirming
          ? "Confirm Post"
          : "Approve & Post"}
      </button>
      {confirming && !approve.isPending && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

export default function AccountingTransactionsPage() {
  const router = useRouter();
  const permissions = useAuthStore((s) => s.permissions);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_MANAGE);
  const canApprove = permissions.includes(PERMISSIONS.FINANCE_APPROVE);

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "" | "pending" | "posted"
  >("");

  const { data, isLoading, error } = useJournalEntries(
    page,
    20,
    undefined,
    undefined,
    statusFilter || undefined
  );

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Journal Entries
          </h1>
          <p className="mt-1 text-gray-500">All accounting journal entries</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load journal entries. Please try again.
        </div>
      </div>
    );
  }

  const journals = data?.data ?? [];
  const pagination = data;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal Entries</h1>
          <p className="mt-1 text-gray-500">
            All accounting journal entries. Only posted entries appear in the GL
            and Trial Balance.
          </p>
        </div>
        {canManage && (
          <Link
            href="/u/finance/accounting-transactions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Journal Entry
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Status:</label>
        {(["", "pending", "posted"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Reference
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Source
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Lines
                </th>
                <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total DR
                </th>
                <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total CR
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Narration
                </th>
                {canApprove && (
                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {journals.length === 0 ? (
                <tr>
                  <td
                    colSpan={canApprove ? 9 : 8}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No journal entries found.
                  </td>
                </tr>
              ) : (
                journals.map((journal) => {
                  const { totalDebit, totalCredit } =
                    getJournalTotals(journal);
                  return (
                    <tr
                      key={journal.id}
                      onClick={() =>
                        router.push(
                          `/u/finance/accounting-transactions/${journal.id}`
                        )
                      }
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="font-mono text-sm font-semibold text-primary">
                          {journal.reference}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatDate(journal.date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {SOURCE_MODULE_LABELS[journal.sourceModule] ??
                          journal.sourceModule}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {journal.lines.length} line
                        {journal.lines.length !== 1 ? "s" : ""}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-gray-900">
                        {fmtCurrency(totalDebit)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-gray-900">
                        {fmtCurrency(totalCredit)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            journal.status === "posted"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {journal.status === "posted" ? "Posted" : "Pending"}
                        </span>
                      </td>
                      <td className="max-w-[200px] px-5 py-4 text-sm text-gray-500">
                        <span className="line-clamp-1">
                          {journal.narration ?? "—"}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {journal.status === "pending" && (
                            <ApproveButton journal={journal} />
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
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
  );
}
