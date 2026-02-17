"use client";

import { useEffect } from "react";
import type { ActivityLog } from "@/services/activityLogs";
import ActionBadge from "./ActionBadge";
import RoleBadge from "./RoleBadge";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert camelCase metadata keys into readable labels */
function formatMetaKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/\bId\b/g, "ID")
    .trim();
}

// ---------------------------------------------------------------------------
// Internal layout primitives
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-gray-100 px-4 py-2.5 last:border-b-0">
      <span className="w-36 shrink-0 text-xs font-medium text-gray-500">
        {label}
      </span>
      <span className="flex-1 text-sm text-gray-800 wrap-break-word">
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export default function LogDetailModal({
  log,
  onClose,
}: {
  log: ActivityLog;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const metaEntries = log.metadata
    ? Object.entries(log.metadata).filter(
        ([, v]) => v !== null && v !== undefined && v !== ""
      )
    : [];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <svg
                className="h-4 w-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              Log Detail
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* ── Staff ───────────────────────────────────────────────────── */}
          <Section title="Staff">
            <Row
              label="Name"
              value={`${log.staff.firstName} ${log.staff.lastName}`}
            />
            <Row label="Email" value={log.staff.email} />
            <Row label="Role" value={<RoleBadge role={log.staff.role} />} />
          </Section>

          {/* ── Activity ────────────────────────────────────────────────── */}
          <Section title="Activity">
            <Row label="Action" value={<ActionBadge action={log.action} />} />
            <Row
              label="Category"
              value={
                <span className="capitalize">
                  {log.category.replace(/_/g, " ")}
                </span>
              }
            />
          </Section>

          {/* ── Details ─────────────────────────────────────────────────── */}
          <Section title="Details">
            <Row label="Description" value={log.description ?? "—"} />
            <Row
              label="IP Address"
              value={
                log.ipAddress ? (
                  <span className="font-mono text-xs">{log.ipAddress}</span>
                ) : (
                  "—"
                )
              }
            />
            <Row
              label="Date & Time"
              value={new Date(log.createdAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            />
            <Row
              label="Log ID"
              value={
                <span className="font-mono text-xs text-gray-400">
                  {log.id}
                </span>
              }
            />
          </Section>

          {/* ── Metadata ────────────────────────────────────────────────── */}
          {metaEntries.length > 0 && (
            <Section title="Additional Context">
              {metaEntries.map(([key, value]) => (
                <Row
                  key={key}
                  label={formatMetaKey(key)}
                  value={
                    typeof value === "object" ? (
                      <span className="font-mono text-xs text-gray-600">
                        {JSON.stringify(value)}
                      </span>
                    ) : (
                      String(value)
                    )
                  }
                />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
