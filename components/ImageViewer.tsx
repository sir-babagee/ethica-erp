"use client";

import { useState, useEffect, useCallback } from "react";

interface ImageViewerProps {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  thumbnailClassName?: string;
}

export default function ImageViewer({
  src,
  alt,
  label,
  className,
  thumbnailClassName = "h-24 w-24 rounded border border-gray-200 object-cover cursor-pointer transition-opacity hover:opacity-90",
}: ImageViewerProps) {
  const [open, setOpen] = useState(false);

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  return (
    <div className={className}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-gray-500">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
      >
        <img
          src={src}
          alt={alt}
          className={thumbnailClassName}
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close"
          >
            <svg
              className="h-6 w-6"
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
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
