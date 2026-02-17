"use client";

import { useState, useRef, useEffect } from "react";

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectGroup = {
  label: string;
  options: SelectOption[];
};

interface SearchableSelectProps {
  /** Flat list of options — use this OR groups, not both */
  options?: SelectOption[];
  /** Grouped options — renders a non-clickable header above each group */
  groups?: SelectGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * When provided, a "clear / all" option with this label is pinned at the
   * top of the dropdown (not filtered by search) with value = "".
   * Example: allLabel="All Roles"
   */
  allLabel?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Searchable dropdown matching the ERP design system.
 * Supports both flat options and grouped options (with visual group headers).
 *
 * Pass an option with value="" to represent the "All / none selected" state.
 */
export default function SearchableSelect({
  options,
  groups,
  value,
  onChange,
  placeholder = "Select...",
  allLabel,
  disabled = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive the display label for the current value
  const allOptions: SelectOption[] = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? []);

  const selectedOption = allOptions.find((o) => o.value === value);
  // When value is "" and allLabel is provided, show allLabel as the selected state
  const displayLabel =
    value === "" && allLabel ? allLabel : (selectedOption?.label ?? "");

  // Build filtered content
  const term = search.toLowerCase().trim();

  function renderOptions() {
    const allOption = allLabel ? (
      // "All" option is pinned at the top and never filtered out by search
      <OptionButton
        key="__all__"
        option={{ value: "", label: allLabel }}
        selected={value === ""}
        onSelect={handleSelect}
      />
    ) : null;

    if (groups) {
      // Grouped — filter within each group, skip empty groups
      const groupItems = groups
        .map((group) => {
          const filtered = term
            ? group.options.filter((o) =>
                o.label.toLowerCase().includes(term)
              )
            : group.options;
          if (filtered.length === 0) return null;
          return (
            <div key={group.label}>
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              {filtered.map((opt) => (
                <OptionButton
                  key={opt.value}
                  option={opt}
                  selected={value === opt.value}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          );
        })
        .filter(Boolean);

      return (
        <>
          {allOption}
          {allOption && groupItems.length > 0 && (
            <hr className="mx-2 my-1 border-gray-100" />
          )}
          {groupItems}
        </>
      );
    }

    // Flat
    const filtered = term
      ? (options ?? []).filter((o) => o.label.toLowerCase().includes(term))
      : (options ?? []);

    if (filtered.length === 0 && !allOption) {
      return (
        <p className="px-4 py-3 text-sm text-gray-500">No matching options</p>
      );
    }

    return (
      <>
        {allOption}
        {allOption && filtered.length > 0 && (
          <hr className="mx-2 my-1 border-gray-100" />
        )}
        {filtered.map((opt) => (
          <OptionButton
            key={opt.value}
            option={opt}
            selected={value === opt.value}
            onSelect={handleSelect}
          />
        ))}
      </>
    );
  }

  function handleSelect(optValue: string) {
    onChange(optValue);
    setSearch("");
    setIsOpen(false);
  }

  // "All" option is always visible, so content is never truly empty when allLabel is set
  const hasContent =
    !!allLabel ||
    (groups
      ? groups.some((g) =>
          g.options.some((o) =>
            term ? o.label.toLowerCase().includes(term) : true
          )
        )
      : (options ?? []).some((o) =>
          term ? o.label.toLowerCase().includes(term) : true
        ));

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((o) => !o);
        }}
        className={`flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm transition-colors ${
          disabled
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : "text-gray-700 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        }`}
      >
        <span className={`truncate ${!displayLabel ? "text-gray-400" : ""}`}>
          {displayLabel || placeholder}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute left-0 top-full z-20 mt-1 w-full min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-gray-100 p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  setIsOpen(false);
                  setSearch("");
                }
              }}
            />
          </div>

          {/* Option list */}
          <div className="max-h-60 overflow-auto py-1">
            {!hasContent ? (
              <p className="px-4 py-3 text-sm text-gray-500">
                No matching options
              </p>
            ) : (
              renderOptions()
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal option button
// ---------------------------------------------------------------------------
function OptionButton({
  option,
  selected,
  onSelect,
}: {
  option: SelectOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-primary/10 ${
        selected
          ? "bg-primary/5 font-medium text-primary"
          : "text-gray-700"
      }`}
    >
      {option.label}
      {selected && (
        <svg
          className="h-4 w-4 shrink-0 text-primary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
    </button>
  );
}
