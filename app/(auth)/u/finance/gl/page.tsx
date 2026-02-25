"use client";

import { useState } from "react";
import { useGl, useChartOfAccounts, useAccountingTransactions } from "@/services/finance";
import type { CoaGroup } from "@/types";
import { fmtCurrency } from "@/utils/formatters";

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  asset: "bg-blue-100 text-blue-700",
  liability: "bg-red-100 text-red-700",
  equity: "bg-purple-100 text-purple-700",
  revenue: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function buildAccountOptions(groups: CoaGroup[]) {
  const options: { value: string; label: string; groupName: string }[] = [];
  for (const group of groups) {
    options.push({
      value: String(group.code),
      label: `${group.code} – ${group.name} (entire range)`,
      groupName: group.name,
    });
    for (const sub of group.subGroups) {
      options.push({
        value: String(sub.code),
        label: `  ${sub.code} – ${sub.name}`,
        groupName: group.name,
      });
    }
  }
  return options;
}

export default function GlPage() {
  const [accountInput, setAccountInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeQuery, setActiveQuery] = useState<{
    account: string;
    dateFrom?: string;
    dateTo?: string;
  } | null>(null);

  const { data: coaGroups } = useChartOfAccounts();
  const groups = coaGroups ?? [];
  const accountOptions = buildAccountOptions(groups);

  // Default view — all recent transactions (no account filter)
  const {
    data: allTxData,
    isLoading: allTxLoading,
  } = useAccountingTransactions(1, 100, undefined, undefined, undefined);

  // Filtered GL view — only active when account query is set
  const { data: glData, isLoading: glLoading, error: glError } = useGl(
    activeQuery?.account ?? "",
    activeQuery?.dateFrom,
    activeQuery?.dateTo,
    1,
    200
  );

  const isLoading = activeQuery ? glLoading : allTxLoading;
  const error = activeQuery ? glError : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = accountInput.trim();
    if (!trimmed) return;
    setActiveQuery({
      account: trimmed,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  const handleClear = () => {
    setActiveQuery(null);
    setAccountInput("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        <p className="mt-1 text-gray-500">
          View all transactions for a specific account or account group
        </p>
      </div>

      {/* Search form */}
      <form
        onSubmit={handleSearch}
        className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Account Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="4-digit or 10-digit account"
                value={accountInput}
                onChange={(e) =>
                  setAccountInput(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value=""
                onChange={(e) => setAccountInput(e.target.value)}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Browse COA</option>
                {accountOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              4-digit = entire sub-group, 10-digit = specific account
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            disabled={!accountInput}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            View GL
          </button>
          {activeQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Loading state */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      )}

      {/* Filter error */}
      {error && activeQuery && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {(error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to load GL data. Please check the account code."}
        </div>
      )}

      {/* Default view — all transactions, no account filter */}
      {!activeQuery && !isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <p className="text-sm font-medium text-gray-700">
              All Transactions{" "}
              <span className="ml-1 text-xs font-normal text-gray-400">
                — use the filter above to view a specific account GL
              </span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reference</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Narration</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Debit Account (DR)</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Credit Account (CR)</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {(allTxData?.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                      No transactions posted yet.
                    </td>
                  </tr>
                ) : (
                  (allTxData?.data ?? []).map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-600">
                        {formatDate(tx.date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="font-mono text-sm font-medium text-primary">
                          {tx.reference}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {tx.narration ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-sm text-gray-900">
                        {tx.debitAccount}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-sm text-gray-900">
                        {tx.creditAccount}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-gray-900">
                        {fmtCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtered GL view */}
      {activeQuery && glData && !isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* GL Header */}
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-gray-900">
                    {glData.account}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ACCOUNT_TYPE_COLORS[glData.accountType] ??
                      "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {glData.accountType.charAt(0).toUpperCase() +
                      glData.accountType.slice(1)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-gray-600">
                  {glData.accountName}
                </p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-xs text-gray-500">Total DR</p>
                  <p className="font-semibold text-gray-900">
                    {fmtCurrency(glData.totalDebit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total CR</p>
                  <p className="font-semibold text-gray-900">
                    {fmtCurrency(glData.totalCredit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p
                    className={`font-bold ${
                      glData.balance >= 0 ? "text-gray-900" : "text-red-600"
                    }`}
                  >
                    {glData.balance < 0 ? "(" : ""}
                    {fmtCurrency(Math.abs(glData.balance))}
                    {glData.balance < 0 ? ")" : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* GL Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Reference
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Narration
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    DR
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    CR
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Running Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {glData.entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No transactions found for this account
                      {activeQuery?.dateFrom || activeQuery?.dateTo
                        ? " in the selected date range"
                        : ""}
                      .
                    </td>
                  </tr>
                ) : (
                  glData.entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-sm text-gray-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span className="font-mono text-sm font-medium text-primary">
                          {entry.reference}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {entry.narration ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-medium text-gray-900">
                        {entry.debit !== null
                          ? fmtCurrency(entry.debit)
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-medium text-gray-900">
                        {entry.credit !== null
                          ? fmtCurrency(entry.credit)
                          : "—"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3 text-right text-sm font-semibold ${
                          entry.runningBalance >= 0
                            ? "text-gray-900"
                            : "text-red-600"
                        }`}
                      >
                        {entry.runningBalance < 0 ? "(" : ""}
                        {fmtCurrency(Math.abs(entry.runningBalance))}
                        {entry.runningBalance < 0 ? ")" : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Totals footer */}
              {glData.entries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                    <td
                      colSpan={3}
                      className="px-5 py-3 text-sm font-semibold text-gray-700"
                    >
                      Total
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-gray-900">
                      {fmtCurrency(glData.totalDebit)}
                    </td>
                    <td className="px-5 py-3 text-right text-sm text-gray-900">
                      {fmtCurrency(glData.totalCredit)}
                    </td>
                    <td
                      className={`px-5 py-3 text-right text-sm font-bold ${
                        glData.balance >= 0 ? "text-gray-900" : "text-red-600"
                      }`}
                    >
                      {glData.balance < 0 ? "(" : ""}
                      {fmtCurrency(Math.abs(glData.balance))}
                      {glData.balance < 0 ? ")" : ""}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
