"use client";

import { useEffect, useRef, useState } from "react";
import { fmtCurrency } from "@/utils/formatters";
import type { JournalEntry, SourceModule } from "@/types";
import type { BulkApproveResult } from "@/services/finance";
import { useTrialBalance } from "@/services/finance";

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

function getJournalTotals(journal: JournalEntry) {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of journal.lines) {
    if (line.debitAmount != null) totalDebit += Number(line.debitAmount);
    if (line.creditAmount != null) totalCredit += Number(line.creditAmount);
  }
  return { totalDebit, totalCredit };
}

interface SourceBreakdown {
  label: string;
  count: number;
  totalDebit: number;
  totalCredit: number;
}

interface BulkApprovalModalProps {
  selectedEntries: JournalEntry[];
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  progress: { done: number; total: number } | null;
  result: BulkApproveResult | null;
}

export function BulkApprovalModal({
  selectedEntries,
  onConfirm,
  onCancel,
  isProcessing,
  progress,
  result,
}: BulkApprovalModalProps) {
  const [tab, setTab] = useState<"summary" | "entries">("summary");
  const isDone = result !== null;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Today's date for trial balance (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);
  const { data: tb, isLoading: tbLoading } = useTrialBalance(today);

  // Compute aggregates
  let grandDebit = 0;
  let grandCredit = 0;
  const byModule: Record<string, SourceBreakdown> = {};

  for (const j of selectedEntries) {
    const { totalDebit, totalCredit } = getJournalTotals(j);
    grandDebit += totalDebit;
    grandCredit += totalCredit;

    const key = j.sourceModule;
    if (!byModule[key]) {
      byModule[key] = {
        label: SOURCE_MODULE_LABELS[key] ?? key,
        count: 0,
        totalDebit: 0,
        totalCredit: 0,
      };
    }
    byModule[key].count += 1;
    byModule[key].totalDebit += totalDebit;
    byModule[key].totalCredit += totalCredit;
  }

  const moduleBreakdown = Object.values(byModule).sort(
    (a, b) => b.totalDebit - a.totalDebit
  );

  const isBalanced = Math.abs(grandDebit - grandCredit) < 0.01;
  const totalLines = selectedEntries.reduce((s, j) => s + j.lines.length, 0);

  const dates = selectedEntries.map((j) => j.date).sort();
  const dateFrom = dates[0] ?? "";
  const dateTo = dates[dates.length - 1] ?? "";
  const dateRange =
    dateFrom === dateTo
      ? new Date(dateFrom).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : `${new Date(dateFrom).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(dateTo).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  // Scroll to top when tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const progressPct =
    progress && progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-5 w-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Bulk Approve & Post
              </h2>
              <p className="text-sm text-gray-500">
                {selectedEntries.length} journal{" "}
                {selectedEntries.length === 1 ? "entry" : "entries"} selected
              </p>
            </div>
          </div>
          {!isProcessing && !isDone && (
            <button
              onClick={onCancel}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress bar (shown while processing) */}
        {isProcessing && progress && (
          <div className="border-b border-gray-200 bg-emerald-50 px-6 py-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-emerald-700">
                Approving entries…
              </span>
              <span className="text-emerald-600">
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Result summary (shown after done) */}
        {isDone && (
          <div
            className={`border-b px-6 py-4 ${
              result.failed.length === 0
                ? "border-emerald-200 bg-emerald-50"
                : result.succeeded.length === 0
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            {result.failed.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">
                  All {result.succeeded.length} entries approved and posted successfully.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                {result.succeeded.length > 0 && (
                  <p className="text-sm font-medium text-amber-700">
                    ✓ {result.succeeded.length} approved · ✕ {result.failed.length} failed
                  </p>
                )}
                {result.succeeded.length === 0 && (
                  <p className="text-sm font-medium text-red-700">
                    All approvals failed. Please try again.
                  </p>
                )}
                <ul className="mt-1 space-y-1">
                  {result.failed.map((f) => (
                    <li key={f.id} className="text-xs text-red-600">
                      <span className="font-mono font-medium">{f.reference}</span>
                      {" — "}
                      {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        {!isProcessing && !isDone && (
          <div className="flex border-b border-gray-200">
            {(["summary", "entries"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-b-2 border-primary text-primary"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "summary" ? "Summary" : `Entries (${selectedEntries.length})`}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div ref={scrollRef} className="max-h-[420px] overflow-y-auto">
          {(tab === "summary" || isProcessing || isDone) && !isDone && !isProcessing && (
            <div className="space-y-4 p-6">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {/* Row 1 – counts */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Entries
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {selectedEntries.length}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Lines
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {totalLines}
                  </p>
                </div>
                {/* Row 2 – currency totals */}
                <div className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                    Total DR
                  </p>
                  <p className="mt-1 break-all text-xl font-bold tabular-nums text-emerald-700">
                    {fmtCurrency(grandDebit)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                    Total CR
                  </p>
                  <p className="mt-1 break-all text-xl font-bold tabular-nums text-blue-700">
                    {fmtCurrency(grandCredit)}
                  </p>
                </div>
              </div>

              {/* Balance check */}
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  isBalanced
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {isBalanced ? (
                  <>
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      <strong>Balanced</strong> — Total debits equal total credits across all selected entries.
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <span>
                      <strong>Unbalanced selection</strong> — DR/CR differ by{" "}
                      {fmtCurrency(Math.abs(grandDebit - grandCredit))}. Each individual entry is balanced, but the selection totals differ.
                    </span>
                  </>
                )}
              </div>

              {/* Trial Balance Impact */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                  Trial Balance Impact
                </p>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  {/* Column headers */}
                  <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-500">
                    <span />
                    <span className="text-right">Total DR</span>
                    <span className="text-right">Total CR</span>
                  </div>

                  {/* Current row */}
                  <div className="grid grid-cols-3 items-center border-b border-gray-100 px-4 py-3">
                    <span className="text-sm text-gray-500">Current</span>
                    {tbLoading ? (
                      <>
                        <span className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                        <span className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 break-all text-right text-sm font-medium tabular-nums text-gray-900">
                          {tb ? fmtCurrency(tb.totalDebit) : "—"}
                        </span>
                        <span className="min-w-0 break-all text-right text-sm font-medium tabular-nums text-gray-900">
                          {tb ? fmtCurrency(tb.totalCredit) : "—"}
                        </span>
                      </>
                    )}
                  </div>

                  {/* This batch row */}
                  <div className="grid grid-cols-3 items-center border-b border-gray-100 bg-gray-50/50 px-4 py-3">
                    <span className="text-sm text-gray-500">
                      + This batch
                    </span>
                    <span className="min-w-0 break-all text-right text-sm font-medium tabular-nums text-emerald-600">
                      +{fmtCurrency(grandDebit)}
                    </span>
                    <span className="min-w-0 break-all text-right text-sm font-medium tabular-nums text-blue-600">
                      +{fmtCurrency(grandCredit)}
                    </span>
                  </div>

                  {/* Projected row */}
                  <div className="grid grid-cols-3 items-center bg-gray-50 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700">
                      Projected
                    </span>
                    {tbLoading ? (
                      <>
                        <span className="ml-auto h-4 w-28 animate-pulse rounded bg-gray-300" />
                        <span className="ml-auto h-4 w-28 animate-pulse rounded bg-gray-300" />
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 break-all text-right text-sm font-bold tabular-nums text-emerald-700">
                          {tb ? fmtCurrency(tb.totalDebit + grandDebit) : "—"}
                        </span>
                        <span className="min-w-0 break-all text-right text-sm font-bold tabular-nums text-blue-700">
                          {tb ? fmtCurrency(tb.totalCredit + grandCredit) : "—"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Date range */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Date range</span>
                  <span className="font-medium text-gray-900">{dateRange}</span>
                </div>
              </div>

              {/* Source module breakdown */}
              {moduleBreakdown.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
                    Breakdown by source
                  </p>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">
                            Source
                          </th>
                          <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500">
                            Count
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                            Total DR
                          </th>
                          <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500">
                            Total CR
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {moduleBreakdown.map((row) => (
                          <tr key={row.label}>
                            <td className="px-4 py-2.5 font-medium text-gray-700">
                              {row.label}
                            </td>
                            <td className="px-4 py-2.5 text-center text-gray-600">
                              {row.count}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                              {fmtCurrency(row.totalDebit)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                              {fmtCurrency(row.totalCredit)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                          <td className="px-4 py-2.5 text-gray-700">Total</td>
                          <td className="px-4 py-2.5 text-center text-gray-700">
                            {selectedEntries.length}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                            {fmtCurrency(grandDebit)}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-gray-900">
                            {fmtCurrency(grandCredit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>
                  Posting is <strong>irreversible</strong>. Each entry will be
                  approved sequentially to preserve the cryptographic hash chain.
                  Entries that fail will be reported individually.
                </span>
              </div>
            </div>
          )}

          {tab === "entries" && !isProcessing && !isDone && (
            <div className="divide-y divide-gray-100">
              {selectedEntries.map((j) => {
                const { totalDebit, totalCredit } = getJournalTotals(j);
                return (
                  <div key={j.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <span className="font-mono text-sm font-semibold text-primary">
                        {j.reference}
                      </span>
                      <span className="ml-3 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {SOURCE_MODULE_LABELS[j.sourceModule] ?? j.sourceModule}
                      </span>
                      {j.narration && (
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
                          {j.narration}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 shrink-0 text-right text-xs tabular-nums">
                      <p className="text-emerald-700">DR {fmtCurrency(totalDebit)}</p>
                      <p className="text-blue-700">CR {fmtCurrency(totalCredit)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show processing state in body */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
              <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-500" />
              <p className="text-sm">
                Processing entry {(progress?.done ?? 0) + 1} of {progress?.total ?? selectedEntries.length}…
              </p>
            </div>
          )}

          {/* Show done state in body */}
          {isDone && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {result.succeeded.length}
                  </p>
                  <p className="text-sm text-emerald-600">Posted successfully</p>
                </div>
                <div
                  className={`rounded-xl border p-4 text-center ${
                    result.failed.length > 0
                      ? "border-red-200 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-2xl font-bold ${
                      result.failed.length > 0 ? "text-red-700" : "text-gray-400"
                    }`}
                  >
                    {result.failed.length}
                  </p>
                  <p
                    className={`text-sm ${
                      result.failed.length > 0 ? "text-red-600" : "text-gray-400"
                    }`}
                  >
                    Failed
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          {isDone ? (
            <button
              onClick={onCancel}
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onCancel}
                disabled={isProcessing}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Posting…
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve & Post {selectedEntries.length}{" "}
                    {selectedEntries.length === 1 ? "Entry" : "Entries"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
