"use client";

import { useState, useEffect, useRef } from "react";
import {
  useCustomerSearch,
  type CustomerSearchResult,
} from "@/services/investments";

interface CustomerComboboxProps {
  onSelect: (result: CustomerSearchResult) => void;
}

export function CustomerCombobox({ onSelect }: CustomerComboboxProps) {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(inputValue.trim()), 200);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data: suggestions = [], isFetching } = useCustomerSearch(debouncedQ);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleSelect(item: CustomerSearchResult) {
    setInputValue("");
    setOpen(false);
    setActiveIndex(-1);
    onSelect(item);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative max-w-sm">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value.toUpperCase());
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (inputValue.trim()) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type customer ID (e.g. EC001)…"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-9 text-sm font-mono uppercase text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {isFetching && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
          </span>
        )}
      </div>

      {open && inputValue.trim().length >= 1 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.length === 0 && !isFetching && (
            <li className="px-4 py-3 text-sm text-gray-400">
              No approved customers match &quot;{inputValue}&quot;
            </li>
          )}
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              onPointerDown={(e) => {
                e.preventDefault();
                handleSelect(item);
              }}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 ${
                idx === activeIndex ? "bg-primary/10" : "hover:bg-gray-50"
              }`}
            >
              <span className="font-mono text-sm font-medium text-gray-900">
                {item.customerId}
              </span>
              <span className="ml-3 truncate text-xs text-gray-400">
                {item.name}
              </span>
              <span
                className={`ml-3 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                  item.type === "personal"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-violet-50 text-violet-600"
                }`}
              >
                {item.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
