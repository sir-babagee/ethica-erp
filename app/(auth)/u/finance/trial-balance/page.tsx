"use client";

import { useState, Fragment } from "react";
import { useTrialBalance } from "@/services/finance";
import { fmtCurrency } from "@/utils/formatters";

const ACCOUNT_TYPE_ORDER = [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense",
] as const;

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expenses",
};

export default function TrialBalancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOfDate, setAsOfDate] = useState(today);

  const { data: tbData, isLoading, error } = useTrialBalance(asOfDate);

  const minDate = tbData?.firstTransactionDate ?? undefined;
  const maxDate = today;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Trial Balance</h1>
        <p className="mt-1 text-gray-500">
          View trial balance as of any date. Includes all transactions with
          transaction date on or before the selected date. Backdated
          transactions are automatically reflected.
        </p>
      </div>

      {/* Date picker */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              As of Date
            </label>
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
            <div
              key={i}
              className="h-12 rounded-xl border border-gray-200 bg-gray-100"
            />
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
            <h2 className="text-lg font-semibold text-gray-900">
              Trial Balance as of {asOfDate}
            </h2>
            {!tbData.balances && (
              <p className="mt-1 text-sm font-medium text-amber-700">
                ⚠ Total debits do not equal total credits. Please verify
                transactions.
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Account
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Code
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Debit
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Credit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {ACCOUNT_TYPE_ORDER.map((accountType) => {
                  const accounts = tbData.accountsByType[accountType] ?? [];
                  if (accounts.length === 0) return null;

                  return (
                    <Fragment key={accountType}>
                      <tr className="bg-gray-100">
                        <td
                          colSpan={4}
                          className="px-5 py-2 text-sm font-semibold text-gray-700"
                        >
                          {ACCOUNT_TYPE_LABELS[accountType] ?? accountType}
                        </td>
                      </tr>
                      {accounts.map((acc) => (
                        <tr
                          key={`${acc.code}-${acc.isGroup}`}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-5 py-3 text-sm text-gray-900">
                            {acc.isGroup ? (
                              acc.name
                            ) : (
                              <span className="pl-4 text-gray-700">
                                {acc.name}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 font-mono text-sm text-gray-600">
                            {acc.code}
                          </td>
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
                  <td
                    colSpan={2}
                    className="px-5 py-3 text-sm font-bold text-gray-900"
                  >
                    Total
                  </td>
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

          {Object.keys(tbData.accountsByType).length === 0 && (
            <div className="border-t border-gray-200 px-5 py-12 text-center text-gray-500">
              No chart of accounts configured, or no transactions as of this
              date.
              {tbData.firstTransactionDate && (
                <p className="mt-2 text-sm">
                  First transaction was on {tbData.firstTransactionDate}. Try
                  selecting that date or later.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
