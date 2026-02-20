"use client";

import { useState } from "react";
import { formatAmountInputDisplay, parseFormattedNumber } from "@/utils/priceFormatter";
import { type FormState, type FieldDef, FIELDS, RATIO_PAIRS, RATIO_LINKED } from "./form-config";

interface ModalProps {
  mode: "add" | "edit";
  initial: FormState;
  onClose: () => void;
  onSubmit: (data: FormState) => Promise<void>;
  loading: boolean;
}

// ─── Sum badge ────────────────────────────────────────────────────────────────

function SumBadge({ a, b }: { a: number; b: number }) {
  const sum = parseFloat((a + b).toFixed(4));
  const valid = Math.abs(sum - 100) < 0.01;
  return (
    <div className={`col-span-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
      valid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
    }`}>
      {valid ? (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      )}
      {valid
        ? `∑ = ${sum.toFixed(2)}% — OK`
        : `∑ = ${sum.toFixed(2)}% — must equal 100%`}
    </div>
  );
}

// ─── Single field input ───────────────────────────────────────────────────────

interface FieldInputProps {
  fieldDef: FieldDef;
  form: FormState;
  amountDisplays: Record<string, string>;
  onNumber: (key: keyof FormState, value: string) => void;
  onAmount: (key: "minimumAmount" | "maximumAmount", raw: string) => void;
  inputClass: string;
}

function FieldInput({ fieldDef, form, amountDisplays, onNumber, onAmount, inputClass }: FieldInputProps) {
  const { key, label, suffix, hint, step, isAmount } = fieldDef;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
        {suffix && <span className="ml-1 normal-case text-gray-400">({suffix})</span>}
      </label>

      {isAmount ? (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₦</span>
          <input
            type="text"
            inputMode="numeric"
            value={amountDisplays[key]}
            onChange={(e) => onAmount(key as "minimumAmount" | "maximumAmount", e.target.value)}
            placeholder="0"
            required
            className={`${inputClass} w-full pl-7 tabular-nums`}
          />
        </div>
      ) : (
        <input
          type="number"
          value={form[key] === 0 ? "" : String(form[key])}
          onChange={(e) => onNumber(key, e.target.value)}
          placeholder="0"
          min={0}
          step={step ?? "0.0001"}
          required
          className={inputClass}
        />
      )}

      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ─── Ratio pair section ───────────────────────────────────────────────────────

interface RatioPairSectionProps {
  pair: [FieldDef, FieldDef];
  form: FormState;
  onNumber: (key: keyof FormState, value: string) => void;
  inputClass: string;
}

function RatioPairSection({ pair, form, onNumber, inputClass }: RatioPairSectionProps) {
  const [left, right] = pair;
  return (
    <div className="col-span-2 grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4">
      <FieldInput
        fieldDef={left}
        form={form}
        amountDisplays={{}}
        onNumber={onNumber}
        onAmount={() => {}}
        inputClass={inputClass}
      />
      <FieldInput
        fieldDef={right}
        form={form}
        amountDisplays={{}}
        onNumber={onNumber}
        onAmount={() => {}}
        inputClass={inputClass}
      />
      <SumBadge
        a={Number(form[left.key])}
        b={Number(form[right.key])}
      />
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function RateGuideModal({ mode, initial, onClose, onSubmit, loading }: ModalProps) {
  const [form, setForm] = useState<FormState>({ ...initial });
  const [amountDisplays, setAmountDisplays] = useState({
    minimumAmount: initial.minimumAmount > 0 ? formatAmountInputDisplay(String(initial.minimumAmount)) : "",
    maximumAmount: initial.maximumAmount > 0 ? formatAmountInputDisplay(String(initial.maximumAmount)) : "",
  });

  function setNumber(key: keyof FormState, value: string) {
    const num = value === "" ? 0 : parseFloat(value) || 0;
    setForm((prev) => {
      const next: FormState = { ...prev, [key]: num };
      // Auto-derive the linked ratio field
      const linked = RATIO_LINKED[key];
      if (linked !== undefined) {
        next[linked] = parseFloat(Math.max(0, 100 - num).toFixed(4));
      }
      return next;
    });
  }

  function setAmount(key: "minimumAmount" | "maximumAmount", raw: string) {
    const display = formatAmountInputDisplay(raw);
    setAmountDisplays((prev) => ({ ...prev, [key]: display }));
    setForm((prev) => ({ ...prev, [key]: parseFormattedNumber(display) }));
  }

  // Disable submit if either ratio pair doesn't sum to 100
  const ratiosValid =
    Math.abs(form.ethicaRatio + form.customerRatio - 100) < 0.01 &&
    Math.abs(form.aboveTargetEthicaRatio + form.aboveTargetCustomerRatio - 100) < 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ratiosValid) return;
    await onSubmit(form);
  }

  const inputClass =
    "rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "add" ? "Add Rate Guide Entry" : "Edit Rate Guide Entry"}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {mode === "add"
                ? "Define a new indicative rate band for a tenor."
                : "Update the rate band values for this tenor."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 px-6 py-5">

            {/* Regular fields */}
            {FIELDS.map((fieldDef) => (
              <FieldInput
                key={fieldDef.key}
                fieldDef={fieldDef}
                form={form}
                amountDisplays={amountDisplays}
                onNumber={setNumber}
                onAmount={setAmount}
                inputClass={inputClass}
              />
            ))}

            {/* Ratio pair sections */}
            {RATIO_PAIRS.map(([left, right]) => (
              <RatioPairSection
                key={`${left.key}-${right.key}`}
                pair={[left, right]}
                form={form}
                onNumber={setNumber}
                inputClass={inputClass}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !ratiosValid}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving…
                </>
              ) : mode === "add" ? (
                "Add Entry"
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
