"use client";

import { fmtPct, fmtCurrency } from "@/lib/utils/formatters";
import type { RateGuide } from "@/lib/queries/rate-guides";

interface RowProps {
  guide: RateGuide;
  onEdit: (guide: RateGuide) => void;
  onDelete: (guide: RateGuide) => void;
}

export function RateGuideRow({ guide, onEdit, onDelete }: RowProps) {
  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50/60">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">
        {guide.tenor} days
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtPct(guide.indicativeRate)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtPct(guide.minimumSpread)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtPct(guide.ethicaRatio)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtPct(guide.customerRatio)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtPct(guide.aboveTargetEthicaRatio)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtPct(guide.aboveTargetCustomerRatio)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtCurrency(guide.minimumAmount)}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{fmtCurrency(guide.maximumAmount)}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(guide)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/10"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(guide)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 ring-1 ring-red-200 transition-colors hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
