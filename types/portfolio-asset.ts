export interface PortfolioAsset {
  id: string;
  portfolioAssetId: string;
  counterParty: string;
  investmentAmount: number;
  profitRate: number;
  investmentTenorDays: number;
  investmentStartDate: string;
  investmentEndDate: string;
  accruedDaysCutoff: number;
  daysToMaturity: number;
  profitFrequency?: string | null;
  redemptionTerms?: string | null;
  accruedProfitCutoff: number;
  accruedProfitEndDate: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioAssetsResponse {
  data: PortfolioAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePortfolioAssetPayload {
  counterParty: string;
  investmentAmount: number;
  profitRate: number;
  investmentTenorDays: number;
  investmentStartDate: string;
  investmentEndDate: string;
  accruedDaysCutoff: number;
  daysToMaturity: number;
  accruedProfitCutoff: number;
  accruedProfitEndDate: number;
}
