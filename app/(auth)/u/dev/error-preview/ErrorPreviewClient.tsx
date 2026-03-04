"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Variant = "with-message" | "without-message";

const MOCK_ERROR: Record<Variant, { message: string; digest: string }> = {
  "with-message": {
    message: "Cannot read properties of undefined (reading 'map')",
    digest: "1234567890abcdef",
  },
  "without-message": {
    message: "",
    digest: "",
  },
};

function ErrorUI({
  error,
  onReset,
}: {
  error: { message: string; digest: string };
  onReset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-10 w-10 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="mb-8 text-center text-sm leading-relaxed text-gray-500">
          An unexpected error occurred while loading this page. You can try
          refreshing, or head back to the dashboard.
        </p>

        {error.message && (
          <div className="mb-8 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
            <p className="font-mono text-xs wrap-break-word text-red-600">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-1 font-mono text-xs text-red-400">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onReset}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Try again
          </button>

          <button
            onClick={() => router.push("/u/dashboard")}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPreviewClient() {
  const [variant, setVariant] = useState<Variant>("with-message");
  const [resetCount, setResetCount] = useState(0);

  return (
    <div className="relative">
      {/* DEV banner */}
      <div className="sticky top-14 z-40 flex items-center justify-between border-b border-secondary/30 bg-secondary/10 px-6 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-secondary/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Dev Preview
          </span>
          <span className="text-sm text-gray-600">
            Error page &mdash; only visible in development
          </span>
        </div>

        {/* Variant toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setVariant("with-message")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              variant === "with-message"
                ? "bg-primary text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            With error message
          </button>
          <button
            onClick={() => setVariant("without-message")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              variant === "without-message"
                ? "bg-primary text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Without message
          </button>
        </div>
      </div>

      {/* Preview */}
      <ErrorUI
        key={`${variant}-${resetCount}`}
        error={MOCK_ERROR[variant]}
        onReset={() => setResetCount((c) => c + 1)}
      />

      {/* Reset feedback */}
      {resetCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-md text-sm text-gray-700">
          <span className="font-medium text-primary">reset()</span> called{" "}
          <span className="font-medium">{resetCount}×</span> — in production
          this re-renders the page segment.
        </div>
      )}
    </div>
  );
}
