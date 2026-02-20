import * as XLSX from "xlsx";
import type { CreateRateGuidePayload } from "@/types";

// ─── Column header → payload key mapping ────────────────────────────────────

const COLUMN_MAP: Record<string, keyof CreateRateGuidePayload> = {
  "tenor":               "tenor",
  "indicative rate":     "indicativeRate",
  "minimum spread":      "minimumSpread",
  "ethica ratio":        "ethicaRatio",
  "customer ratio":      "customerRatio",
  "at ethica ratio":     "aboveTargetEthicaRatio",
  "at customer ratio":   "aboveTargetCustomerRatio",
  "minimum amount":      "minimumAmount",
  "maximum amount":      "maximumAmount",
};

const REQUIRED_KEYS = Object.values(COLUMN_MAP) as (keyof CreateRateGuidePayload)[];

// ─── Value parsers ───────────────────────────────────────────────────────────

function parsePct(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const s = String(raw ?? "").replace(/%/g, "").replace(/,/g, "").trim();
  return s === "" ? NaN : parseFloat(s);
}

function parseAmount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  const s = String(raw ?? "").replace(/,/g, "").replace(/"/g, "").trim();
  return s === "" ? NaN : parseFloat(s);
}

function parseIntField(raw: unknown): number {
  if (typeof raw === "number") return Math.round(raw);
  const s = String(raw ?? "").replace(/,/g, "").trim();
  return s === "" ? NaN : parseInt(s, 10);
}

// ─── Row validation ──────────────────────────────────────────────────────────

export interface ParsedRow {
  rowNumber: number;
  data: CreateRateGuidePayload;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  parseError: string | null;
}

function validateRow(data: CreateRateGuidePayload, rowNumber: number): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(data.tenor) || data.tenor <= 0 || !Number.isInteger(data.tenor)) {
    errors.push("Tenor must be a positive whole number");
  }

  const pctFields: (keyof CreateRateGuidePayload)[] = [
    "indicativeRate", "minimumSpread", "ethicaRatio", "customerRatio",
    "aboveTargetEthicaRatio", "aboveTargetCustomerRatio",
  ];
  for (const f of pctFields) {
    if (!Number.isFinite(data[f] as number) || (data[f] as number) < 0) {
      errors.push(`${f} must be a non-negative number`);
    }
  }

  if (!Number.isFinite(data.minimumAmount) || data.minimumAmount < 0) {
    errors.push("Minimum Amount must be a non-negative number");
  }
  if (!Number.isFinite(data.maximumAmount) || data.maximumAmount < 0) {
    errors.push("Maximum Amount must be a non-negative number");
  }
  if (
    Number.isFinite(data.minimumAmount) &&
    Number.isFinite(data.maximumAmount) &&
    data.maximumAmount <= data.minimumAmount
  ) {
    errors.push("Maximum Amount must be greater than Minimum Amount");
  }

  if (Number.isFinite(data.ethicaRatio) && Number.isFinite(data.customerRatio)) {
    const ratioSum = parseFloat((data.ethicaRatio + data.customerRatio).toFixed(4));
    if (Math.abs(ratioSum - 100) > 0.01) {
      errors.push(`Ethica + Customer Ratio must equal 100% (got ${ratioSum}%)`);
    }
  }

  if (Number.isFinite(data.aboveTargetEthicaRatio) && Number.isFinite(data.aboveTargetCustomerRatio)) {
    const atSum = parseFloat((data.aboveTargetEthicaRatio + data.aboveTargetCustomerRatio).toFixed(4));
    if (Math.abs(atSum - 100) > 0.01) {
      errors.push(`AT Ethica + AT Customer Ratio must equal 100% (got ${atSum}%)`);
    }
  }

  return errors;
}

// ─── Main parser ─────────────────────────────────────────────────────────────

export async function parseRateGuideFile(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      return { rows: [], parseError: "The file appears to be empty or unreadable." };
    }

    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,  // keeps everything as strings so we can normalise ourselves
    });

    if (raw.length === 0) {
      return { rows: [], parseError: "No data rows found in the file." };
    }

    // Validate headers
    const fileHeaders = Object.keys(raw[0]).map((h) => h.trim().toLowerCase());
    const missingHeaders = Object.keys(COLUMN_MAP).filter(
      (col) => !fileHeaders.includes(col)
    );
    if (missingHeaders.length > 0) {
      return {
        rows: [],
        parseError: `Missing columns: ${missingHeaders.map((h) => `"${h}"`).join(", ")}. Check that your file uses the correct headers.`,
      };
    }

    const rows: ParsedRow[] = raw.map((rawRow, i) => {
      // Normalise keys
      const norm: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rawRow)) {
        const mapped = COLUMN_MAP[k.trim().toLowerCase()];
        if (mapped) norm[mapped] = v;
      }

      const data: CreateRateGuidePayload = {
        tenor:                   parseIntField(norm.tenor),
        indicativeRate:          parsePct(norm.indicativeRate),
        minimumSpread:           parsePct(norm.minimumSpread),
        ethicaRatio:             parsePct(norm.ethicaRatio),
        customerRatio:           parsePct(norm.customerRatio),
        aboveTargetEthicaRatio:  parsePct(norm.aboveTargetEthicaRatio),
        aboveTargetCustomerRatio:parsePct(norm.aboveTargetCustomerRatio),
        minimumAmount:           parseAmount(norm.minimumAmount),
        maximumAmount:           parseAmount(norm.maximumAmount),
      };

      return {
        rowNumber: i + 2, // row 1 = header
        data,
        errors: validateRow(data, i + 2),
      };
    });

    // Filter out completely blank trailing rows
    const nonBlank = rows.filter(
      (r) => REQUIRED_KEYS.some((k) => Number.isFinite(r.data[k] as number))
    );

    return { rows: nonBlank, parseError: null };
  } catch {
    return { rows: [], parseError: "Failed to read the file. Make sure it is a valid CSV or XLSX file." };
  }
}

// ─── Template download ───────────────────────────────────────────────────────

export function downloadRateGuideTemplate() {
  const headers = [
    "Tenor", "Indicative Rate", "Minimum Spread", "Ethica Ratio",
    "Customer Ratio", "AT Ethica Ratio", "AT Customer Ratio",
    "Minimum Amount", "Maximum Amount",
  ];
  const example = [90, "12.00%", "6.00%", "33.33%", "66.67%", "75.00%", "25.00%", "50000000", "99999999.99"];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rate Guide");
  XLSX.writeFile(wb, "rate-guide-template.xlsx");
}
