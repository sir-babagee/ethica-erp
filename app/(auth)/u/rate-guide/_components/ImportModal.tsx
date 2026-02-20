"use client";

import { useState, useRef, useCallback } from "react";
import { fmtPct, fmtCurrency } from "@/lib/utils/formatters";
import { parseRateGuideFile, downloadRateGuideTemplate, type ParsedRow } from "@/lib/utils/parseRateGuideFile";
import type { CreateRateGuidePayload } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "upload" | "preview";

interface Props {
  existingCount: number;
  onClose: () => void;
  onConfirm: (entries: CreateRateGuidePayload[]) => Promise<void>;
  loading: boolean;
}

// ─── Drop Zone ───────────────────────────────────────────────────────────────

interface DropZoneProps {
  onFile: (file: File) => void;
  parsing: boolean;
  parseError: string | null;
}

function DropZone({ onFile, parsing, parseError }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.name.match(/\.(csv|xlsx|xls)$/i)) return;
    onFile(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Drop target */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-gray-50 hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        {parsing ? (
          <>
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            <p className="text-sm font-medium text-gray-500">Reading file…</p>
          </>
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drop your file here, or <span className="text-primary">browse</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">CSV or XLSX — must match the expected column headers</p>
            </div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{parseError}</p>
        </div>
      )}

      {/* Template download */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="flex-1 text-xs text-gray-500">
          Not sure about the format?
        </p>
        <button
          type="button"
          onClick={downloadRateGuideTemplate}
          className="text-xs font-medium text-primary hover:underline"
        >
          Download template
        </button>
      </div>
    </div>
  );
}

// ─── Preview Table ────────────────────────────────────────────────────────────

interface PreviewTableProps {
  rows: ParsedRow[];
}

const PREVIEW_COLS = [
  { label: "Row", key: "rowNumber" },
  { label: "Tenor", key: "tenor" },
  { label: "Ind. Rate", key: "indicativeRate" },
  { label: "Min Spread", key: "minimumSpread" },
  { label: "Ethica %", key: "ethicaRatio" },
  { label: "Customer %", key: "customerRatio" },
  { label: "AT Ethica %", key: "aboveTargetEthicaRatio" },
  { label: "AT Customer %", key: "aboveTargetCustomerRatio" },
  { label: "Min Amount", key: "minimumAmount" },
  { label: "Max Amount", key: "maximumAmount" },
] as const;

function PreviewTable({ rows }: PreviewTableProps) {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {PREVIEW_COLS.map((c) => (
              <th key={c.key} className="px-3 py-2.5 font-semibold uppercase tracking-wide text-gray-500">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2.5 font-semibold uppercase tracking-wide text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hasError = row.errors.length > 0;
            return (
              <tr
                key={row.rowNumber}
                className={`border-b border-gray-100 ${hasError ? "bg-red-50" : "hover:bg-gray-50/60"}`}
              >
                <td className="px-3 py-2 text-gray-400">{row.rowNumber}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{row.data.tenor} days</td>
                <td className="px-3 py-2 text-gray-700">{fmtPct(row.data.indicativeRate)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtPct(row.data.minimumSpread)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtPct(row.data.ethicaRatio)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtPct(row.data.customerRatio)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtPct(row.data.aboveTargetEthicaRatio)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtPct(row.data.aboveTargetCustomerRatio)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtCurrency(row.data.minimumAmount)}</td>
                <td className="px-3 py-2 text-gray-700">{fmtCurrency(row.data.maximumAmount)}</td>
                <td className="px-3 py-2">
                  {hasError ? (
                    <span
                      title={row.errors.join(" | ")}
                      className="inline-flex cursor-help items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      </svg>
                      {row.errors[0]}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      OK
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function ImportModal({ existingCount, onClose, onConfirm, loading }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    setFileName(file.name);
    const result = await parseRateGuideFile(file);
    setParsing(false);
    if (result.parseError) {
      setParseError(result.parseError);
      return;
    }
    setRows(result.rows);
    setStep("preview");
  }

  function handleBack() {
    setStep("upload");
    setRows([]);
    setParseError(null);
  }

  async function handleConfirm() {
    await onConfirm(rows.map((r) => r.data));
  }

  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const errorCount = rows.length - validCount;
  const hasErrors = errorCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-5xl flex-col rounded-2xl bg-white shadow-xl" style={{ maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {step === "upload" ? "Import Rate Guide" : `Preview — ${fileName}`}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {step === "upload"
                ? "Upload a CSV or XLSX file to replace all existing rate guide entries."
                : `${rows.length} rows parsed · ${validCount} valid · ${errorCount} with errors`}
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

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {step === "upload" ? (
            <DropZone onFile={handleFile} parsing={parsing} parseError={parseError} />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Warning banner */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm text-amber-800">
                  <strong>This will permanently replace all {existingCount} existing rate guide {existingCount === 1 ? "entry" : "entries"}</strong> with the {validCount} valid rows below. This cannot be undone.
                </p>
              </div>

              {hasErrors && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">
                    <strong>{errorCount} row{errorCount > 1 ? "s have" : " has"} validation errors</strong> (highlighted in red). Fix the file and re-upload, or remove those rows before importing.
                  </p>
                </div>
              )}

              <PreviewTable rows={rows} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-6 py-4">
          <div>
            {step === "preview" && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Upload different file
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {step === "preview" && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || hasErrors || rows.length === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Importing…
                  </>
                ) : (
                  <>
                    Replace All &amp; Import {validCount} {validCount === 1 ? "entry" : "entries"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
