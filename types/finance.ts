export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface CoaSubGroup {
  id: string;
  code: number;
  name: string;
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
  createdAt: string;
  updatedAt: string;
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

export interface AccountingTransaction {
  id: string;
  reference: string;
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingTransactionsResponse {
  data: AccountingTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAccountingTransactionPayload {
  date: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  narration?: string;
}

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
