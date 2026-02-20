export interface RateGuide {
  id: string;
  tenor: number;
  indicativeRate: number;
  minimumSpread: number;
  ethicaRatio: number;
  customerRatio: number;
  aboveTargetEthicaRatio: number;
  aboveTargetCustomerRatio: number;
  minimumAmount: number;
  maximumAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRateGuidePayload {
  tenor: number;
  indicativeRate: number;
  minimumSpread: number;
  ethicaRatio: number;
  customerRatio: number;
  aboveTargetEthicaRatio: number;
  aboveTargetCustomerRatio: number;
  minimumAmount: number;
  maximumAmount: number;
}

export type UpdateRateGuidePayload = Partial<CreateRateGuidePayload>;

export interface BulkReplaceRateGuidesPayload {
  entries: CreateRateGuidePayload[];
}
