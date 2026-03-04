"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CoaGroup,
  CoaGroupFlat,
  CoaSubGroupFlat,
  InvestmentAccountSettings,
  CreateAccountGroupPayload,
  CreateAccountSubGroupPayload,
  UpdateAccountNamePayload,
  JournalEntry,
  JournalEntriesResponse,
  CreateJournalEntryPayload,
  GlResult,
  CoaBalanceItem,
  LedgerDetailResult,
  TrialBalanceResult,
  Fund,
  CreateFundPayload,
  UpdateFundPayload,
  ClientSearchResult,
} from "@/types";

const COA_KEY = "finance-coa";
const INV_SETTINGS_KEY = "finance-investment-settings";
const JOURNAL_KEY = "finance-journals";
const FUNDS_KEY = "finance-funds";
const GL_KEY = "finance-gl";
const TB_KEY = "finance-trial-balance";

// ─── Chart of Accounts ────────────────────────────────────────────────────────

export function useChartOfAccounts() {
  return useQuery({
    queryKey: [COA_KEY, "tree"],
    queryFn: async () => {
      const res = await api.get<CoaGroup[]>(
        "/api/proxy/finance/chart-of-accounts"
      );
      return res.data;
    },
  });
}

export function useCoaGroups() {
  return useQuery({
    queryKey: [COA_KEY, "groups"],
    queryFn: async () => {
      const res = await api.get<CoaGroupFlat[]>(
        "/api/proxy/finance/chart-of-accounts/groups"
      );
      return res.data;
    },
  });
}

export function useCoaSubGroups() {
  return useQuery({
    queryKey: [COA_KEY, "subgroups"],
    queryFn: async () => {
      const res = await api.get<CoaSubGroupFlat[]>(
        "/api/proxy/finance/chart-of-accounts/subgroups"
      );
      return res.data;
    },
  });
}

export function useCreateAccountGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountGroupPayload) =>
      api
        .post<CoaGroupFlat>(
          "/api/proxy/finance/chart-of-accounts/groups",
          payload
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COA_KEY] });
    },
  });
}

export function useCreateAccountSubGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountSubGroupPayload) =>
      api
        .post<CoaSubGroupFlat>(
          "/api/proxy/finance/chart-of-accounts/subgroups",
          payload
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COA_KEY] });
    },
  });
}

export function useUpdateAccountGroupName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, payload }: { code: number; payload: UpdateAccountNamePayload }) =>
      api
        .patch<CoaGroupFlat>(
          `/api/proxy/finance/chart-of-accounts/groups/${code}`,
          payload
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COA_KEY] });
    },
  });
}

export function useUpdateAccountSubGroupName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, payload }: { code: number; payload: UpdateAccountNamePayload }) =>
      api
        .patch<CoaSubGroupFlat>(
          `/api/proxy/finance/chart-of-accounts/subgroups/${code}`,
          payload
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COA_KEY] });
    },
  });
}

// ─── Investment Account Settings ──────────────────────────────────────────────

export function useInvestmentAccountSettings() {
  return useQuery({
    queryKey: [INV_SETTINGS_KEY],
    queryFn: async () => {
      const res = await api.get<InvestmentAccountSettings>(
        "/api/proxy/finance/chart-of-accounts/investment-settings"
      );
      return res.data;
    },
  });
}

export function useSetInvestmentDebitAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: number) =>
      api
        .patch<InvestmentAccountSettings>(
          "/api/proxy/finance/chart-of-accounts/investment-debit-account",
          { code }
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INV_SETTINGS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [COA_KEY] });
    },
  });
}

export function useSetInvestmentCreditAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: number) =>
      api
        .patch<InvestmentAccountSettings>(
          "/api/proxy/finance/chart-of-accounts/investment-credit-account",
          { code }
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INV_SETTINGS_KEY] });
      void queryClient.invalidateQueries({ queryKey: [COA_KEY] });
    },
  });
}

// ─── Journal Entries ──────────────────────────────────────────────────────────

