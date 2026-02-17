import { normalizeColumnName } from "./customerExportColumns";

/** Direct text fields only (excludes id, activity, ubos, signatories, accountMandates) */
export const CORPORATE_COLUMN_KEYS = [
  "customerId",
  "status",
  "rejectionReason",
  "companyCategory",
  "companyName",
  "registrationNumber",
  "dateOfIncorporation",
  "countryOfIncorporation",
  "typeOfBusiness",
  "sectorIndustry",
  "operatingAddress",
  "operatingState",
  "registeredAddress",
  "registeredState",
  "tin",
  "email",
  "phone1",
  "phone2",
  "scumlRegNo",
  "otherJurisdiction",
  "usTaxId",
  "primaryBankName",
  "primaryAccountName",
  "primaryAccountNumber",
  "secondaryBankName",
  "secondaryAccountName",
  "secondaryAccountNumber",
  "initialInvestmentAmount",
  "tenor",
  "profitRemittance",
  "designatedEmail",
  "designatedPhone",
  "indemnityConfirmed",
  "dataUsageAgreed",
  "createdAt",
  "updatedAt",
] as const;

function formatValue(
  key: string,
  val: unknown
): string | number | boolean {
  if (val === undefined || val === null) return "";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (Array.isArray(val)) return "";
  if (typeof val === "object") return "";
  return val as string | number | boolean;
}

/**
 * Converts a corporate customer record to an Excel row with normalized column headers.
 * Only includes direct text fields; arrays and nested objects are excluded.
 */
export function corporateToExcelRow(
  c: Record<string, unknown>
): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {};

  for (const key of CORPORATE_COLUMN_KEYS) {
    const label = normalizeColumnName(key);
    row[label] = formatValue(key, c[key]);
  }

  return row;
}
