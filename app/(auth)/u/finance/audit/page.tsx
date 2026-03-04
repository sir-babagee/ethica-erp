"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import { useJournalEntries } from "@/services/finance";
import { api } from "@/lib/api";
import { fmtCurrency } from "@/utils/formatters";
import type { JournalEntry, JournalEntriesResponse, SourceModule } from "@/types";

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: Date | null | undefined): string {
  if (!dateStr) return "—";
  return dateStr.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function truncateHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type VerifyStatus = "idle" | "running" | "done" | "error";

interface ChainCheck {
  journalId: string;
  sequenceIndex: number;
  chainOk: boolean;
  isGenesis: boolean;
  balanceOk: boolean;
  balanceImbalance: number;
  totalDebit: number;
  totalCredit: number;
}

interface VerifyResult {
  checkMap: Map<string, ChainCheck>;
  totalCount: number;
  chainAnomalies: number;
  balanceErrors: number;
  verifiedAt: Date;
  anomalyJournals: JournalEntry[];
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  sublabel,
}: {
  label: string;
  value: number | string;
  color: "gray" | "green" | "red" | "slate";
  sublabel?: string;
}) {
  const valueColors = {
    gray: "text-gray-400",
    green: "text-green-600",
    red: "text-red-600",
    slate: "text-slate-800",
  };
  const isPlaceholder = value === "—";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className={`mt-1.5 text-3xl font-bold tabular-nums ${
          isPlaceholder ? "text-gray-200" : valueColors[color]
        }`}
      >
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

function ExplainerBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="mb-1.5 text-sm font-semibold text-gray-800">{title}</h4>
      <p className="text-sm leading-relaxed text-gray-500">{body}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LedgerAuditPage() {
  const permissions = useAuthStore((s) => s.permissions);
  const canView = permissions.includes(PERMISSIONS.FINANCE_VIEW);

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState("");

  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "posted">("");
  const [moduleFilter, setModuleFilter] = useState<SourceModule | "">("");
  const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);

  const { data, isLoading, error } = useJournalEntries(
    page,
    50,
    dateFrom || undefined,
    dateTo || undefined,
    statusFilter || undefined,
    moduleFilter || undefined
  );

  const runVerification = useCallback(async () => {
    setVerifyStatus("running");
    setVerifyError("");
    try {
      const res = await api.get<JournalEntriesResponse>(
        "/api/proxy/finance/journals",
        { params: { page: 1, limit: 9999 } }
      );

      const allJournals = [...res.data.data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const checkMap = new Map<string, ChainCheck>();
      const anomalyJournals: JournalEntry[] = [];
      let chainAnomalies = 0;
      let balanceErrors = 0;

      for (let i = 0; i < allJournals.length; i++) {
        const j = allJournals[i];
        const isGenesis = i === 0;
        const expectedPrev = isGenesis ? null : allJournals[i - 1].currentHash;

        const chainOk = isGenesis
          ? j.previousHash === null || j.previousHash === "genesis"
          : j.previousHash === expectedPrev;

        const totalDebit = j.lines.reduce(
          (s, l) => s + (l.debitAmount != null ? Number(l.debitAmount) : 0),
          0
        );
        const totalCredit = j.lines.reduce(
          (s, l) => s + (l.creditAmount != null ? Number(l.creditAmount) : 0),
          0
        );
        const balanceImbalance = Math.abs(totalDebit - totalCredit);
        const balanceOk = balanceImbalance < 0.01;

        if (!chainOk) chainAnomalies++;
        if (!balanceOk) balanceErrors++;

        const check: ChainCheck = {
          journalId: j.id,
          sequenceIndex: i,
          chainOk,
          isGenesis,
          balanceOk,
          balanceImbalance,
          totalDebit,
          totalCredit,
        };
        checkMap.set(j.id, check);

        if (!chainOk || !balanceOk) {
          anomalyJournals.push(j);
        }
      }

      setVerifyResult({
        checkMap,
        totalCount: allJournals.length,
        chainAnomalies,
        balanceErrors,
        verifiedAt: new Date(),
        anomalyJournals,
      });
      setVerifyStatus("done");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Verification failed. Please try again.";
      setVerifyError(msg);
      setVerifyStatus("error");
    }
  }, []);

  if (!canView) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  const journals = data?.data ?? [];
  const pagination = data;
  const totalAnomalies = verifyResult
    ? verifyResult.chainAnomalies + verifyResult.balanceErrors
    : 0;

  const displayedJournals =
    showAnomaliesOnly && verifyResult
      ? journals.filter((j) => {
          const check = verifyResult.checkMap.get(j.id);
          return check && (!check.chainOk || !check.balanceOk);
        })
      : journals;

  // Integrity status card value/color
  const integrityValue = !verifyResult
    ? "—"
    : totalAnomalies === 0
    ? "Intact"
    : "Issues";
  const integrityColor: "gray" | "green" | "red" =
    !verifyResult ? "gray" : totalAnomalies === 0 ? "green" : "red";

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 shadow-sm">
          <ShieldIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ledger Integrity Audit</h1>
          <p className="mt-1 text-gray-500">
            Verify the SHA-256 cryptographic hash chain across all journal entries and
            inspect the complete audit trail.
          </p>
        </div>
      </div>

      {/* Integrity status banner */}
      <div
        className={`mb-6 rounded-xl border p-5 transition-colors ${
          verifyStatus === "idle"
            ? "border-gray-200 bg-gray-50"
            : verifyStatus === "running"
            ? "border-blue-200 bg-blue-50"
            : verifyStatus === "error" ||
              (verifyStatus === "done" && totalAnomalies > 0)
            ? "border-red-200 bg-red-50"
            : "border-green-200 bg-green-50"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {verifyStatus === "idle" ? (
              <ShieldIcon className="h-8 w-8 shrink-0 text-gray-400" />
            ) : verifyStatus === "running" ? (
              <div className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
            ) : verifyStatus === "error" ||
              (verifyStatus === "done" && totalAnomalies > 0) ? (
              <ExclamationIcon className="h-8 w-8 shrink-0 text-red-600" />
            ) : (
              <CheckCircleIcon className="h-8 w-8 shrink-0 text-green-600" />
            )}

            <div>
              {verifyStatus === "idle" && (
                <>
                  <p className="font-semibold text-gray-700">
                    Chain verification not yet run
                  </p>
                  <p className="text-sm text-gray-500">
                    Run a full verification to validate the cryptographic hash chain
                    integrity across all journal entries.
                  </p>
                </>
              )}
              {verifyStatus === "running" && (
                <>
                  <p className="font-semibold text-blue-700">
                    Verifying hash chain…
                  </p>
                  <p className="text-sm text-blue-600">
                    Fetching all journals and checking SHA-256 chain linkage. This may
                    take a moment.
                  </p>
                </>
              )}
              {verifyStatus === "done" && totalAnomalies === 0 && (
                <>
                  <p className="font-semibold text-green-700">
                    Chain intact —{" "}
                    {verifyResult!.totalCount.toLocaleString()} journal
                    {verifyResult!.totalCount !== 1 ? "s" : ""} verified
                  </p>
                  <p className="text-sm text-green-600">
                    All hash links are valid and all journals are balanced. Last
                    checked: {formatDateTime(verifyResult!.verifiedAt)}
                  </p>
                </>
              )}
              {verifyStatus === "done" && totalAnomalies > 0 && (
                <>
                  <p className="font-semibold text-red-700">
                    {totalAnomalies} anomal
                    {totalAnomalies !== 1 ? "ies" : "y"} detected across{" "}
                    {verifyResult!.totalCount.toLocaleString()} journal
                    {verifyResult!.totalCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-red-600">
                    {verifyResult!.chainAnomalies > 0 && (
                      <>
                        {verifyResult!.chainAnomalies} chain break
                        {verifyResult!.chainAnomalies !== 1 ? "s" : ""}
                        {verifyResult!.balanceErrors > 0 ? ", " : ""}
                      </>
                    )}
                    {verifyResult!.balanceErrors > 0 && (
                      <>
                        {verifyResult!.balanceErrors} balance error
                        {verifyResult!.balanceErrors !== 1 ? "s" : ""}
                      </>
                    )}
                    . Last checked: {formatDateTime(verifyResult!.verifiedAt)}
                  </p>
                </>
              )}
              {verifyStatus === "error" && (
                <>
                  <p className="font-semibold text-red-700">Verification failed</p>
                  <p className="text-sm text-red-600">{verifyError}</p>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => void runVerification()}
            disabled={verifyStatus === "running"}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
              verifyStatus === "done"
                ? "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <RefreshIcon
              className={`h-4 w-4 ${verifyStatus === "running" ? "animate-spin" : ""}`}
            />
            {verifyStatus === "done" ? "Re-verify" : "Verify Hash Chain"}
          </button>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Journals"
          value={
            verifyResult?.totalCount ?? (data?.total != null ? data.total : "—")
          }
          color="slate"
          sublabel="Across entire ledger"
        />
        <StatCard
          label="Integrity Status"
          value={integrityValue}
          color={integrityColor}
          sublabel={
            !verifyResult
              ? "Run verification"
              : totalAnomalies === 0
              ? "No issues found"
              : `${totalAnomalies} issue${totalAnomalies !== 1 ? "s" : ""} found`
          }
        />
        <StatCard
          label="Chain Breaks"
          value={verifyResult ? verifyResult.chainAnomalies : "—"}
          color={
            !verifyResult
              ? "gray"
              : verifyResult.chainAnomalies > 0
              ? "red"
              : "green"
          }
          sublabel="Hash linkage failures"
        />
        <StatCard
          label="Balance Errors"
          value={verifyResult ? verifyResult.balanceErrors : "—"}
          color={
            !verifyResult
              ? "gray"
              : verifyResult.balanceErrors > 0
              ? "red"
              : "green"
          }
          sublabel="DR ≠ CR posted entries"
        />
      </div>

      {/* Anomalies panel */}
      {verifyResult && verifyResult.anomalyJournals.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
            <ExclamationIcon className="h-4 w-4" />
            Anomalous Entries ({verifyResult.anomalyJournals.length})
          </h3>
          <div className="space-y-2">
            {verifyResult.anomalyJournals.map((j) => {
              const check = verifyResult.checkMap.get(j.id)!;
              return (
                <div
                  key={j.id}
                  className="flex flex-col gap-2 rounded-lg border border-red-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/u/finance/accounting-transactions/${j.id}`}
                      className="font-mono text-sm font-semibold text-primary hover:underline"
                    >
                      {j.reference}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {formatDate(j.date)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {SOURCE_MODULE_LABELS[j.sourceModule] ?? j.sourceModule}
                    </span>
                    {!check.chainOk && (
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        Chain break — prev hash mismatch
                      </span>
                    )}
                    {!check.balanceOk && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Imbalance: {fmtCurrency(check.balanceImbalance)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium sm:self-auto ${
                      j.status === "posted"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {j.status === "posted" ? "Posted" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Date from</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Date to</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Source module</label>
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value as SourceModule | "");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All modules</option>
            {(Object.keys(SOURCE_MODULE_LABELS) as SourceModule[]).map((m) => (
              <option key={m} value={m}>
                {SOURCE_MODULE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as "" | "pending" | "posted");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All statuses</option>
            <option value="posted">Posted</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        {(dateFrom || dateTo || moduleFilter || statusFilter) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setModuleFilter("");
              setStatusFilter("");
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
        {verifyResult && (
          <label className="ml-auto flex cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={showAnomaliesOnly}
              onChange={(e) => setShowAnomaliesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Show anomalies only
            </span>
          </label>
        )}
      </div>

      {/* Audit table */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load journal entries. Please try again.
        </div>
      ) : (
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
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total DR
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total CR
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Balance
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Chain Link
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Current Hash
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    View
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {displayedJournals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-gray-500">
                      {showAnomaliesOnly
                        ? "No anomalies found on this page."
                        : "No journal entries found."}
                    </td>
                  </tr>
                ) : (
                  displayedJournals.map((journal) => {
                    const check = verifyResult?.checkMap.get(journal.id);
                    const isAnomaly = check && (!check.chainOk || !check.balanceOk);

                    const totalDebit =
                      check?.totalDebit ??
                      journal.lines.reduce(
                        (s, l) =>
                          s + (l.debitAmount != null ? Number(l.debitAmount) : 0),
                        0
                      );
                    const totalCredit =
                      check?.totalCredit ??
                      journal.lines.reduce(
                        (s, l) =>
                          s + (l.creditAmount != null ? Number(l.creditAmount) : 0),
                        0
                      );

                    return (
                      <tr
                        key={journal.id}
                        className={`transition-colors ${
                          isAnomaly
                            ? "bg-red-50 hover:bg-red-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            {isAnomaly && (
                              <ExclamationIcon className="h-3.5 w-3.5 shrink-0 text-red-500" />
                            )}
                            <span className="font-mono text-sm font-semibold text-primary">
                              {journal.reference}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                          {formatDate(journal.date)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                          {SOURCE_MODULE_LABELS[journal.sourceModule] ??
                            journal.sourceModule}
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
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-blue-700">
                          {fmtCurrency(totalDebit)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-rose-700">
                          {fmtCurrency(totalCredit)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {check ? (
                            check.balanceOk ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Balanced
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-medium text-red-600">
                                <ExclamationIcon className="h-3.5 w-3.5" />
                                {fmtCurrency(check.balanceImbalance)}
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {check ? (
                            check.isGenesis ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                Genesis
                              </span>
                            ) : check.chainOk ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Valid
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 font-semibold text-red-600">
                                <ExclamationIcon className="h-3.5 w-3.5" />
                                Break!
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-gray-300">Run verify</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="block max-w-[150px] truncate font-mono text-xs text-gray-400"
                            title={journal.currentHash ?? ""}
                          >
                            {truncateHash(journal.currentHash)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <Link
                            href={`/u/finance/accounting-transactions/${journal.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && !showAnomaliesOnly && (
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
      )}

      {/* How it works */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          How Hash Chain Verification Works
        </h3>
        <div className="grid gap-6 sm:grid-cols-3">
          <ExplainerBlock
            title="SHA-256 Chain"
            body="Each journal entry stores a cryptographic hash of its own content plus the preceding entry's hash. This creates a tamper-evident chain — altering any entry invalidates all subsequent hashes."
          />
          <ExplainerBlock
            title="Chain Link Check"
            body="Verification confirms that each journal's previousHash exactly matches the currentHash of the immediately preceding entry in ledger sequence. Any mismatch is flagged as a chain break."
          />
          <ExplainerBlock
            title="Balance Check"
            body="Every journal must be balanced: total debit lines must equal total credit lines within ₦0.01 tolerance. An imbalanced posted journal indicates a data integrity problem requiring investigation."
          />
        </div>
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-amber-700">
            <span className="font-semibold">Note: </span>
            This tool verifies chain linkage (that each journal correctly references
            its predecessor). It does not recompute the SHA-256 hash from the raw
            journal data, which would require exact knowledge of the server-side
            serialisation format. A chain break indicates either data tampering or a
            system error and must be investigated immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
