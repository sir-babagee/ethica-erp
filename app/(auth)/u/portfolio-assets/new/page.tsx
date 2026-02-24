"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LabeledField } from "@/components/LabeledField";
import { NumberInput } from "@/components/NumberInput";
import { ReadonlyField } from "@/components/ReadonlyField";
import { formatAmountInputDisplay, parseFormattedNumber } from "@/utils/priceFormatter";
import { fmtCurrency } from "@/utils/formatters";
import { useCreatePortfolioAsset } from "@/services/portfolio-assets";
import { SubmitConfirmModal } from "./_components/SubmitConfirmModal";
import { AfterSaveModal } from "./_components/AfterSaveModal";

function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function computeEndDate(startDate: string, tenorDays: number): string {
  if (!startDate || tenorDays <= 0) return "";
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + tenorDays);
  return toDateInput(end);
}

function computeAccruedDaysCutoff(startDate: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function computeDaysToMaturity(endDate: string): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function computeAccruedProfit(
  amount: number,
  profitRate: number,
  days: number
): number {
  if (amount <= 0 || days < 0) return 0;
  return (amount * (profitRate / 100) * days) / 365;
}

export default function NewPortfolioAssetPage() {
  const router = useRouter();
  const today = toDateInput(new Date());

  const createMutation = useCreatePortfolioAsset();

  const [counterParty, setCounterParty] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [profitRate, setProfitRate] = useState("");
  const [investmentTenorDays, setInvestmentTenorDays] = useState("");
  const [investmentStartDate, setInvestmentStartDate] = useState(today);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [createdAsset, setCreatedAsset] = useState<{
    id: string;
    portfolioAssetId: string;
  } | null>(null);

  function handleInvestmentAmountChange(raw: string) {
    setInvestmentAmount(formatAmountInputDisplay(raw));
  }

  function handleTenorDaysChange(value: string) {
    if (value === "") {
      setInvestmentTenorDays("");
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setInvestmentTenorDays(String(num));
    }
  }

  const tenorDaysNum = parseInt(investmentTenorDays, 10) || 0;

  const accruedDaysCutoffNum = useMemo(
    () => computeAccruedDaysCutoff(investmentStartDate),
    [investmentStartDate]
  );

  const investmentEndDate = useMemo(
    () => computeEndDate(investmentStartDate, tenorDaysNum),
    [investmentStartDate, tenorDaysNum]
  );

  const daysToMaturity = useMemo(
    () => computeDaysToMaturity(investmentEndDate),
    [investmentEndDate]
  );

  const investmentAmountNum = parseFormattedNumber(investmentAmount);
  const profitRateNum = parseFloat(profitRate) || 0;

  const accruedProfitCutoff = useMemo(
    () =>
      computeAccruedProfit(
        investmentAmountNum,
        profitRateNum,
        accruedDaysCutoffNum
      ),
    [investmentAmountNum, profitRateNum, accruedDaysCutoffNum]
  );

  const accruedProfitEndDate = useMemo(
    () =>
      computeAccruedProfit(investmentAmountNum, profitRateNum, tenorDaysNum),
    [investmentAmountNum, profitRateNum, tenorDaysNum]
  );

  const isValid =
    counterParty.trim().length > 0 &&
    Number.isFinite(investmentAmountNum) &&
    investmentAmountNum > 0 &&
    Number.isFinite(profitRateNum) &&
    profitRateNum >= 0 &&
    tenorDaysNum > 0 &&
    !!investmentStartDate &&
    !!investmentEndDate;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setShowConfirmModal(true);
  }

  async function handleConfirmSubmit() {
    if (!isValid) return;

    try {
      const asset = await createMutation.mutateAsync({
        counterParty: counterParty.trim(),
        investmentAmount: investmentAmountNum,
        profitRate: profitRateNum,
        investmentTenorDays: tenorDaysNum,
        investmentStartDate,
        investmentEndDate,
        accruedDaysCutoff: accruedDaysCutoffNum,
        daysToMaturity,
        accruedProfitCutoff,
        accruedProfitEndDate,
      });
      setShowConfirmModal(false);
      setCreatedAsset({ id: asset.id, portfolioAssetId: asset.portfolioAssetId });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to create portfolio asset.")
      );
    }
  }

  function resetForm() {
    setCounterParty("");
    setInvestmentAmount("");
    setProfitRate("");
    setInvestmentTenorDays("");
    setInvestmentStartDate(today);
  }

  function handleViewCreated() {
    if (createdAsset) {
      const id = createdAsset.id;
      setCreatedAsset(null);
      router.push(`/u/portfolio-assets/${id}`);
    }
  }

  function handleCreateAnother() {
    setCreatedAsset(null);
    resetForm();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/u/portfolio-assets"
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
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
          Back to Portfolio Assets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Portfolio Asset</h1>
        <p className="mt-1 text-gray-500">
          Create a new portfolio asset entry.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* Overview */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Overview</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Counter party and basic details
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <LabeledField label="Counter Party">
              <input
                type="text"
                value={counterParty}
                onChange={(e) => setCounterParty(e.target.value)}
                placeholder="e.g. Counter Party Name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </LabeledField>
          </div>
        </div>

        {/* Investment Terms */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Investment Terms</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Amount, tenor, dates, and rates
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <LabeledField label="Investment Amount (₦)">
              <input
                type="text"
                value={investmentAmount}
                onChange={(e) => handleInvestmentAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </LabeledField>
            <LabeledField label="Profit Rate (%)">
              <NumberInput
                value={profitRate}
                onChange={setProfitRate}
                placeholder="0.00"
                step="0.01"
              />
            </LabeledField>
            <LabeledField label="Investment Tenor (days)">
              <NumberInput
                value={investmentTenorDays}
                onChange={handleTenorDaysChange}
                placeholder="e.g. 90"
                step="1"
              />
            </LabeledField>
            <LabeledField label="Investment Start Date">
              <input
                type="date"
                value={investmentStartDate}
                onChange={(e) => setInvestmentStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </LabeledField>
            <LabeledField
              label="Investment End Date"
              hint="Calculated from start date + tenor days"
            >
              <ReadonlyField
                value={
                  investmentEndDate
                    ? new Date(investmentEndDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : ""
                }
              />
            </LabeledField>
          </div>
        </div>

        {/* Accrued & Maturity */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Accrued & Maturity</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Accrued days and profit calculations
            </p>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <LabeledField
              label="Accrued No. of Days (Cut-off)"
              hint="Days elapsed from start date to today"
            >
              <ReadonlyField
                value={
                  investmentStartDate
                    ? `${accruedDaysCutoffNum} days`
                    : "—"
                }
              />
            </LabeledField>
            <LabeledField
              label="Days to Maturity"
              hint="Days remaining until end date"
            >
              <ReadonlyField value={investmentEndDate ? `${daysToMaturity} days` : "—"} />
            </LabeledField>
            <LabeledField
              label="Accrued Profit (Cut-off) (₦)"
              hint="(Amount × Rate × Accrued days) / 365"
            >
              <ReadonlyField value={fmtCurrency(accruedProfitCutoff)} />
            </LabeledField>
            <LabeledField
              label="Accrued Profit (End Date) (₦)"
              hint="(Amount × Rate × Tenor days) / 365"
            >
              <ReadonlyField value={fmtCurrency(accruedProfitEndDate)} />
            </LabeledField>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!isValid || createMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <>
                <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : (
              "Create Portfolio Asset"
            )}
          </button>
          <Link
            href="/u/portfolio-assets"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </form>

      {showConfirmModal && (
        <SubmitConfirmModal
          counterParty={counterParty.trim()}
          investmentAmount={investmentAmount}
          profitRate={profitRate}
          tenorDays={tenorDaysNum}
          startDate={investmentStartDate}
          endDate={investmentEndDate}
          accruedDaysCutoff={accruedDaysCutoffNum}
          daysToMaturity={daysToMaturity}
          accruedProfitCutoff={fmtCurrency(accruedProfitCutoff)}
          accruedProfitEndDate={fmtCurrency(accruedProfitEndDate)}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmModal(false)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {createdAsset && (
        <AfterSaveModal
          portfolioAssetId={createdAsset.portfolioAssetId}
          onViewCreated={handleViewCreated}
          onCreateAnother={handleCreateAnother}
        />
      )}
    </div>
  );
}
