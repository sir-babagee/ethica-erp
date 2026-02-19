export type InvestmentStatus = "pending" | "approved" | "rejected";
export type CustomerType = "personal" | "corporate";

export interface InvestmentStaffSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Investment {
  id: string;
  investmentRef: string;

  customerId: string;
  customerType: CustomerType;
  customerCode: string;
  customerName: string;

  investmentAmount: number;
  tenorDays: number;
  startDate: string;
  endDate: string;
  profitRemittance: string;
  rollover: string;
  product: string;

  indicativeRate: number;
  customerSharingRatio: number;
  aboveTargetCustomerSharingRatio: number;
  accruedProfitCutoff: number;
  accruedProfitEndDate: number;

  status: InvestmentStatus;
  rejectionReason: string | null;

  createdById: string;
  createdBy: InvestmentStaffSnapshot | null;
  approvedById: string | null;
  approvedBy: InvestmentStaffSnapshot | null;
  rejectedById: string | null;
  rejectedBy: InvestmentStaffSnapshot | null;

  createdAt: string;
  updatedAt: string;
}

export interface InvestmentsResponse {
  data: Investment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerLookupResult {
  type: "personal" | "corporate";
  customer: {
    id: string;
    customerId: string | null;
    firstName?: string;
    lastName?: string;
    title?: string;
    companyName?: string;
    email: string;
    phone?: string | null;
    phone1?: string | null;
    investmentAmount?: number;
    initialInvestmentAmount?: number;
    tenor?: string;
    rollover?: string;
    profitRemittance?: string;
    [key: string]: unknown;
  };
}

export interface CreateInvestmentPayload {
  customerId: string;
  customerType: "personal" | "corporate";
  tenorDays: number;
  startDate: string;
  profitRemittance: string;
  indicativeRate: number;
  customerSharingRatio: number;
  aboveTargetCustomerSharingRatio: number;
  accruedProfitCutoff: number;
  accruedProfitEndDate: number;
}
