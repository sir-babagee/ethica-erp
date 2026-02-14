export type { Staff, LoginCredentials, LoginResponse } from "./auth";

export interface Customer {
  id: string;
  customerId: string | null;
  status: "unverified" | "approved" | "rejected";
  title: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  email: string;
  phone: string | null;
  investmentAmount: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface ActivityItem {
  action: "approved" | "rejected";
  staffId: string;
  timestamp: string;
  reason?: string;
}

export interface PEPData {
  isPEP?: boolean;
  pepIsSelf?: boolean;
  pepCategories?: string[];
  pepFullName?: string;
  pepRelationship?: string;
  pepNationality?: string;
  pepCountryOfExposure?: string;
  pepPublicOffice?: string;
  pepGovernmentBody?: string;
  pepDateCommenced?: string;
  pepDateEnded?: string;
  pepSourceOfWealth?: string;
  pepSourceOfFunds?: string;
  pepNetWorth?: string;
  pepFundingPattern?: string;
  pepTransactionFrequency?: string;
  pepAvgTransactionSize?: number | string;
  pepSubjectToSanctions?: string;
  pepInvestigated?: string;
  pepSanctionsDetails?: string;
  [key: string]: unknown;
}

export interface CustomerDetail {
  id: string;
  customerId: string | null;
  status: "unverified" | "approved" | "rejected";
  rejectionReason: string | null;
  activity: ActivityItem[];
  passportPhoto: string | null;
  idType: string | null;
  idUpload: string | null;
  title: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  state: string | null;
  lga: string | null;
  email: string;
  phone: string | null;
  contactAddress: string;
  employmentStatus: string;
  employerName: string | null;
  employerAddress: string | null;
  nokFirstName: string;
  nokSurname: string;
  nokOtherName: string | null;
  nokDateOfBirth: string;
  nokCountryCode: string;
  nokPhoneNumber: string;
  nokRelationship: string;
  nokEmail: string;
  nokContactAddress: string;
  investmentAmount: number;
  tenor: string;
  profitRemittance: string;
  signature: string | null;
  bvn: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  tin: string | null;
  contactPersons: string[];
  sourceOfWealth: string[] | null;
  sourceOfWealthDetails: Record<string, string> | null;
  pepData: PEPData | null;
  termsAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}
