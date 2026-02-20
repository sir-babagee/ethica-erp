"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  useCustomerLookup,
  useCreateInvestment,
  type CustomerSearchResult,
} from "@/services/investments";
import { useRateGuides } from "@/services/rate-guides";
import {
  formatAmountInputDisplay,
  parseFormattedNumber,
} from "@/utils/priceFormatter";
import { addDays, toDateInput, getDaysInYear } from "@/utils/date";
import { parseTenorDays } from "@/utils/tenor";
import { findMatchingRateGuide } from "@/utils/rate-guide";
import { fmtCurrency } from "@/utils/formatters";
import { LabeledField } from "@/components/LabeledField";
import { ReadonlyField } from "@/components/ReadonlyField";
import { NumberInput } from "@/components/NumberInput";
import { ConcessionConfirmModal } from "./_components/ConcessionConfirmModal";
import { SubmitConfirmModal } from "./_components/SubmitConfirmModal";
import { AfterSaveModal } from "./_components/AfterSaveModal";
import { CustomerCombobox } from "./_components/CustomerCombobox";
import type { CustomerLookupResult } from "@/types";

export default function NewInvestmentPage() {
  const router = useRouter();

  const [pendingCode, setPendingCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerLookupResult | null>(null);

  const { data: lookupResult, isLoading: lookupLoading } =
    useCustomerLookup(pendingCode);

  useEffect(() => {
    if (lookupResult) setSelectedCustomer(lookupResult);
  }, [lookupResult]);

  function handlePickSuggestion(item: CustomerSearchResult) {
    setPendingCode(item.customerId);
  }

  function handleClearCustomer() {
    setSelectedCustomer(null);
    setPendingCode("");
    setTenorDays(0);
    setCurrentInvestmentAmount("");
    setCustomerOnConcession(false);
  }

  const customer = selectedCustomer?.customer ?? null;
  const customerType = selectedCustomer?.type ?? null;

  const investmentAmount = customer
    ? Number(customer.investmentAmount ?? customer.initialInvestmentAmount ?? 0)
    : 0;
  const tenorStr = customer
    ? String(customer.tenor ?? customer.profitRemittance ?? "")
    : "";
  const derivedTenorDays = parseTenorDays(tenorStr);

  const customerName = customer
    ? customerType === "personal"
      ? [customer.title, customer.firstName, customer.lastName]
          .filter(Boolean)
          .join(" ")
      : String(customer.companyName ?? "")
    : "";

  const rolloverValue = customer
    ? String(customer.rollover ?? customer.profitRemittance ?? "At Maturity")
    : "";

  const today = toDateInput(new Date());
  const [startDate, setStartDate] = useState(today);
  const [tenorDays, setTenorDays] = useState(0);
  const [currentInvestmentAmount, setCurrentInvestmentAmount] = useState("");
  const [indicativeRate, setIndicativeRate] = useState("");
  const [customerSharingRatio, setCustomerSharingRatio] = useState("");
  const [aboveTargetCustomerSharingRatio, setAboveTargetCustomerSharingRatio] =
    useState("");
  const [accruedProfitCutoff, setAccruedProfitCutoff] = useState("");
  const [customerOnConcession, setCustomerOnConcession] = useState(false);
  const [showConcessionConfirm, setShowConcessionConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [savedInvestmentRef, setSavedInvestmentRef] = useState<string | null>(
    null
  );

  const { data: rateGuides = [] } = useRateGuides();

  const effectiveAmount = currentInvestmentAmount.trim()
    ? parseFormattedNumber(currentInvestmentAmount)
    : 0;

  function handleCurrentInvestmentAmountChange(raw: string) {
    setCurrentInvestmentAmount(formatAmountInputDisplay(raw));
  }

  const applyRateGuide = useCallback(() => {
    if (customerOnConcession) return;
    const match = findMatchingRateGuide(
      rateGuides,
      tenorDays,
      effectiveAmount
    );
    if (match) {
      setIndicativeRate(String(Number(match.indicativeRate)));
      setCustomerSharingRatio(String(Number(match.customerRatio)));
      setAboveTargetCustomerSharingRatio(
        String(Number(match.aboveTargetCustomerRatio))
      );
    } else if (tenorDays > 0 && effectiveAmount > 0) {
      setIndicativeRate("");
      setCustomerSharingRatio("");
      setAboveTargetCustomerSharingRatio("");
    }
  }, [rateGuides, tenorDays, effectiveAmount, customerOnConcession]);

  useEffect(() => {
    if (derivedTenorDays > 0) setTenorDays(derivedTenorDays);
  }, [derivedTenorDays]);

  useEffect(() => {
    setCurrentInvestmentAmount("");
  }, [customer?.id]);

  useEffect(() => {
    applyRateGuide();
  }, [applyRateGuide]);

  function handleConcessionCheckboxChange(checked: boolean) {
    if (checked) {
      setShowConcessionConfirm(true);
    } else {
      setCustomerOnConcession(false);
    }
  }

  function handleConcessionConfirm() {
    setCustomerOnConcession(true);
    setShowConcessionConfirm(false);
  }

  const endDate = tenorDays > 0 ? addDays(startDate, tenorDays) : "";
  const startYear = new Date(startDate).getFullYear();
  const daysInYear = getDaysInYear(startYear);
  const accruedProfitEndDate =
    effectiveAmount > 0 && indicativeRate && tenorDays > 0
      ? (effectiveAmount * (parseFloat(indicativeRate) / 100) * tenorDays) /
        daysInYear
      : 0;
  const createMutation = useCreateInvestment();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !customerType || !selectedCustomer) {
      toast.error("Please select a customer first.");
      return;
    }
    if (tenorDays <= 0) {
      toast.error("Tenor days must be greater than 0.");
      return;
    }
    const amount = parseFormattedNumber(currentInvestmentAmount);
    if (!currentInvestmentAmount.trim() || amount <= 0) {
      toast.error("Please enter the current investment amount.");
      return;
    }
    if (
      !indicativeRate ||
      !customerSharingRatio ||
      !aboveTargetCustomerSharingRatio
    ) {
      toast.error("Please fill all rate fields.");
      return;
    }
    setShowSubmitConfirm(true);
  }

  async function handleConfirmSave() {
    if (!customer || !customerType || !selectedCustomer) return;
    const amount = parseFormattedNumber(currentInvestmentAmount);
    const startYear = new Date(startDate).getFullYear();
    const daysInYear = getDaysInYear(startYear);
    const accruedProfit =
      (amount * (parseFloat(indicativeRate) / 100) * tenorDays) / daysInYear;
    try {
      const investment = await createMutation.mutateAsync({
        customerId: customer.id,
        customerType,
        tenorDays,
        startDate,
        profitRemittance: "At Maturity",
        indicativeRate: parseFloat(indicativeRate),
        customerSharingRatio: parseFloat(customerSharingRatio),
        aboveTargetCustomerSharingRatio: parseFloat(
          aboveTargetCustomerSharingRatio
        ),
        accruedProfitCutoff: parseFloat(accruedProfitCutoff || "0"),
        accruedProfitEndDate: accruedProfit,
      });
      setShowSubmitConfirm(false);
      setSavedInvestmentRef(investment.investmentRef);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create investment. Please try again.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  }

  function handleEnterAnother() {
    setSavedInvestmentRef(null);
    handleClearCustomer();
    setStartDate(toDateInput(new Date()));
    setIndicativeRate("");
    setCustomerSharingRatio("");
    setAboveTargetCustomerSharingRatio("");
    setAccruedProfitCutoff("");
  }

  function handleDone() {
    setSavedInvestmentRef(null);
    router.push("/u/transactions");
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/u/transactions")}
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
          Back to Transactions
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          New Investment Entry
        </h1>
        <p className="mt-1 text-gray-500">
          Record a new Mudarabah Fund investment for an approved customer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Customer Selection</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Start typing a customer ID to see matching approved customers.
            </p>
          </div>
          <div className="px-6 py-5">
            {!selectedCustomer ? (
              <div className="flex flex-col gap-2">
                <CustomerCombobox onSelect={handlePickSuggestion} />
                {lookupLoading && (
                  <p className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                    Loading customer details…
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-start justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div>
                  <p className="font-semibold text-gray-900">{customerName}</p>
                  <p className="text-sm text-gray-500">
                    {String(customer?.customerId ?? "")} &middot;{" "}
                    <span className="capitalize">{customerType}</span> Customer
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {String(customer?.email ?? "")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="ml-4 text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedCustomer && customer && (
          <>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  Investment Summary
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Pre-filled from the customer&apos;s application.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <LabeledField label="Intended Investment Amount">
                  <ReadonlyField value={fmtCurrency(investmentAmount)} />
                </LabeledField>
                <LabeledField
                  label="Current Investment Amount"
                  hint="Required. Enter the actual investment amount received."
                >
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      ₦
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={currentInvestmentAmount}
                      onChange={(e) =>
                        handleCurrentInvestmentAmountChange(e.target.value)
                      }
                      placeholder={
                        investmentAmount
                          ? formatAmountInputDisplay(String(investmentAmount))
                          : "0"
                      }
                      required
                      className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2.5 text-sm tabular-nums text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </LabeledField>
                <LabeledField label="Tenor">
                  <ReadonlyField value={tenorStr || "—"} />
                </LabeledField>
                <LabeledField label="Tenor (Days)">
                  <input
                    type="number"
                    value={tenorDays || ""}
                    onChange={(e) =>
                      setTenorDays(parseInt(e.target.value, 10) || 0)
                    }
                    min={1}
                    className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </LabeledField>
                <LabeledField label="Start Date">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </LabeledField>
                <LabeledField
                  label="End Date"
                  hint="Computed from start date + tenor days"
                >
                  <ReadonlyField value={endDate || "—"} />
                </LabeledField>
                <LabeledField label="Profit Remittance">
                  <ReadonlyField value="At Maturity" />
                </LabeledField>
                <LabeledField label="Rollover">
                  <ReadonlyField value={rolloverValue || "—"} />
                </LabeledField>
                <LabeledField label="Product">
                  <ReadonlyField value="Mudarabah Fund" />
                </LabeledField>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">
                  Rate &amp; Profit Details
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Rates are derived from the rate guide based on tenor and
                  investment amount. Enable concession to override.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    id="concession-checkbox"
                    type="checkbox"
                    checked={customerOnConcession}
                    onChange={(e) =>
                      handleConcessionCheckboxChange(e.target.checked)
                    }
                    className="h-4 w-4 shrink-0 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="concession-checkbox"
                    className="cursor-pointer text-sm font-medium text-gray-700"
                  >
                    Customer on concession
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <LabeledField
                  label="Indicative Rate (%)"
                  hint={
                    customerOnConcession
                      ? "Editable in concession mode"
                      : "From rate guide"
                  }
                >
                  {customerOnConcession ? (
                    <NumberInput
                      value={indicativeRate}
                      onChange={setIndicativeRate}
                      placeholder="0.0000"
                      step="0.0001"
                    />
                  ) : (
                    <ReadonlyField
                      value={
                        indicativeRate ? `${indicativeRate}%` : "—"
                      }
                    />
                  )}
                </LabeledField>
                <LabeledField
                  label="Customer Sharing Ratio (%)"
                  hint={
                    customerOnConcession
                      ? "Editable in concession mode"
                      : "From rate guide"
                  }
                >
                  {customerOnConcession ? (
                    <NumberInput
                      value={customerSharingRatio}
                      onChange={setCustomerSharingRatio}
                      placeholder="0.0000"
                      step="0.0001"
                    />
                  ) : (
                    <ReadonlyField
                      value={
                        customerSharingRatio
                          ? `${customerSharingRatio}%`
                          : "—"
                      }
                    />
                  )}
                </LabeledField>
                <LabeledField
                  label="Above Target Customer Sharing Ratio (%)"
                  hint={
                    customerOnConcession
                      ? "Editable in concession mode"
                      : "From rate guide"
                  }
                >
                  {customerOnConcession ? (
                    <NumberInput
                      value={aboveTargetCustomerSharingRatio}
                      onChange={setAboveTargetCustomerSharingRatio}
                      placeholder="0.0000"
                      step="0.0001"
                    />
                  ) : (
                    <ReadonlyField
                      value={
                        aboveTargetCustomerSharingRatio
                          ? `${aboveTargetCustomerSharingRatio}%`
                          : "—"
                      }
                    />
                  )}
                </LabeledField>
                <LabeledField
                  label="Accrued Profit (End Date)"
                  hint="Calculated: (amount × rate × tenor days) ÷ days in year"
                >
                  <ReadonlyField value={fmtCurrency(accruedProfitEndDate)} />
                </LabeledField>
              </div>
            </div>

            {showConcessionConfirm && (
              <ConcessionConfirmModal
                onConfirm={handleConcessionConfirm}
                onCancel={() => setShowConcessionConfirm(false)}
              />
            )}

            {showSubmitConfirm && customer && (
              <SubmitConfirmModal
                customerName={customerName}
                customerId={String(customer?.customerId ?? "")}
                investmentAmount={fmtCurrency(
                  parseFormattedNumber(currentInvestmentAmount)
                )}
                tenorDays={tenorDays}
                startDate={startDate}
                endDate={endDate}
                indicativeRate={indicativeRate}
                customerSharingRatio={customerSharingRatio}
                aboveTargetCustomerSharingRatio={
                  aboveTargetCustomerSharingRatio
                }
                accruedProfitEndDate={fmtCurrency(accruedProfitEndDate)}
                onConfirm={handleConfirmSave}
                onCancel={() => setShowSubmitConfirm(false)}
                isSubmitting={createMutation.isPending}
              />
            )}

            {savedInvestmentRef && (
              <AfterSaveModal
                investmentRef={savedInvestmentRef}
                onEnterAnother={handleEnterAnother}
                onDone={handleDone}
              />
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This entry will be saved as{" "}
                <strong>Pending</strong> and must be reviewed and approved by
                the Chief Financial Officer before it becomes active.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/u/transactions")}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || showSubmitConfirm}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving…
                  </>
                ) : (
                  "Submit for Review"
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
