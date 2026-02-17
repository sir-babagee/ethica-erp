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
  action: "approved" | "rejected" | "escalated";
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
  currentAssigneeRole: string | null;
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
  contactAddressState: string | null;
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
  nokAddressState: string | null;
  investmentAmount: number;
  tenor: string;
  rollover: string;
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

export interface UBOData {
  title: string;
  surname: string;
  firstName: string;
  otherName: string;
  gender: string;
  dateOfBirth: string;
  residentialAddress: string;
  nationality: string;
  state: string;
  lga: string;
  phoneCountryCode: string;
  contactNumber: string;
  email: string;
  bvn: string;
  nin: string;
  designation: string;
  shareholdingPercent: string;
  sourceOfWealth: string;
  isAlsoSignatory: string;
  signature: string;
}

export interface SignatoryData {
  bvn: string;
  title: string;
  surname: string;
  firstName: string;
  otherName: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  phoneCountryCode: string;
  contactNumber: string;
  email: string;
  idType: string;
  idPhoto: string;
  occupation: string;
  placeOfWork: string;
  jobTitle: string;
  workAddress: string;
  workState: string;
  residentialAddress: string;
  residentialState: string;
  isPep: string;
  nin: string;
}

export interface AccountMandateData {
  passport: string;
  name: string;
  signature: string;
  classOfSignatory: string;
}

export interface CorporateCustomer {
  id: string;
  customerId: string | null;
  status: "unverified" | "approved" | "rejected";
  companyCategory: string;
  companyName: string;
  email: string;
  phone1: string;
  initialInvestmentAmount: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface CorporateCustomersResponse {
  data: CorporateCustomer[];
  pagination: {
    currentPage: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export interface CorporateCustomerDetail extends CorporateCustomer {
  rejectionReason: string | null;
  currentAssigneeRole: string | null;
  activity: ActivityItem[];
  registrationNumber: string;
  dateOfIncorporation: string;
  countryOfIncorporation: string;
  typeOfBusiness: string;
  sectorIndustry: string;
  operatingAddress: string;
  operatingState: string;
  registeredAddress: string;
  registeredState: string;
  tin: string;
  phone2: string | null;
  scumlRegNo: string | null;
  ubos: UBOData[];
  otherJurisdiction: string | null;
  usTaxId: string | null;
  signatories: SignatoryData[];
  primaryBankName: string;
  primaryAccountName: string;
  primaryAccountNumber: string;
  secondaryBankName: string | null;
  secondaryAccountName: string | null;
  secondaryAccountNumber: string | null;
  accountMandates: AccountMandateData[];
  tenor: string;
  profitRemittance: string;
  designatedEmail: string;
  designatedPhone: string;
  indemnityConfirmed: boolean;
  dataUsageAgreed: boolean;
  updatedAt: string;
}
