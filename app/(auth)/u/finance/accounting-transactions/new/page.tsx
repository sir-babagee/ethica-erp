"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useChartOfAccounts,
  useCreateJournalEntry,
  useFunds,
} from "@/services/finance";
import { useAuthStore } from "@/stores/authStore";
import { formatAmountInputDisplay, parseFormattedNumber } from "@/utils/priceFormatter";
import type {
  CoaGroup,
  CreateJournalLinePayload,
  ShariahTag,
  SourceModule,
  Fund,
} from "@/types";

const SOURCE_MODULE_OPTIONS: { value: SourceModule; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "trade", label: "Trade" },
  { value: "subscription", label: "Subscription" },
  { value: "redemption", label: "Redemption" },
  { value: "nav_adjustment", label: "NAV Adjustment" },
  { value: "fx_revaluation", label: "FX Revaluation" },
  { value: "purification", label: "Purification" },
  { value: "management_fee", label: "Management Fee" },
  { value: "payroll", label: "Payroll" },
];

const SHARIAH_TAG_OPTIONS: { value: ShariahTag; label: string }[] = [
  { value: "halal", label: "Halal" },
  { value: "haram", label: "Haram" },
  { value: "purification", label: "Purification" },
];

const CURRENCY_OPTIONS = ["NGN", "USD"] as const;

function resolveAccountLabel(
  accountNumber: string,
  groups: CoaGroup[]
): string | null {
  if (accountNumber.length < 4) return null;
  const prefix = parseInt(accountNumber.slice(0, 4), 10);
  if (isNaN(prefix)) return null;
  for (const group of groups) {
    const sub = group.subGroups.find((s) => s.code === prefix);
    if (sub) return `${sub.name} (${group.name})`;
    if (prefix >= group.code && prefix <= group.code + 999)
      return group.name;
  }
  return null;
}

interface LineState {
  account: string;
  side: "DR" | "CR";
  amountDisplay: string;
  shariahTag: ShariahTag | "";
  currency: string;
  fxRate: number;
  fxLoading: boolean;
}

