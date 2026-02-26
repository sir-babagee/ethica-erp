import type { ActivityItem } from "./customer";

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
  idType: string;
  idPhoto: string;
  utilityBill: string;
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
  idType: string;
  idCard: string;
  bvn: string;
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
  cacMerged: boolean;
  cacDocument: string | null;
  cacMemorandum: string | null;
  cacCertificate: string | null;
  cacStatusReport: string | null;
  boardResolution: string | null;
  companyUtilityBill: string | null;
  hasScuml: boolean;
  scumlDocument: string | null;
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
