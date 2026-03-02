"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import { useJournalEntry, useApproveJournalEntry } from "@/services/finance";
import { fmtCurrency } from "@/utils/formatters";
import type { SourceModule, ShariahTag } from "@/types";

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

const SHARIAH_TAG_LABELS: Record<ShariahTag, string> = {
  halal: "Halal",
  haram: "Haram",
  purification: "Purification",
};

const SHARIAH_TAG_COLORS: Record<ShariahTag, string> = {
  halal: "bg-green-100 text-green-700",
  haram: "bg-red-100 text-red-700",
  purification: "bg-purple-100 text-purple-700",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetaField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-gray-900">{value ?? "—"}</p>
    </div>
  );
}

export default function JournalEntryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const permissions = useAuthStore((s) => s.permissions);
  const canApprove = permissions.includes(PERMISSIONS.FINANCE_APPROVE);

  const { data: journal, isLoading, error } = useJournalEntry(id);
  const approve = useApproveJournalEntry();

  const [confirming, setConfirming] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [hashExpanded, setHashExpanded] = useState(false);

  const handleApprove = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setApproveError("");
    try {
      await approve.mutateAsync(id);
      setConfirming(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? "Failed to approve journal";
      setApproveError(Array.isArray(msg) ? msg.join(", ") : msg);
      setConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-7 w-56 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="p-8">
        <Link
          href="/u/finance/accounting-transactions"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Journal Entries
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load journal entry. Please try again.
        </div>
      </div>
    );
  }

  const totalDebit = journal.lines.reduce(
    (s, l) => s + (l.debitAmount != null ? Number(l.debitAmount) : 0),
    0
  );
  const totalCredit = journal.lines.reduce(
    (s, l) => s + (l.creditAmount != null ? Number(l.creditAmount) : 0),
    0
  );

  const isPosted = journal.status === "posted";

  return (
    <div className="p-8">
      {/* Top nav */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/u/finance/accounting-transactions"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Journal Entries
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {journal.reference}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPosted
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {isPosted ? "Posted" : "Pending"}
            </span>
          </div>
        </div>

        {/* Approve & Post action */}
        {canApprove && !isPosted && (
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => void handleApprove()}
              disabled={approve.isPending}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                confirming
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border border-green-400 bg-white text-green-700 hover:bg-green-50"
              }`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {approve.isPending ? "Posting…" : confirming ? "Confirm — Post Journal" : "Approve & Post"}
            </button>
            {confirming && !approve.isPending && (
              <button
                onClick={() => setConfirming(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            )}
            {approveError && (
              <p className="text-xs text-red-500">{approveError}</p>
            )}
          </div>
        )}
      </div>

      {/* Header details */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Journal Header
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
          <MetaField label="Journal Date" value={formatDate(journal.date)} />
          <MetaField
            label="Source Module"
            value={SOURCE_MODULE_LABELS[journal.sourceModule] ?? journal.sourceModule}
          />
          <MetaField label="Fund ID" value={journal.fundId} />
          <MetaField label="Client ID" value={journal.clientId} />
          <MetaField label="Entity ID" value={journal.entityId} />
          <MetaField label="Created" value={formatDateTime(journal.createdAt)} />
          {isPosted && (
            <MetaField label="Approved" value={formatDateTime(journal.approvedAt)} />
          )}
          <MetaField
            label="Status"
            value={
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isPosted
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isPosted ? "Posted" : "Pending"}
              </span>
            }
          />
        </div>
        {journal.narration && (
          <div className="mt-5 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Narration
            </p>
            <p className="mt-1 text-sm text-gray-700">{journal.narration}</p>
          </div>
        )}
      </div>

      {/* Journal lines */}
      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Journal Lines
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              {journal.lines.length}
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Account
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Debit (DR)
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Credit (CR)
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Currency
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  FX Rate
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Shari&apos;ah Tag
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {journal.lines.map((line, idx) => (
                <tr key={line.id ?? idx} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-sm font-semibold text-gray-900">
                    {line.account}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-medium text-blue-700">
                    {line.debitAmount != null ? fmtCurrency(Number(line.debitAmount)) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm font-medium text-rose-700">
                    {line.creditAmount != null ? fmtCurrency(Number(line.creditAmount)) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm font-mono text-gray-700">
                    {line.currency}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-sm text-gray-600">
                    {line.currency !== "NGN"
                      ? Number(line.fxRate).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4,
                        })
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-sm">
                    {line.shariahTag ? (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SHARIAH_TAG_COLORS[line.shariahTag]}`}
                      >
                        {SHARIAH_TAG_LABELS[line.shariahTag]}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50">
              <tr>
                <td className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Totals
                </td>
                <td className="px-5 py-3 text-right text-sm font-bold text-blue-700">
                  {fmtCurrency(totalDebit)}
                </td>
                <td className="px-5 py-3 text-right text-sm font-bold text-rose-700">
                  {fmtCurrency(totalCredit)}
                </td>
                <td colSpan={3} className="px-5 py-3 text-right text-xs text-gray-500">
                  {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                    <span className="font-semibold text-green-600">✓ Balanced</span>
                  ) : (
                    <span className="font-semibold text-red-600">
                      Imbalance: {fmtCurrency(Math.abs(totalDebit - totalCredit))}
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Hash chain */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setHashExpanded((p) => !p)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Cryptographic Hash Chain
          </h2>
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${hashExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {hashExpanded && (
          <div className="border-t border-gray-100 px-6 pb-5 pt-4 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Previous Hash
              </p>
              <p className="mt-1 break-all font-mono text-xs text-gray-600">
                {journal.previousHash ?? "genesis (first journal)"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Current Hash
              </p>
              <p className="mt-1 break-all font-mono text-xs text-gray-600">
                {journal.currentHash ?? "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
