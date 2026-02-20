export function fmtPct(v: number | string): string {
  const n = Number(v);
  return isNaN(n) ? "—" : `${n.toFixed(2)}%`;
}

export function fmtCurrency(v: number | string): string {
  const n = Number(v);
  if (isNaN(n)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatWithCommas(value: string): string {
  // Strip everything except digits and the first decimal point
  const cleaned = value.replace(/[^\d.]/g, "").replace(/^(\d*\.?\d*).*$/, "$1");
  const [intPart = "", decPart] = cleaned.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  // Only append decimal section when there are actual decimal digits
  if (decPart !== undefined && decPart.length > 0) {
    return `${formattedInt}.${decPart.slice(0, 2)}`;
  }
  return formattedInt;
}

export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
}
