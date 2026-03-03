export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense'
  | 'fund_control'
  | 'suspense';

export type SourceModule =
  | 'manual'
  | 'trade'
  | 'subscription'
  | 'redemption'
  | 'nav_adjustment'
  | 'fx_revaluation'
  | 'purification'
  | 'management_fee'
  | 'payroll';

export type ShariahTag = 'halal' | 'haram' | 'purification';

export type JournalStatus = 'pending' | 'posted';

export type ClientType = 'individual' | 'corporate';

export interface ClientSearchResult {
  id: string;
  customerId: string | null;
  name: string;
  type: ClientType;
}

// ─── Chart of Accounts ────────────────────────────────────────────────────────

export interface CoaSubGroup {
  id: string;
  code: number;
  name: string;
  isInvestmentDebitAccount: boolean;
  isInvestmentCreditAccount: boolean;
}

export interface CoaGroup {
  id: string;
  code: number;
  name: string;
  accountType: AccountType;
  rangeLabel: string;
  subGroups: CoaSubGroup[];
}

export interface CoaGroupFlat {
  id: string;
  code: number;
  name: string;
  accountType: AccountType;
  createdAt: string;
  updatedAt: string;
}

export interface CoaSubGroupFlat {
  id: string;
  code: number;
  name: string;
  groupCode: number;
  isInvestmentDebitAccount: boolean;
  isInvestmentCreditAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentAccountSubGroup {
  id: string;
  code: number;
  name: string;
  groupCode: number;
}

export interface InvestmentAccountSettings {
  debitSubGroup: InvestmentAccountSubGroup | null;
  creditSubGroup: InvestmentAccountSubGroup | null;
}

export interface CreateAccountGroupPayload {
  code: number;
  name: string;
  accountType: AccountType;
}

export interface CreateAccountSubGroupPayload {
  code: number;
  name: string;
}

export interface UpdateAccountNamePayload {
  name: string;
}

// ─── Journal Entries ──────────────────────────────────────────────────────────

export interface JournalLine {
  id: string;
  journalId: string;
  account: string;
  debitAmount: number | null;
  creditAmount: number | null;
  shariahTag: ShariahTag | null;
  currency: string;
  fxRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  reference: string;
  date: string;
  sourceModule: SourceModule;
  fundId: string | null;
  clientId: string | null;
  clientType: ClientType | null;
  entityId: string | null;
  narration: string | null;
  status: JournalStatus;
  createdById: string;
  approvedById: string | null;
  approvedAt: string | null;
  previousHash: string | null;
  currentHash: string | null;
  lines: JournalLine[];
  createdAt: string;
  updatedAt: string;
  fund?: { id: string; name: string; code: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  client?: ClientSearchResult | null;
}

export interface JournalEntriesResponse {
  data: JournalEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateJournalLinePayload {
  account: string;
  debitAmount?: number;
  creditAmount?: number;
  shariahTag?: ShariahTag;
  currency?: string;
  fxRate?: number;
}

export interface CreateJournalEntryPayload {
  date: string;
  sourceModule: SourceModule;
  narration?: string;
  fundId?: string;
  clientId?: string;
  clientType?: ClientType;
  lines: CreateJournalLinePayload[];
}

// ─── Funds ────────────────────────────────────────────────────────────────────

export interface Fund {
  id: string;
  name: string;
  code: string;
  description: string | null;
  currency: string;
  isActive: boolean;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFundPayload {
  name: string;
  code: string;
  description?: string;
  currency?: string;
}

export interface UpdateFundPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// ─── General Ledger ───────────────────────────────────────────────────────────

export interface GlEntry {
  id: string;
  date: string;
  reference: string;
  narration: string | null;
  debit: number | null;
  credit: number | null;
  runningBalance: number;
}

export interface GlResult {
  account: string;
  accountName: string;
  accountType: AccountType;
  entries: GlEntry[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface CoaBalanceItem {
  code: number;
  name: string;
  accountType: AccountType;
  balance: number;
  isGroup: boolean;
  groupCode?: number;
}

export interface SubledgerBalance {
  code: number;
  name: string;
  balance: number;
}

export interface LedgerDetailResult extends GlResult {
  subledgerBalances?: SubledgerBalance[];
  directEntries: GlEntry[];
}

// ─── Trial Balance ────────────────────────────────────────────────────────────

export interface TrialBalanceAccount {
  code: number;
  name: string;
  accountType: AccountType;
  debit: number;
  credit: number;
  balance: number;
  isGroup: boolean;
}

export interface TrialBalanceResult {
  asOfDate: string;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
  accountsByType: Record<string, TrialBalanceAccount[]>;
  totalDebit: number;
  totalCredit: number;
  balances: boolean;
}