function emptyLine(): LineState {
  return {
    account: "",
    side: "DR",
    amountDisplay: "",
    shariahTag: "",
    currency: "NGN",
    fxRate: 1,
    fxLoading: false,
  };
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: coaGroups } = useChartOfAccounts();
  const { data: funds } = useFunds();
  const mutation = useCreateJournalEntry();

  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [sourceModule, setSourceModule] = useState<SourceModule>("manual");
  const [narration, setNarration] = useState("");
  const [fundId, setFundId] = useState("");
  const [clientId, setClientId] = useState("");
  const [lines, setLines] = useState<LineState[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");
  const [fxRateCache, setFxRateCache] = useState<Record<string, number>>({});

  const handleCurrencyChange = async (idx: number, currency: string) => {
    if (currency === "NGN") {
      updateLine(idx, { currency, fxRate: 1, fxLoading: false });
      return;
    }

    if (fxRateCache[currency]) {
      updateLine(idx, { currency, fxRate: fxRateCache[currency], fxLoading: false });
      return;
    }

    updateLine(idx, { currency, fxRate: 1, fxLoading: true });

    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${currency}`);
      const data = await res.json();
      const rate: number = data?.rates?.NGN;
      if (rate) {
        setFxRateCache((prev) => ({ ...prev, [currency]: rate }));
        setLines((prev) =>
          prev.map((l, i) => (i === idx ? { ...l, fxRate: rate, fxLoading: false } : l))
        );
      } else {
        setLines((prev) =>
          prev.map((l, i) => (i === idx ? { ...l, fxLoading: false } : l))
        );
      }
    } catch {
      setLines((prev) =>
        prev.map((l, i) => (i === idx ? { ...l, fxLoading: false } : l))
      );
    }
  };

  const groups = coaGroups ?? [];

  const updateLine = (index: number, patch: Partial<LineState>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l))
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Running totals — all converted to NGN functional currency via fxRate
  const totalDebit = lines
    .filter((l) => l.side === "DR")
    .reduce((s, l) => s + (parseFormattedNumber(l.amountDisplay) || 0) * l.fxRate, 0);
  const totalCredit = lines
    .filter((l) => l.side === "CR")
    .reduce((s, l) => s + (parseFormattedNumber(l.amountDisplay) || 0) * l.fxRate, 0);
  const hasForeignLines = lines.some((l) => l.currency !== "NGN");
  const isBalanced =
    totalDebit > 0 &&
    totalCredit > 0 &&
    Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.account.length !== 10) {
        setError(`Line ${i + 1}: account must be exactly 10 digits`);
        return;
      }
      if (!resolveAccountLabel(line.account, groups)) {
        setError(`Line ${i + 1}: account prefix not found in Chart of Accounts`);
        return;
      }
      const amount = parseFormattedNumber(line.amountDisplay);
      if (!amount || amount <= 0) {
        setError(`Line ${i + 1}: amount must be greater than zero`);
        return;
      }
    }

    if (!isBalanced) {
      setError(
        `Journal is not balanced. Total DR: ₦${totalDebit.toLocaleString()} ≠ Total CR: ₦${totalCredit.toLocaleString()}`
      );
      return;
    }

    const payload: CreateJournalLinePayload[] = lines.map((l) => {
      const amount = parseFormattedNumber(l.amountDisplay) || 0;
      const base: CreateJournalLinePayload = {
        account: l.account,
        currency: l.currency || "NGN",
        ...(l.currency !== "NGN" && l.fxRate > 1 ? { fxRate: l.fxRate } : {}),
        ...(l.shariahTag ? { shariahTag: l.shariahTag } : {}),
      };
      return l.side === "DR"
        ? { ...base, debitAmount: amount }
        : { ...base, creditAmount: amount };
    });

    try {
      await mutation.mutateAsync({
        date,
        sourceModule,
        narration: narration.trim() || undefined,
        fundId: fundId || undefined,
        clientId: clientId.trim() || undefined,
        lines: payload,
      });
      router.push("/u/finance/accounting-transactions");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message ?? "Failed to create journal entry";
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Journal Entries
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Journal Entry</h1>
        <p className="mt-1 text-gray-500">
          Create a multi-line double-entry journal. The entry will be saved as{" "}
          <span className="font-medium text-amber-600">Pending</span> until
          approved by an authorised officer.
        </p>
      </div>

      {!user?.branchId && (
        <div className="mx-auto mb-6 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex gap-3">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-red-800">
                Branch not assigned — cannot post entries
              </p>
              <p className="mt-0.5 text-sm text-red-700">
                Every journal entry must be traceable to a branch. Your account
                does not have a branch assigned yet. Contact an administrator to
                update your profile before posting.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
        {/* Header fields */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Journal Header
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Date */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Journal Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Source module */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Source Module
              </label>
              <select
                required
                value={sourceModule}
                onChange={(e) =>
                  setSourceModule(e.target.value as SourceModule)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SOURCE_MODULE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fund */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fund{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No fund selected</option>
                {(funds ?? [])
                  .filter((f) => f.isActive)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
              </select>
              {(!funds || funds.length === 0) && (
                <p className="mt-1 text-xs text-amber-600">
                  No funds configured yet. Create funds under Finance → Funds.
                </p>
              )}
            </div>

            {/* Client ID */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Client ID{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Investor / client identifier"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Branch (entity) — auto-populated, display only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Branch
              </label>
              <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <svg
                  className="mr-2 h-4 w-4 shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-xs text-gray-500">
                  Auto-populated from your branch assignment
                </span>
              </div>
            </div>

            {/* Narration */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Narration{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Description or memo for this journal"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Journal lines */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Journal Lines
            </h2>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg
                className="h-3.5 w-3.5"
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
              Add Line
            </button>
          </div>

          {/* Column headers */}
          <div className="mb-2 hidden grid-cols-[2fr_1fr_2fr_1.5fr_1.5fr_auto] gap-2 px-1 sm:grid">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Account
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              DR / CR
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Amount
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Shari&apos;ah Tag
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Currency
            </span>
            <span />
          </div>

          <div className="space-y-3">
            {lines.map((line, idx) => {
              const label = resolveAccountLabel(line.account, groups);
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[2fr_1fr_2fr_1.5fr_1.5fr_auto] sm:items-start sm:border-0 sm:bg-transparent sm:p-0"
                >
                  {/* Account */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 sm:hidden">
                      Account
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="10-digit account"
                      value={line.account}
                      onChange={(e) =>
                        updateLine(idx, {
                          account: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className={`w-full rounded-lg border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        line.account.length === 10 && !label
                          ? "border-red-400"
                          : "border-gray-300 focus:border-primary"
                      }`}
                    />
                    {line.account.length >= 4 && (
                      <p
                        className={`mt-0.5 text-xs ${
                          label ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {label ?? "No COA match"}
                      </p>
                    )}
                  </div>

                  {/* DR / CR toggle */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 sm:hidden">
                      DR / CR
                    </label>
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                      {(["DR", "CR"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateLine(idx, { side: s })}
                          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                            line.side === s
                              ? s === "DR"
                                ? "bg-blue-600 text-white"
                                : "bg-rose-600 text-white"
                              : "bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 sm:hidden">
                      Amount
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={line.amountDisplay}
                      onChange={(e) =>
                        updateLine(idx, {
                          amountDisplay: formatAmountInputDisplay(
                            e.target.value
                          ),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {line.currency !== "NGN" &&
                      (parseFormattedNumber(line.amountDisplay) ?? 0) > 0 &&
                      !line.fxLoading && (
                        <p className="mt-0.5 text-xs text-blue-600">
                          ≈ ₦
                          {(
                            (parseFormattedNumber(line.amountDisplay) ?? 0) *
                            line.fxRate
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                  </div>

                  {/* Shari'ah tag */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 sm:hidden">
                      Shari&apos;ah Tag
                    </label>
                    <select
                      value={line.shariahTag}
                      onChange={(e) =>
                        updateLine(idx, {
                          shariahTag: e.target.value as ShariahTag | "",
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">None</option>
                      {SHARIAH_TAG_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500 sm:hidden">
                      Currency
                    </label>
                    <select
                      value={line.currency}
                      onChange={(e) => handleCurrencyChange(idx, e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {line.currency !== "NGN" && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {line.fxLoading
                          ? "Fetching rate…"
                          : `1 ${line.currency} ≈ ₦${line.fxRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  <div className="flex items-start pt-2">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      disabled={lines.length <= 2}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                      title="Remove line"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Running totals */}
          <div
            className={`mt-5 rounded-lg border p-4 ${
              isBalanced
                ? "border-green-200 bg-green-50"
                : totalDebit > 0 || totalCredit > 0
                ? "border-amber-200 bg-amber-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {hasForeignLines && (
              <p className="mb-2 text-xs text-gray-500">
                Totals shown in NGN equivalent at live rates
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Total DR</p>
                  <p className="font-semibold text-blue-700">
                    ₦{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total CR</p>
                  <p className="font-semibold text-rose-700">
                    ₦{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Difference</p>
                  <p
                    className={`font-bold ${
                      isBalanced ? "text-green-700" : "text-amber-700"
                    }`}
                  >
                    {isBalanced
                      ? "✓ Balanced"
                      : `₦${Math.abs(totalDebit - totalCredit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </p>
                </div>
              </div>
              {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                <p className="text-xs text-amber-700">
                  Journal must balance before it can be submitted
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <Link
            href="/u/finance/accounting-transactions"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending || !isBalanced || !user?.branchId}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? "Saving…" : "Save as Pending"}
          </button>
        </div>
      </form>
    </div>
  );
}
