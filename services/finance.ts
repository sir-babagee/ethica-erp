"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  CoaGroup,
  CoaGroupFlat,
  CoaSubGroupFlat,
  CreateAccountGroupPayload,
  CreateAccountSubGroupPayload,
  AccountingTransaction,
  AccountingTransactionsResponse,
  CreateAccountingTransactionPayload,
  GlResult,
} from "@/types";

const COA_KEY = "finance-coa";
const TX_KEY = "finance-transactions";
const GL_KEY = "finance-gl";

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

// ─── Accounting Transactions ──────────────────────────────────────────────────

export function useAccountingTransactions(
  page = 1,
  limit = 20,
  dateFrom?: string,
  dateTo?: string,
  account?: string
) {
  return useQuery({
    queryKey: [TX_KEY, page, limit, dateFrom, dateTo, account],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit };
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      if (account) params.account = account;
      const res = await api.get<AccountingTransactionsResponse>(
        "/api/proxy/finance/transactions",
        { params }
      );
      return res.data;
    },
  });
}

export function useAccountingTransaction(id: string) {
  return useQuery({
    queryKey: [TX_KEY, id],
    queryFn: async () => {
      const res = await api.get<AccountingTransaction>(
        `/api/proxy/finance/transactions/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateAccountingTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountingTransactionPayload) =>
      api
        .post<AccountingTransaction>(
          "/api/proxy/finance/transactions",
          payload
        )
        .then((r) => r.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [TX_KEY] });
      void queryClient.invalidateQueries({ queryKey: [GL_KEY] });
    },
  });
}

// ─── General Ledger ───────────────────────────────────────────────────────────

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