export function useJournalEntries(
  page = 1,
  limit = 20,
  dateFrom?: string,
  dateTo?: string,
  status?: "pending" | "posted",
  sourceModule?: string
) {
  return useQuery({
    queryKey: [JOURNAL_KEY, page, limit, dateFrom, dateTo, status, sourceModule],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (status) params.status = status;
      if (sourceModule) params.sourceModule = sourceModule;
      const res = await api.get<JournalEntriesResponse>(
        "/api/proxy/finance/journals",
        { params }
      );
      return res.data;
    },
  });
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: [JOURNAL_KEY, id],
    queryFn: async () => {
      const res = await api.get<JournalEntry>(
        `/api/proxy/finance/journals/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) =>
      api
        .post<JournalEntry>("/api/proxy/finance/journals", payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [JOURNAL_KEY] });
      void queryClient.invalidateQueries({ queryKey: [GL_KEY] });
      void queryClient.invalidateQueries({ queryKey: [TB_KEY] });
    },
  });
}

export function useApproveJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api
        .post<JournalEntry>(`/api/proxy/finance/journals/${id}/approve`)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [JOURNAL_KEY] });
      void queryClient.invalidateQueries({ queryKey: [GL_KEY] });
      void queryClient.invalidateQueries({ queryKey: [TB_KEY] });
    },
  });
}

export interface BulkApproveResult {
  succeeded: string[];
  failed: { id: string; reference: string; error: string }[];
}

export function useBulkApproveJournalEntries() {
  const queryClient = useQueryClient();

  const approveOne = (id: string) =>
    api
      .post<JournalEntry>(`/api/proxy/finance/journals/${id}/approve`)
      .then((r) => r.data);

  const bulkApprove = async (
    entries: { id: string; reference: string }[],
    onProgress?: (done: number, total: number) => void
  ): Promise<BulkApproveResult> => {
    const result: BulkApproveResult = { succeeded: [], failed: [] };

    // Sequential approval respects the cryptographic hash chain ordering
    for (let i = 0; i < entries.length; i++) {
      const { id, reference } = entries[i];
      try {
        await approveOne(id);
        result.succeeded.push(id);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string | string[] } } })
            ?.response?.data?.message ?? "Approval failed";
        result.failed.push({
          id,
          reference,
          error: Array.isArray(msg) ? msg.join(", ") : msg,
        });
      }
      onProgress?.(i + 1, entries.length);
    }

    void queryClient.invalidateQueries({ queryKey: [JOURNAL_KEY] });
    void queryClient.invalidateQueries({ queryKey: [GL_KEY] });
    void queryClient.invalidateQueries({ queryKey: [TB_KEY] });

    return result;
  };

  return { bulkApprove };
}

export function useClientSearch(q: string) {
  return useQuery({
    queryKey: ["client-search", q],
    queryFn: async (): Promise<ClientSearchResult[]> => {
      if (!q.trim()) return [];
      const [individualsRes, corporatesRes] = await Promise.all([
        api.get<ClientSearchResult[]>("/api/proxy/customers/search", {
          params: { q, limit: 8 },
        }),
        api.get<ClientSearchResult[]>(
          "/api/proxy/corporate-customers/search",
          { params: { q, limit: 8 } }
        ),
      ]);
      return [...individualsRes.data, ...corporatesRes.data];
    },
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });
}

// ─── Funds ────────────────────────────────────────────────────────────────────

export function useFunds() {
  return useQuery({
    queryKey: [FUNDS_KEY],
    queryFn: async () => {
      const res = await api.get<Fund[]>("/api/proxy/finance/funds");
      return res.data;
    },
  });
}

export function useCreateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFundPayload) =>
      api
        .post<Fund>("/api/proxy/finance/funds", payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FUNDS_KEY] });
    },
  });
}

export function useUpdateFund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFundPayload }) =>
      api
        .patch<Fund>(`/api/proxy/finance/funds/${id}`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [FUNDS_KEY] });
    },
  });
}

// ─── General Ledger ───────────────────────────────────────────────────────────

export function useCoaBalances(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: [GL_KEY, "coa-balances", dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get<CoaBalanceItem[]>(
        "/api/proxy/finance/gl/coa-balances",
        { params }
      );
      return res.data;
    },
  });
}

export function useLedgerDetail(
  account: string,
  dateFrom?: string,
  dateTo?: string,
  page = 1,
  limit = 50
) {
  return useQuery({
    queryKey: [GL_KEY, "ledger", account, dateFrom, dateTo, page, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        account,
        page,
        limit,
      };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get<LedgerDetailResult>(
        "/api/proxy/finance/gl/ledger",
        { params }
      );
      return res.data;
    },
    enabled: !!account,
  });
}

export function useGl(
  account: string,
  dateFrom?: string,
  dateTo?: string,
  page = 1,
  limit = 50
) {
  return useQuery({
    queryKey: [GL_KEY, account, dateFrom, dateTo, page, limit],
    queryFn: async () => {
      const params: Record<string, string | number> = { account, page, limit };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get<GlResult>("/api/proxy/finance/gl", { params });
      return res.data;
    },
    enabled: !!account,
  });
}

// ─── Trial Balance ────────────────────────────────────────────────────────────

export function useTrialBalance(asOfDate: string) {
  return useQuery({
    queryKey: [TB_KEY, asOfDate],
    queryFn: async () => {
      const res = await api.get<TrialBalanceResult>(
        "/api/proxy/finance/trial-balance",
        { params: { asOfDate } }
      );
      return res.data;
    },
    enabled: !!asOfDate,
  });
}
