export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  state: string;
  country: string;
  isHeadOffice: boolean;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  name: string;
  code: string;
  address: string;
  state: string;
  country?: string;
  isHeadOffice?: boolean;
}

export interface UpdateBranchPayload {
  name?: string;
  address?: string;
  state?: string;
  isActive?: boolean;
  isHeadOffice?: boolean;
}
