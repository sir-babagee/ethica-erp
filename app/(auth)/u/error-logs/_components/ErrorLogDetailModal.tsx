"use client";

import { useEffect, useRef } from "react";
import type { ErrorLog } from "@/services/errorLogs";
import { useResolveErrorLog, useUnresolveErrorLog } from "@/services/errorLogs";
import toast from "react-hot-toast";

interface Props {
  log: ErrorLog;
  onClose: () => void;
  onStatusChange: () => void;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

export default function ErrorLogDetailModal({
  log,
  onClose,
  onStatusChange,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const resolveMutation = useResolveErrorLog();
  const unresolveMutation = useUnresolveErrorLog();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleResolve() {
    resolveMutation.mutate(log.id, {
      onSuccess: () => {
        toast.success("Marked as resolved");
        onStatusChange();
        onClose();
      },
      onError: () => toast.error("Failed to update status"),
    });
  }

  function handleUnresolve() {
    unresolveMutation.mutate(log.id, {
      onSuccess: () => {
        toast.success("Marked as unresolved");
        onStatusChange();
        onClose();
      },
      onError: () => toast.error("Failed to update status"),
    });
  }

  const isMutating = resolveMutation.isPending || unresolveMutation.isPending;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  log.isResolved
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {log.isResolved ? "Resolved" : "Open"}
              </span>
              {log.errorName && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {log.errorName}
                </span>
              )}
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Error Detail
            </h2>
            <p className="mt-0.5 font-mono text-xs text-gray-400">{log.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Error message */}
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="font-mono text-sm wrap-break-word text-red-700">
              {log.errorMessage}
            </p>
            {log.digest && (
              <p className="mt-1.5 font-mono text-xs text-red-400">
                Digest: {log.digest}
              </p>
            )}
          </div>

          {/* Stack trace */}
          {log.errorStack && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Stack Trace
              </p>
              <pre className="overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-600 whitespace-pre-wrap wrap-break-word">
                {log.errorStack}
              </pre>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Occurred at"
              value={new Date(log.createdAt).toLocaleString()}
            />
            {log.url && (
              <Field
                label="Page URL"
                value={
                  <span className="wrap-break-word font-mono text-xs">
                    {log.url}
                  </span>
                }
              />
            )}
            {log.staff ? (
              <Field
                label="Reported by"
                value={
                  <span>
                    {log.staff.firstName} {log.staff.lastName}
                    <span className="ml-1 text-gray-400">
                      ({log.staff.role})
                    </span>
                  </span>
                }
              />
            ) : (
              <Field label="Reported by" value="Unknown / Unauthenticated" />
            )}
            {log.isResolved && log.resolvedAt && (
              <Field
                label="Resolved at"
                value={new Date(log.resolvedAt).toLocaleString()}
              />
            )}
            {log.userAgent && (
              <div className="col-span-2">
                <Field
                  label="User Agent"
                  value={
                    <span className="wrap-break-word font-mono text-xs text-gray-500">
                      {log.userAgent}
                    </span>
                  }
                />
              </div>
            )}
          </div>

          {/* Metadata JSON */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">
                Extra Metadata
              </p>
              <pre className="overflow-x-auto rounded-lg border border-gray-100 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          <div className="flex gap-2">
            {log.isResolved ? (
              <button
                onClick={handleUnresolve}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                  />
                </svg>
                Mark Unresolved
              </button>
            ) : (
              <button
                onClick={handleResolve}
                disabled={isMutating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
                Mark Resolved
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
