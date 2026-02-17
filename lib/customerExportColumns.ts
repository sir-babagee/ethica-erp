import type { PEPData } from "@/types";

/** Direct text fields only (excludes id, activity, arrays, nested objects) */
export const NON_PEP_COLUMN_KEYS = [
  "customerId",
  "status",
  "rejectionReason",
  "passportPhoto",
  "idType",
  "idUpload",
  "title",
  "firstName",
  "lastName",
  "otherName",
  "dateOfBirth",
  "gender",
  "maritalStatus",
  "nationality",
  "state",
  "lga",
  "email",
  "phone",
  "contactAddress",
  "employmentStatus",
  "employerName",
  "employerAddress",
  "nokFirstName",
  "nokSurname",
  "nokOtherName",
  "nokDateOfBirth",
  "nokCountryCode",
  "nokPhoneNumber",
  "nokRelationship",
  "nokEmail",
  "nokContactAddress",
  "investmentAmount",
  "tenor",
  "profitRemittance",
  "signature",
  "bvn",
  "bankName",
  "accountNumber",
  "accountName",
  "tin",
  "termsAccepted",
  "createdAt",
  "updatedAt",
] as const;

/** PEP column keys (nested - included for completeness; flatten from pepData) */
export const PEP_COLUMN_KEYS = [
  "isPEP",
  "pepIsSelf",
  "pepCategories",
  "pepFullName",
  "pepRelationship",
  "pepNationality",
  "pepCountryOfExposure",
  "pepPublicOffice",
  "pepGovernmentBody",
  "pepDateCommenced",
  "pepDateEnded",
  "pepSourceOfWealth",
  "pepSourceOfFunds",
  "pepNetWorth",
  "pepFundingPattern",
  "pepTransactionFrequency",
  "pepAvgTransactionSize",
  "pepSubjectToSanctions",
  "pepInvestigated",
  "pepSanctionsDetails",
] as const;

const COLUMN_LABELS: Record<string, string> = {
  customerId: "Customer ID",
  status: "Status",
  rejectionReason: "Rejection Reason",
  passportPhoto: "Passport Photo",
  idType: "ID Type",
  idUpload: "ID Upload",
  title: "Title",
  firstName: "First Name",
  lastName: "Last Name",
  otherName: "Other Name",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  maritalStatus: "Marital Status",
  nationality: "Nationality",
  state: "State",
  lga: "LGA",
  email: "Email",
  phone: "Phone",
  contactAddress: "Contact Address",
  employmentStatus: "Employment Status",
  employerName: "Employer Name",
  employerAddress: "Employer Address",
  nokFirstName: "Next of Kin First Name",
  nokSurname: "Next of Kin Surname",
  nokOtherName: "Next of Kin Other Name",
  nokDateOfBirth: "Next of Kin Date of Birth",
  nokCountryCode: "Next of Kin Country Code",
  nokPhoneNumber: "Next of Kin Phone Number",
  nokRelationship: "Next of Kin Relationship",
  nokEmail: "Next of Kin Email",
  nokContactAddress: "Next of Kin Contact Address",
  investmentAmount: "Investment Amount",
  tenor: "Tenor",
  profitRemittance: "Profit Remittance",
  signature: "Signature",
  bvn: "BVN",
  bankName: "Bank Name",
  accountNumber: "Account Number",
  accountName: "Account Name",
  tin: "TIN",
  termsAccepted: "Terms Accepted",
  createdAt: "Created At",
  updatedAt: "Updated At",
  isPEP: "Is PEP",
  pepIsSelf: "PEP Is Self",
  pepCategories: "PEP Categories",
  pepFullName: "PEP Full Name",
  pepRelationship: "PEP Relationship",
  pepNationality: "PEP Nationality",
  pepCountryOfExposure: "PEP Country of Exposure",
  pepPublicOffice: "PEP Public Office",
  pepGovernmentBody: "PEP Government Body",
  pepDateCommenced: "PEP Date Commenced",
  pepDateEnded: "PEP Date Ended",
  pepSourceOfWealth: "PEP Source of Wealth",
  pepSourceOfFunds: "PEP Source of Funds",
  pepNetWorth: "PEP Net Worth",
  pepFundingPattern: "PEP Funding Pattern",
  pepTransactionFrequency: "PEP Transaction Frequency",
  pepAvgTransactionSize: "PEP Average Transaction Size",
  pepSubjectToSanctions: "PEP Subject to Sanctions",
  pepInvestigated: "PEP Investigated",
  pepSanctionsDetails: "PEP Sanctions Details",
  // Corporate
  companyCategory: "Company Category",
  companyName: "Company Name",
  registrationNumber: "Registration Number",
  dateOfIncorporation: "Date of Incorporation",
  countryOfIncorporation: "Country of Incorporation",
  typeOfBusiness: "Type of Business",
  sectorIndustry: "Sector/Industry",
  operatingAddress: "Operating Address",
  operatingState: "Operating State",
  registeredAddress: "Registered Address",
  registeredState: "Registered State",
  phone1: "Phone 1",
  phone2: "Phone 2",
  scumlRegNo: "SCUML Reg No",
  otherJurisdiction: "Other Jurisdiction",
  usTaxId: "US Tax ID",
  primaryBankName: "Primary Bank",
  primaryAccountName: "Primary Account Name",
  primaryAccountNumber: "Primary Account Number",
  secondaryBankName: "Secondary Bank",
  secondaryAccountName: "Secondary Account Name",
  secondaryAccountNumber: "Secondary Account Number",
  initialInvestmentAmount: "Initial Investment Amount",
  designatedEmail: "Designated Email",
  designatedPhone: "Designated Phone",
  indemnityConfirmed: "Indemnity Confirmed",
  dataUsageAgreed: "Data Usage Agreed",
};

/**
 * Converts a field key to a human-readable column label.
 * Uses predefined mappings when available; otherwise derives from camelCase.
 */
export function normalizeColumnName(key: string): string {
  const label = COLUMN_LABELS[key];
  if (label) return label;

  // Fallback: split camelCase and title-case each word
  const parts = key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
    .split(/\s+/);
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

const IMAGE_FIELDS = new Set(["passportPhoto", "idUpload", "signature"]);

function formatValue(
  key: string,
  val: unknown
): string | number | boolean {
  if (val === undefined || val === null) return "";
  if (IMAGE_FIELDS.has(key) && typeof val === "string" && val.length > 100) {
    return "Uploaded";
  }
  if (Array.isArray(val)) {
    return val.every((v) => typeof v !== "object")
      ? val.join(", ")
      : JSON.stringify(val);
  }
  if (typeof val === "object") return JSON.stringify(val);
  return val as string | number | boolean;
}

/**
 * Converts a customer record to an Excel row with normalized column headers.
 * Returns an object keyed by display labels (e.g. "First Name" not "firstName").
 */
export function customerToExcelRow(
  c: Record<string, unknown>
): Record<string, string | number | boolean> {
  const row: Record<string, string | number | boolean> = {};

  for (const key of NON_PEP_COLUMN_KEYS) {
    const label = normalizeColumnName(key);
    row[label] = formatValue(key, c[key]);
  }

  const pep = (c.pepData as PEPData | null) ?? {};
  for (const key of PEP_COLUMN_KEYS) {
    const label = normalizeColumnName(key);
    const val = pep[key];
    if (val === undefined || val === null) {
      row[label] = "";
    } else if (Array.isArray(val)) {
      row[label] = val.join(", ");
    } else {
      row[label] = String(val);
    }
  }

  return row;
}
