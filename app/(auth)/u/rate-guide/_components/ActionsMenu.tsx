"use client";

import { useState, useRef, useEffect } from "react";

interface Action {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ActionsMenuProps {
  actions: Action[];
}

export function ActionsMenu({ actions }: ActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleAction(action: Action) {
    setOpen(false);
    action.onClick();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none"
      >
        Actions
        <svg
          className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              disabled={action.disabled}
              onClick={() => handleAction(action)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors
                ${action.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-gray-50"}
                ${i > 0 ? "border-t border-gray-100" : ""}
              `}
            >
              <span className={`mt-0.5 shrink-0 ${action.variant === "danger" ? "text-red-500" : "text-gray-400"}`}>
                {action.icon}
              </span>
              <span className="flex flex-col">
                <span className={`text-sm font-medium ${action.variant === "danger" ? "text-red-600" : "text-gray-900"}`}>
                  {action.label}
                </span>
                <span className="text-xs text-gray-400">{action.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
