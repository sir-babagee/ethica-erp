"use client";

import { useState, Fragment } from "react";
import { useTrialBalance, useFunds } from "@/services/finance";
import type { Fund } from "@/types";
import { fmtCurrency } from "@/utils/formatters";

const ACCOUNT_TYPE_ORDER = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
  "fund_control",
  "suspense",
] as const;

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses",
  fund_control: "Fund / Client Control",
  suspense: "Suspense / Off-Balance",
};

// ─── Context switcher ─────────────────────────────────────────────────────────

function ContextSwitcher({
  funds,
  selectedFundId,
  onSelect,
}: {
  funds: Fund[];
  selectedFundId: string | null;
  onSelect: (fundId: string | null) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-gray-500">Viewing:</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
          selectedFundId === null
            ? "bg-primary text-white shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Branch
      </button>
      {funds.map((fund) => (
        <button
          key={fund.id}
          type="button"
          onClick={() => onSelect(fund.id)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            selectedFundId === fund.id
              ? "bg-primary text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {fund.code} — {fund.name}
        </button>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TrialBalancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(today);
  // null = branch mode; string = fundId for fund mode
  const [activeFundId, setActiveFundId] = useState<string | null>(null);

  const { data: funds } = useFunds();
  const fundIdParam = activeFundId ?? undefined;

  const { data: tbData, isLoading, error } = useTrialBalance(asOfDate, fundIdParam);

  const minDate = tbData?.firstTransactionDate ?? undefined;
  const maxDate = today;

  const activeFund = funds?.find((f) => f.id === activeFundId) ?? null;
  const contextLabel = activeFund
    ? `${activeFund.code} — ${activeFund.name}`
    : "Branch";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
        <p className="mt-1 text-gray-500">
          View trial balance as of any date. Switch between branch and fund views
          using the buttons below.
        </p>
      </div>

      {/* Branch / Fund switcher */}
      {funds && funds.length > 0 && (
        <ContextSwitcher
          funds={funds}
          selectedFundId={activeFundId}
          onSelect={setActiveFundId}
        />
      )}

      {/* Active context banner */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-500">Showing entries for:</span>
        <span className="rounded-full bg-primary/10 px-3 py-0.5 text-sm font-medium text-primary">
          {contextLabel}
        </span>
      </div>

      {/* Date picker */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">As of Date</label>
            <input
              type="date"
              value={asOfDate}
              min={minDate}
              max={maxDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {tbData?.firstTransactionDate && (
            <p className="text-sm text-gray-500">
              First transaction: {tbData.firstTransactionDate}
            </p>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load trial balance. Please try a different date.
        </div>
      )}

      {/* Trial balance table */}
      {tbData && !isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Trial Balance as of {asOfDate}
              </h2>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {contextLabel}
              </span>
            </div>
            {!tbData.balances && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                ⚠ Total debits do not equal total credits. Please verify transactions.
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Account</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Debit</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {ACCOUNT_TYPE_ORDER.map((accountType) => {
                  const accounts = (tbData.accountsByType[accountType] ?? []).filter(
                    (acc) => acc.debit !== 0 || acc.credit !== 0
                  );
                  if (accounts.length === 0) return null;

                  return (
                    <Fragment key={accountType}>
                      <tr className="bg-gray-100">
                        <td colSpan={4} className="px-5 py-2 text-sm font-semibold text-gray-700">
                          {ACCOUNT_TYPE_LABELS[accountType] ?? accountType}
                        </td>
                      </tr>
                      {accounts.map((acc) => (
                        <tr key={`${acc.code}-${acc.isGroup}`} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm text-gray-900">
                            {acc.isGroup ? (
                              acc.name
                            ) : (
                              <span className="pl-4 text-gray-700">{acc.name}</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-sm text-gray-600">{acc.code}</td>
                          <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-medium text-gray-900">
                            {acc.debit > 0 ? fmtCurrency(acc.debit) : "—"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-medium text-gray-900">
                            {acc.credit > 0 ? fmtCurrency(acc.credit) : "—"}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td colSpan={2} className="px-5 py-3 text-sm font-bold text-gray-900">Total</td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-bold text-gray-900">
                    {fmtCurrency(tbData.totalDebit)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-sm font-bold text-gray-900">
                    {fmtCurrency(tbData.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {!([...ACCOUNT_TYPE_ORDER] as string[]).some(
            (t) =>
              (tbData.accountsByType[t] ?? []).filter(
                (acc) => acc.debit !== 0 || acc.credit !== 0
              ).length > 0
          ) && (
            <div className="border-t border-gray-200 px-5 py-12 text-center text-gray-500">
              No chart of accounts configured, or no transactions as of this date
              for {contextLabel}.
              {tbData.firstTransactionDate && (
                <p className="mt-2 text-sm">
                  First transaction was on {tbData.firstTransactionDate}. Try selecting
                  that date or later.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
