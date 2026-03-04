"use client";

import { useEffect, useRef, useState } from "react";
import { useClientSearch } from "@/services/finance";
import type { ClientSearchResult, ClientType } from "@/types";

interface Props {
  value: { id: string; name: string; customerId: string | null; type: ClientType } | null;
  onChange: (value: { id: string; name: string; customerId: string | null; type: ClientType } | null) => void;
}

export default function ClientIdAutocomplete({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isFetching } = useClientSearch(query);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: ClientSearchResult) {
    onChange({ id: result.id, name: result.name, customerId: result.customerId, type: result.type });
    setQuery("");
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  // ── Locked state — client is selected ────────────────────────────────────
  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
            value.type === "individual"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {value.type === "individual" ? "Individual" : "Corporate"}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
          {value.customerId ?? value.id}
        </span>
        <span className="shrink-0 truncate text-xs text-gray-400">{value.name}</span>
        <button
          type="button"
          onClick={handleClear}
          className="ml-1 shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          aria-label="Remove client"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  // ── Search state — no client selected yet ────────────────────────────────
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name or client ID…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {isFetching && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
            <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </span>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {results.length === 0 && !isFetching && (
            <li className="px-3 py-2 text-sm text-gray-400">No clients found</li>
          )}
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(r)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
              >
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${
                    r.type === "individual"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {r.type === "individual" ? "Ind" : "Corp"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                  {r.name}
                </span>
                {r.customerId && (
                  <span className="shrink-0 text-xs text-gray-400">{r.customerId}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
