"use client";

import { useState } from "react";
import {
  useCoaBalances,
  useLedgerDetail,
  useGl,
} from "@/services/finance";
import type { SubledgerBalance } from "@/types";
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

function formatBalance(balance: number): string {
  const formatted = fmtCurrency(Math.abs(balance));
  return balance < 0 ? `(${formatted})` : formatted;
}

function SubledgerExpandable({
  subledger,
  dateFrom,
  dateTo,
}: {
  subledger: SubledgerBalance;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: glData, isLoading } = useGl(
    expanded ? String(subledger.code) : "",
    dateFrom,
    dateTo,
    1,
    200
  );
  const entries = glData?.entries ?? [];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 text-left transition-colors"
      >
        <span className="font-medium text-gray-900">
          {subledger.code} — {subledger.name}
        </span>
        <span className="flex items-center gap-3">
          <span
            className={`font-semibold ${
              subledger.balance >= 0 ? "text-gray-900" : "text-red-600"
            }`}
          >
            {formatBalance(subledger.balance)}
          </span>
          <span className="text-gray-500">
            {expanded ? "▼" : "▶"}
          </span>
        </span>
      </button>
      {expanded && (
        <div className="border-t border-gray-200 bg-white">
          {isLoading ? (
            <div className="px-5 py-8 animate-pulse text-center text-gray-500 text-sm">
              Loading transactions...
            </div>
          ) : entries.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-500 text-sm">
              No transactions in this subledger
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Reference
                    </th>
                    <th className="px-5 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Narration
                    </th>
                    <th className="px-5 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      DR
                    </th>
                    <th className="px-5 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      CR
                    </th>
                    <th className="px-5 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Running Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-2 text-sm text-gray-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2">
                        <span className="font-mono text-sm font-medium text-primary">
                          {entry.reference}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-sm text-gray-500">
                        {entry.narration ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2 text-right text-sm">
                        {entry.debit != null ? fmtCurrency(entry.debit) : "—"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-2 text-right text-sm">
                        {entry.credit != null ? fmtCurrency(entry.credit) : "—"}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-2 text-right text-sm font-semibold ${
                          entry.runningBalance >= 0
                            ? "text-gray-900"
                            : "text-red-600"
                        }`}
                      >
                        {formatBalance(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GlPage() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dateFromParam = dateFrom || undefined;
  const dateToParam = dateTo || undefined;

  const { data: coaBalances, isLoading: balancesLoading } = useCoaBalances(
    dateFromParam,
    dateToParam
  );

  const { data: ledgerData, isLoading: ledgerLoading } = useLedgerDetail(
    selectedAccount ?? "",
    dateFromParam,
    dateToParam,
    1,
    200
  );

  const headAccounts = (coaBalances ?? []).filter((a) => a.isGroup);

  const handleRowClick = (code: number) => {
    setSelectedAccount(String(code));
  };

  const handleBack = () => {
    setSelectedAccount(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        <p className="mt-1 text-gray-500">
          Head Chart of Accounts with balances. Click to open and view
          subledgers (expandable) and direct transactions posted to the head.
        </p>
      </div>

      {/* Date filter */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {balancesLoading && !selectedAccount && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      )}

      {/* COA Balances view (default) */}
      {!selectedAccount && !balancesLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <p className="text-sm font-medium text-gray-700">
              Head Chart of Accounts — Balances
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Account Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {headAccounts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No chart of accounts configured. Add account groups in
                      Chart of Accounts first.
                    </td>
                  </tr>
                ) : (
                  headAccounts.map((item) => (
                    <tr
                      key={item.code}
                      onClick={() => handleRowClick(item.code)}
                      className="cursor-pointer transition-colors hover:bg-primary/5"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-sm font-medium text-gray-900">
                        {item.code}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {item.name}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ACCOUNT_TYPE_COLORS[item.accountType] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.accountType.charAt(0).toUpperCase() +
                            item.accountType.slice(1)}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-3 text-right text-sm font-semibold ${
                          item.balance >= 0 ? "text-gray-900" : "text-red-600"
                        }`}
                      >
                        {formatBalance(item.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ledger detail view */}
      {selectedAccount && (
        <div className="space-y-6">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            ← Back to Head Chart of Accounts
          </button>

          {ledgerLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl border border-gray-200 bg-gray-100"
                />
              ))}
            </div>
          ) : ledgerData ? (
            <>
              {/* Ledger header */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-bold text-gray-900">
                          {ledgerData.account}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            ACCOUNT_TYPE_COLORS[ledgerData.accountType] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ledgerData.accountType.charAt(0).toUpperCase() +
                            ledgerData.accountType.slice(1)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {ledgerData.accountName}
                      </p>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-xs text-gray-500">Total DR</p>
                        <p className="font-semibold text-gray-900">
                          {fmtCurrency(ledgerData.totalDebit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total CR</p>
                        <p className="font-semibold text-gray-900">
                          {fmtCurrency(ledgerData.totalCredit)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p
                          className={`font-bold ${
                            ledgerData.balance >= 0
                              ? "text-gray-900"
                              : "text-red-600"
                          }`}
                        >
                          {formatBalance(ledgerData.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subledgers (expandable to see transactions) */}
                {ledgerData.subledgerBalances &&
                  ledgerData.subledgerBalances.length > 0 && (
                    <div className="border-b border-gray-200 px-5 py-4">
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">
                        Subledgers
                      </h3>
                      <p className="mb-3 text-xs text-gray-500">
                        Click to expand and view transactions
                      </p>
                      <div className="space-y-2">
                        {ledgerData.subledgerBalances.map((sub) => (
                          <SubledgerExpandable
                            key={sub.code}
                            subledger={sub}
                            dateFrom={dateFromParam}
                            dateTo={dateToParam}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* All transactions for this account/group (1000-1999 for Assets, etc.) */}
                <div className="overflow-x-auto">
                  <div className="border-b border-gray-200 bg-gray-50 px-5 py-2">
                    <p className="text-sm font-medium text-gray-700">
                      All Transactions
                    </p>
                  </div>
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
                      {ledgerData.entries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center text-gray-500"
                          >
                            No transactions found for this account
                            {dateFromParam || dateToParam
                              ? " in the selected date range"
                              : ""}
                            .
                          </td>
                        </tr>
                      ) : (
                        ledgerData.entries.map((entry) => (
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
                              {formatBalance(entry.runningBalance)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {ledgerData.entries.length > 0 && (
                      <tfoot>
                        <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                          <td
                            colSpan={3}
                            className="px-5 py-3 text-sm font-semibold text-gray-700"
                          >
                            Total
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-gray-900">
                            {fmtCurrency(
                              ledgerData.entries.reduce(
                                (s, e) => s + (e.debit ?? 0),
                                0
                              )
                            )}
                          </td>
                          <td className="px-5 py-3 text-right text-sm text-gray-900">
                            {fmtCurrency(
                              ledgerData.entries.reduce(
                                (s, e) => s + (e.credit ?? 0),
                                0
                              )
                            )}
                          </td>
                          <td
                            className={`px-5 py-3 text-right text-sm font-bold ${
                              (ledgerData.entries.at(-1)?.runningBalance ??
                                ledgerData.balance) >= 0
                                ? "text-gray-900"
                                : "text-red-600"
                            }`}
                          >
                            {formatBalance(
                              ledgerData.entries.at(-1)?.runningBalance ??
                                ledgerData.balance
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
