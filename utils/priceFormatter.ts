/**
 * Formats raw user input for a price/amount field display.
 * Adds thousand separators and preserves a trailing decimal point while typing.
 *
 * @example
 * formatAmountInputDisplay("1000000")   // "1,000,000"
 * formatAmountInputDisplay("1000.")    // "1,000."
 * formatAmountInputDisplay("500000.5") // "500,000.5"
 */
export function formatAmountInputDisplay(raw: string): string {
  // Strip everything except digits and the first decimal point
  const cleaned = raw.replace(/[^\d.]/g, "").replace(/^(\d*\.?\d*).*$/, "$1");
  const [intPart = "", decPart] = cleaned.split(".");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted =
    decPart !== undefined && decPart.length > 0
      ? `${formattedInt}.${decPart.slice(0, 2)}`
      : formattedInt;
  const numeric = raw.replace(/,/g, "");
  const hasTrailingDecimal =
    numeric.endsWith(".") && numeric.indexOf(".") === numeric.length - 1;
  return hasTrailingDecimal ? `${formatted}.` : formatted;
}

export function parseFormattedNumber(value: string): number {
  const cleaned = value.replace(/,/g, "");
  return cleaned ? parseFloat(cleaned) : 0;
}
