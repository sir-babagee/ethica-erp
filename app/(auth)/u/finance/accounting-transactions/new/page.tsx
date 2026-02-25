"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useChartOfAccounts, useCreateAccountingTransaction } from "@/services/finance";
import { formatAmountInputDisplay, parseFormattedNumber } from "@/utils/priceFormatter";
import type {
  CoaGroup,
  CreateAccountingTransactionPayload,
} from "@/types";

function resolveAccountLabel(
  accountNumber: string,
  groups: CoaGroup[]
): string | null {
  if (accountNumber.length < 4) return null;
  const prefix = parseInt(accountNumber.slice(0, 4), 10);
  if (isNaN(prefix)) return null;

  for (const group of groups) {
    // Check sub-groups first
    const sub = group.subGroups.find((s) => s.code === prefix);
    if (sub) return `${sub.name} (${group.name})`;

    // Fall back to group range
    if (prefix >= group.code && prefix <= group.code + 999) {
      return group.name;
    }
  }

  return null;
}

export default function NewAccountingTransactionPage() {
  const router = useRouter();
  const { data: coaGroups } = useChartOfAccounts();
  const mutation = useCreateAccountingTransaction();

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    debitAccount: "",
    creditAccount: "",
    narration: "",
  });
  const [amountDisplay, setAmountDisplay] = useState("");
  const [error, setError] = useState("");

  const groups = coaGroups ?? [];
  const amountNum = parseFormattedNumber(amountDisplay);

  const debitLabel = resolveAccountLabel(form.debitAccount, groups);
  const creditLabel = resolveAccountLabel(form.creditAccount, groups);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.debitAccount.length !== 10) {
      setError("Debit account must be exactly 10 digits");
      return;
    }
    if (form.creditAccount.length !== 10) {
      setError("Credit account must be exactly 10 digits");
      return;
    }
    if (form.debitAccount === form.creditAccount) {
      setError("Debit and credit accounts cannot be the same");
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    try {
      await mutation.mutateAsync({
        ...form,
        amount: amountNum,
        narration: form.narration?.trim() || undefined,
      });
      router.push("/u/finance/accounting-transactions");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? "Failed to post transaction";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/u/finance/accounting-transactions"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Transactions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Post Transaction</h1>
        <p className="mt-1 text-gray-500">
          Record a new double-entry accounting transaction
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">
            {/* Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Amount (₦)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0.00"
                value={amountDisplay}
                onChange={(e) =>
                  setAmountDisplay(formatAmountInputDisplay(e.target.value))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Debit Account */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Debit Account (DR)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="10-digit account number"
                value={form.debitAccount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, debitAccount: val }));
                }}
                className={`w-full rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                  form.debitAccount.length === 10 && !debitLabel
                    ? "border-red-400 focus:border-red-400"
                    : "border-gray-300 focus:border-primary"
                }`}
              />
              {form.debitAccount.length >= 4 && (
                <p
                  className={`mt-1 text-xs ${
                    debitLabel ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {debitLabel
                    ? `✓ ${debitLabel}`
                    : "No matching COA entry found for this prefix"}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {form.debitAccount.length}/10 digits
              </p>
            </div>

            {/* Credit Account */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Credit Account (CR)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="10-digit account number"
                value={form.creditAccount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setForm((f) => ({ ...f, creditAccount: val }));
                }}
                className={`w-full rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                  form.creditAccount.length === 10 && !creditLabel
                    ? "border-red-400 focus:border-red-400"
                    : "border-gray-300 focus:border-primary"
                }`}
              />
              {form.creditAccount.length >= 4 && (
                <p
                  className={`mt-1 text-xs ${
                    creditLabel ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {creditLabel
                    ? `✓ ${creditLabel}`
                    : "No matching COA entry found for this prefix"}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {form.creditAccount.length}/10 digits
              </p>
            </div>

            {/* Entry Summary */}
            {form.debitAccount.length === 10 &&
              form.creditAccount.length === 10 &&
              amountNum > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Entry Preview
                  </p>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>
                      <span className="font-medium">DR</span>{" "}
                      <span className="font-mono">{form.debitAccount}</span>
                      {debitLabel && (
                        <span className="ml-1 text-blue-600">({debitLabel})</span>
                      )}{" "}
                      ........................................{" "}
                      <span className="font-semibold">
                        ₦{amountNum.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">CR</span>{" "}
                      <span className="font-mono">{form.creditAccount}</span>
                      {creditLabel && (
                        <span className="ml-1 text-blue-600">({creditLabel})</span>
                      )}{" "}
                      ........................................{" "}
                      <span className="font-semibold">
                        ₦{amountNum.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              )}

            {/* Narration */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Narration{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Description or memo for this transaction"
                value={form.narration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, narration: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/u/finance/accounting-transactions"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {mutation.isPending ? "Posting…" : "Post Transaction"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
