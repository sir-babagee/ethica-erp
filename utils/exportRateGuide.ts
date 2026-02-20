import * as XLSX from "xlsx";
import type { RateGuide } from "@/types";

function fmtPctExport(v: number | string): string {
  const n = Number(v);
  return isNaN(n) ? "0.00%" : `${n.toFixed(2)}%`;
}

function fmtAmountExport(v: number | string): string {
  const n = Number(v);
  if (isNaN(n)) return "0.00";
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function exportRateGuidesToXlsx(guides: RateGuide[], filename = "rate-guide.xlsx") {
  const headers = [
    "Tenor",
    "Indicative Rate",
    "Minimum Spread",
    "Ethica Ratio",
    "Customer Ratio",
    "AT Ethica Ratio",
    "AT Customer Ratio",
    "Minimum Amount",
    "Maximum Amount",
  ];

  const rows = guides.map((g) => [
    Number(g.tenor),
    fmtPctExport(g.indicativeRate),
    fmtPctExport(g.minimumSpread),
    fmtPctExport(g.ethicaRatio),
    fmtPctExport(g.customerRatio),
    fmtPctExport(g.aboveTargetEthicaRatio),
    fmtPctExport(g.aboveTargetCustomerRatio),
    fmtAmountExport(g.minimumAmount),
    fmtAmountExport(g.maximumAmount),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Column widths
  ws["!cols"] = [
    { wch: 8 },  // Tenor
    { wch: 16 }, // Indicative Rate
    { wch: 16 }, // Minimum Spread
    { wch: 14 }, // Ethica Ratio
    { wch: 16 }, // Customer Ratio
    { wch: 16 }, // AT Ethica Ratio
    { wch: 18 }, // AT Customer Ratio
    { wch: 22 }, // Minimum Amount
    { wch: 22 }, // Maximum Amount
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rate Guide");
  XLSX.writeFile(wb, filename);
}

export function exportRateGuidesToCsv(guides: RateGuide[], filename = "rate-guide.csv") {
  const headers = [
    "Tenor",
    "Indicative Rate",
    "Minimum Spread",
    "Ethica Ratio",
    "Customer Ratio",
    "AT Ethica Ratio",
    "AT Customer Ratio",
    "Minimum Amount",
    "Maximum Amount",
  ];

  const rows = guides.map((g) => [
    String(Number(g.tenor)),
    fmtPctExport(g.indicativeRate),
    fmtPctExport(g.minimumSpread),
    fmtPctExport(g.ethicaRatio),
    fmtPctExport(g.customerRatio),
    fmtPctExport(g.aboveTargetEthicaRatio),
    fmtPctExport(g.aboveTargetCustomerRatio),
    `"${fmtAmountExport(g.minimumAmount)}"`,
    `"${fmtAmountExport(g.maximumAmount)}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
