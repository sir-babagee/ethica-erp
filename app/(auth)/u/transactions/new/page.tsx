"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCustomerLookup, useCreateInvestment } from "@/lib/queries/investments";
import type { CustomerLookupResult } from "@/types";

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(num);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseTenorDays(tenorStr: string): number {
  if (!tenorStr) return 0;
  const match = tenorStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function LabeledField({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function ReadonlyField({ value }: { value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
      {value || "—"}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  step?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "0"}
      min={min ?? 0}
      step={step ?? "0.0001"}
      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
    />
  );
}

export default function NewInvestmentPage() {
  const router = useRouter();

  // Customer search
  const [customerCodeInput, setCustomerCodeInput] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerLookupResult | null>(null);

  // Debounce the code input for the lookup query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedCode(customerCodeInput.trim().toUpperCase());
    }, 600);
    return () => clearTimeout(t);
  }, [customerCodeInput]);

  const {
    data: lookupResult,
    isLoading: lookupLoading,
    error: lookupError,
  } = useCustomerLookup(debouncedCode);

  // Auto-select when lookup returns a single result
  useEffect(() => {
    if (lookupResult) {
      setSelectedCustomer(lookupResult);
    }
  }, [lookupResult]);

  // Derived customer data
  const customer = selectedCustomer?.customer ?? null;
  const customerType = selectedCustomer?.type ?? null;

  const investmentAmount =
    customer
      ? Number(customer.investmentAmount ?? customer.initialInvestmentAmount ?? 0)
      : 0;

  const tenorStr =
    customer
      ? String(customer.tenor ?? customer.profitRemittance ?? "")
      : "";

  const derivedTenorDays = parseTenorDays(tenorStr);

  const customerName =
    customer
      ? customerType === "personal"
        ? [customer.title, customer.firstName, customer.lastName]
            .filter(Boolean)
            .join(" ")
        : String(customer.companyName ?? "")
      : "";

  const rolloverValue =
    customer
      ? String(customer.rollover ?? customer.profitRemittance ?? "At Maturity")
      : "";

  // Form state
  const today = toDateInput(new Date());
  const [startDate, setStartDate] = useState(today);
  const [tenorDays, setTenorDays] = useState(0);
  const [indicativeRate, setIndicativeRate] = useState("");
  const [customerSharingRatio, setCustomerSharingRatio] = useState("");
  const [aboveTargetCustomerSharingRatio, setAboveTargetCustomerSharingRatio] =
    useState("");
  const [accruedProfitCutoff, setAccruedProfitCutoff] = useState("");
  const [accruedProfitEndDate, setAccruedProfitEndDate] = useState("");

  // Sync tenor days from customer record whenever customer changes
  useEffect(() => {
    if (derivedTenorDays > 0) setTenorDays(derivedTenorDays);
  }, [derivedTenorDays]);

  const endDate = tenorDays > 0 ? addDays(startDate, tenorDays) : "";

  const createMutation = useCreateInvestment();

  function handleClearCustomer() {
    setSelectedCustomer(null);
    setCustomerCodeInput("");
    setDebouncedCode("");
    setTenorDays(0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!customer || !customerType || !selectedCustomer) {
      toast.error("Please select a customer first.");
      return;
    }
    if (tenorDays <= 0) {
      toast.error("Tenor days must be greater than 0.");
      return;
    }
    if (!indicativeRate || !customerSharingRatio || !aboveTargetCustomerSharingRatio) {
      toast.error("Please fill all rate fields.");
      return;
    }

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
        accruedProfitEndDate: parseFloat(accruedProfitEndDate || "0"),
      });

      toast.success(
        `Investment ${investment.investmentRef} created and is pending CFO approval.`
      );
      router.push("/u/transactions");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create investment. Please try again.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/u/transactions")}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Transactions
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Investment Entry</h1>
        <p className="mt-1 text-gray-500">
          Record a new Mudarabah Fund investment for an approved customer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Customer Search ─────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Customer Selection</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Enter the customer ID (e.g. EC001) to load their details.
            </p>
          </div>
          <div className="px-6 py-5">
            {!selectedCustomer ? (
              <div className="flex max-w-sm flex-col gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={customerCodeInput}
                    onChange={(e) =>
                      setCustomerCodeInput(e.target.value.toUpperCase())
                    }
                    placeholder="Customer ID (e.g. EC001)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  {lookupLoading && (
                    <span className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                  )}
                </div>
                {lookupError && debouncedCode.length >= 3 && (
                  <p className="text-sm text-red-600">
                    No approved customer found with ID &quot;{debouncedCode}&quot;.
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

        {/* ── Customer Details (read-only) ─────────────────────────────── */}
        {selectedCustomer && customer && (
          <>
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Investment Summary</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Pre-filled from the customer&apos;s application.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <LabeledField label="Intended Investment Amount">
                  <ReadonlyField value={formatCurrency(investmentAmount)} />
                </LabeledField>

                <LabeledField label="Tenor">
                  <ReadonlyField value={tenorStr || "—"} />
                </LabeledField>

                <LabeledField label="Tenor (Days)">
                  <input
                    type="number"
                    value={tenorDays || ""}
                    onChange={(e) => setTenorDays(parseInt(e.target.value, 10) || 0)}
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

                <LabeledField label="End Date" hint="Computed from start date + tenor days">
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

            {/* ── Fund Accountant Inputs ─────────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-semibold text-gray-900">Rate & Profit Details</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Enter the rates and computed profit figures below.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
                <LabeledField label="Indicative Rate (%)" hint="e.g. 15.5">
                  <NumberInput
                    value={indicativeRate}
                    onChange={setIndicativeRate}
                    placeholder="0.0000"
                    step="0.0001"
                  />
                </LabeledField>

                <LabeledField label="Customer Sharing Ratio (%)" hint="e.g. 70">
                  <NumberInput
                    value={customerSharingRatio}
                    onChange={setCustomerSharingRatio}
                    placeholder="0.0000"
                    step="0.0001"
                  />
                </LabeledField>

                <LabeledField
                  label="Above Target Customer Sharing Ratio (%)"
                  hint="e.g. 80"
                >
                  <NumberInput
                    value={aboveTargetCustomerSharingRatio}
                    onChange={setAboveTargetCustomerSharingRatio}
                    placeholder="0.0000"
                    step="0.0001"
                  />
                </LabeledField>

                <LabeledField label="Accrued Profit (Cut-off Date)" hint="₦ amount">
                  <NumberInput
                    value={accruedProfitCutoff}
                    onChange={setAccruedProfitCutoff}
                    placeholder="0.00"
                    step="0.0001"
                  />
                </LabeledField>

                <LabeledField label="Accrued Profit (End Date)" hint="₦ amount">
                  <NumberInput
                    value={accruedProfitEndDate}
                    onChange={setAccruedProfitEndDate}
                    placeholder="0.00"
                    step="0.0001"
                  />
                </LabeledField>
              </div>
            </div>

            {/* ── Notice ─────────────────────────────────────────────────── */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This entry will be saved as{" "}
                <strong>Pending</strong> and must be reviewed and approved by the
                Chief Financial Officer before it becomes active.
              </p>
            </div>

            {/* ── Submit ─────────────────────────────────────────────────── */}
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
                disabled={createMutation.isPending}
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
