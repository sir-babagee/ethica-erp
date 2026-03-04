"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import {
  useChartOfAccounts,
  useCreateAccountGroup,
  useCreateAccountSubGroup,
  useUpdateAccountGroupName,
  useUpdateAccountSubGroupName,
  useInvestmentAccountSettings,
  useSetInvestmentDebitAccount,
  useSetInvestmentCreditAccount,
} from "@/services/finance";
import type {
  AccountType,
  CoaGroup,
  CreateAccountGroupPayload,
  CreateAccountSubGroupPayload,
} from "@/types";
import toast from "react-hot-toast";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
  fund_control: "Fund Control",
  suspense: "Suspense",
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: "bg-blue-100 text-blue-700",
  liability: "bg-red-100 text-red-700",
  equity: "bg-purple-100 text-purple-700",
  revenue: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700",
  fund_control: "bg-teal-100 text-teal-700",
  suspense: "bg-gray-200 text-gray-600",
};

// ─── Create Group Modal ───────────────────────────────────────────────────────

function CreateGroupModal({
  groups,
  onClose,
}: {
  groups: CoaGroup[];
  onClose: () => void;
}) {
  const [form, setForm] = useState<CreateAccountGroupPayload>({
    code: 1000,
    name: "",
    accountType: "asset",
  });
  const [submitError, setSubmitError] = useState("");
  const mutation = useCreateAccountGroup();

  // All codes already in use across groups and sub-groups
  const allUsedCodes = new Set<number>([
    ...groups.map((g) => g.code),
    ...groups.flatMap((g) => g.subGroups.map((s) => s.code)),
  ]);

  const codeAlreadyExists = allUsedCodes.has(form.code);
  const codeError = codeAlreadyExists
    ? `Code ${form.code} is already in use. All account codes must be unique.`
    : null;

  const isBlocked = !!codeError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;
    setSubmitError("");
    try {
      await mutation.mutateAsync(form);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create account group";
      setSubmitError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          New Account Group
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Code <span className="text-gray-400">(multiple of 1000)</span>
            </label>
            <input
              type="number"
              min={1000}
              max={9000}
              step={1000}
              required
              value={form.code}
              onChange={(e) =>
                setForm((f) => ({ ...f, code: parseInt(e.target.value, 10) }))
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 ${
                codeError
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:border-primary focus:ring-primary"
              }`}
            />
            {codeError ? (
              <p className="mt-1 text-xs text-red-600">{codeError}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                e.g. 1000 = Assets (covers range 1000–1999)
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Assets"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Account Type
            </label>
            <select
              required
              value={form.accountType}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  accountType: e.target.value as AccountType,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="fund_control">Fund / Client Control</option>
              <option value="suspense">Suspense / Off-Balance</option>
            </select>
          </div>
          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {submitError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isBlocked}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? "Creating…" : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create Sub-group Modal ───────────────────────────────────────────────────

function CreateSubGroupModal({
  groups,
  preselectedGroup,
  onClose,
}: {
  groups: CoaGroup[];
  preselectedGroup?: CoaGroup;
  onClose: () => void;
}) {
  const [selectedGroupCode, setSelectedGroupCode] = useState<number | "">(
    preselectedGroup?.code ?? groups[0]?.code ?? ""
  );
  const [suffix, setSuffix] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const mutation = useCreateAccountSubGroup();

  const isLocked = !!preselectedGroup;
  const selectedGroup = isLocked
    ? preselectedGroup
    : groups.find((g) => g.code === selectedGroupCode);

  const prefix = selectedGroup ? String(selectedGroup.code)[0] : "";

  const fullCode =
    prefix && suffix.length === 3
      ? parseInt(`${prefix}${suffix}`, 10)
      : null;

  const allUsedCodes = new Set<number>([
    ...groups.map((g) => g.code),
    ...groups.flatMap((g) => g.subGroups.map((s) => s.code)),
  ]);

  const suffixError =
    suffix.length === 3 && fullCode !== null
      ? fullCode % 1000 === 0
        ? `"${prefix}${suffix}" resolves to ${fullCode}, which is a group header. Try a suffix other than "000".`
        : allUsedCodes.has(fullCode)
        ? `Code ${fullCode} is already in use. All account codes must be unique.`
        : null
      : null;

  const canSubmit =
    !!selectedGroup &&
    suffix.length === 3 &&
    fullCode !== null &&
    !suffixError &&
    name.trim().length > 0;

  const handleSuffixChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setSuffix(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || fullCode === null) return;
    setSubmitError("");
    try {
      await mutation.mutateAsync({ code: fullCode, name: name.trim() });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create sub-group";
      setSubmitError(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">
          {isLocked
            ? `Add Sub-Group to ${selectedGroup!.name}`
            : "New Account Sub-Group"}
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          {isLocked
            ? "The parent group is fixed. Enter the last 3 digits of the new sub-group code and a name."
            : "Select a group, then enter the last 3 digits of the sub-group code."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Parent group — locked read-only strip or dropdown */}
          {isLocked ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white font-mono text-sm font-bold text-gray-700 shadow-sm">
                {selectedGroup!.code}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedGroup!.name}
                </p>
                <p className="text-xs text-gray-500">
                  Range: {selectedGroup!.code}–{selectedGroup!.code + 999}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ACCOUNT_TYPE_COLORS[selectedGroup!.accountType]}`}
              >
                {ACCOUNT_TYPE_LABELS[selectedGroup!.accountType]}
              </span>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                1. Account Group
              </label>
              {groups.length === 0 ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  No groups exist yet. Create a group first.
                </p>
              ) : (
                <select
                  required
                  value={selectedGroupCode}
                  onChange={(e) => {
                    setSelectedGroupCode(parseInt(e.target.value, 10));
                    setSuffix("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {groups.map((g) => (
                    <option key={g.code} value={g.code}>
                      {g.code} – {g.name} ({g.accountType})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Sub-group code with locked prefix */}
          {selectedGroup && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {isLocked ? "1." : "2."} Sub-Group Code
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <div className="flex items-center gap-1.5 border-r border-gray-300 bg-gray-100 px-3 py-2">
                  <span className="font-mono text-sm font-bold text-gray-700">
                    {prefix}
                  </span>
                  <span className="text-xs text-gray-400">fixed</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="___"
                  value={suffix}
                  autoFocus={isLocked}
                  onChange={(e) => handleSuffixChange(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                />
                {suffix.length > 0 && (
                  <div className="border-l border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="font-mono text-sm text-gray-500">
                      = {prefix}{suffix.padEnd(3, "_")}
                    </span>
                  </div>
                )}
              </div>

              {suffix.length === 3 && fullCode !== null ? (
                suffixError ? (
                  <p className="mt-1 text-xs text-red-600">{suffixError}</p>
                ) : (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Code{" "}
                    <span className="font-mono font-semibold">{fullCode}</span>{" "}
                    — will be added under{" "}
                    <strong>{selectedGroup.code} – {selectedGroup.name}</strong>
                  </p>
                )
              ) : suffix.length > 0 ? (
                <p className="mt-1 text-xs text-gray-400">
                  Enter {3 - suffix.length} more digit{3 - suffix.length !== 1 ? "s" : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Type 3 digits — e.g. "001" to create code{" "}
                  <span className="font-mono">{prefix}001</span>
                </p>
              )}
            </div>
          )}

          {/* Name */}
          {selectedGroup && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {isLocked ? "2." : "3."} Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cash at Bank (Operating)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {submitError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {submitError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !canSubmit}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? "Creating…" : "Create Sub-Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Investment Account Setup Panel ──────────────────────────────────────────

function InvestmentAccountSetupPanel({
  groups,
  canManage,
}: {
  groups: CoaGroup[];
  canManage: boolean;
}) {
  const { data: settings, isLoading: settingsLoading } =
    useInvestmentAccountSettings();
  const debitMutation = useSetInvestmentDebitAccount();
  const creditMutation = useSetInvestmentCreditAccount();

  const [selectingDebit, setSelectingDebit] = useState(false);
  const [selectingCredit, setSelectingCredit] = useState(false);
  const [selectedDebitCode, setSelectedDebitCode] = useState<number | "">("");
  const [selectedCreditCode, setSelectedCreditCode] = useState<number | "">("");

  // Filter sub-groups by account type for each picker
  const assetSubGroups = groups
    .filter((g) => g.accountType === "asset")
    .flatMap((g) => g.subGroups.map((s) => ({ ...s, groupName: g.name })));
  const liabilitySubGroups = groups
    .filter((g) => g.accountType === "liability")
    .flatMap((g) => g.subGroups.map((s) => ({ ...s, groupName: g.name })));

  async function handleSetDebit() {
    if (!selectedDebitCode) return;
    try {
      await debitMutation.mutateAsync(Number(selectedDebitCode));
      toast.success("Custodian (debit) account updated.");
      setSelectingDebit(false);
      setSelectedDebitCode("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to set debit account";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  }

  async function handleSetCredit() {
    if (!selectedCreditCode) return;
    try {
      await creditMutation.mutateAsync(Number(selectedCreditCode));
      toast.success("Customer liabilities (credit) account updated.");
      setSelectingCredit(false);
      setSelectedCreditCode("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to set credit account";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  }

  const isConfigured = !!(settings?.debitSubGroup && settings?.creditSubGroup);

  return (
    <div
      className={`rounded-xl border ${
        isConfigured
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      } p-5`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Investment Account Mapping
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">
            When an investment is approved, the system automatically posts a
            double-entry journal:{" "}
            <strong>DR Custodian Account</strong> and{" "}
            <strong>CR Customer Liabilities Account</strong>. Both must be
            configured before any investment entry can be submitted.
          </p>
        </div>
        {isConfigured ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            Configured
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Not configured
          </span>
        )}
      </div>

      {settingsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
          Loading settings…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Debit — Custodian Account (Asset) */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                DR
              </span>
              <span className="text-sm font-semibold text-gray-800">
                Custodian Account
              </span>
              <span className="text-xs text-gray-400">(Asset)</span>
            </div>
            {settings?.debitSubGroup ? (
              <div className="mb-3">
                <p className="font-mono text-sm font-bold text-gray-900">
                  {settings.debitSubGroup.code}
                </p>
                <p className="text-sm text-gray-600">
                  {settings.debitSubGroup.name}
                </p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-amber-700">
                No account designated yet.
              </p>
            )}
            {canManage &&
              (selectingDebit ? (
                <div className="space-y-2">
                  {assetSubGroups.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No Asset sub-groups exist. Create one first.
                    </p>
                  ) : (
                    <>
                      <select
                        value={selectedDebitCode}
                        onChange={(e) =>
                          setSelectedDebitCode(
                            e.target.value ? parseInt(e.target.value, 10) : ""
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select sub-group…</option>
                        {assetSubGroups.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code} — {s.name} ({s.groupName})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSetDebit}
                          disabled={
                            !selectedDebitCode || debitMutation.isPending
                          }
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {debitMutation.isPending ? "Saving…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectingDebit(false);
                            setSelectedDebitCode("");
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSelectingDebit(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {settings?.debitSubGroup ? "Change account" : "Designate account"}
                </button>
              ))}
          </div>

          {/* Credit — Customer Liabilities Account (Liability) */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                CR
              </span>
              <span className="text-sm font-semibold text-gray-800">
                Customer Liabilities Account
              </span>
              <span className="text-xs text-gray-400">(Liability)</span>
            </div>
            {settings?.creditSubGroup ? (
              <div className="mb-3">
                <p className="font-mono text-sm font-bold text-gray-900">
                  {settings.creditSubGroup.code}
                </p>
                <p className="text-sm text-gray-600">
                  {settings.creditSubGroup.name}
                </p>
              </div>
            ) : (
              <p className="mb-3 text-sm text-amber-700">
                No account designated yet.
              </p>
            )}
            {canManage &&
              (selectingCredit ? (
                <div className="space-y-2">
                  {liabilitySubGroups.length === 0 ? (
                    <p className="text-xs text-gray-500">
                      No Liability sub-groups exist. Create one first.
                    </p>
                  ) : (
                    <>
                      <select
                        value={selectedCreditCode}
                        onChange={(e) =>
                          setSelectedCreditCode(
                            e.target.value ? parseInt(e.target.value, 10) : ""
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Select sub-group…</option>
                        {liabilitySubGroups.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code} — {s.name} ({s.groupName})
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSetCredit}
                          disabled={
                            !selectedCreditCode || creditMutation.isPending
                          }
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creditMutation.isPending ? "Saving…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => {
                            setSelectingCredit(false);
                            setSelectedCreditCode("");
                          }}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSelectingCredit(true)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {settings?.creditSubGroup ? "Change account" : "Designate account"}
                </button>
              ))}
          </div>
        </div>
      )}

      {!isConfigured && !settingsLoading && (
        <p className="mt-3 text-xs text-amber-700">
          Both accounts must be designated before investment entries can be
          submitted.
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChartOfAccountsPage() {
  const permissions = useAuthStore((s) => s.permissions);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSubGroupModal, setShowSubGroupModal] = useState(false);
  const [inlineSubGroupFor, setInlineSubGroupFor] = useState<CoaGroup | null>(null);

  // Inline rename state — only one item editable at a time
  const [editingGroupCode, setEditingGroupCode] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [editingSubCode, setEditingSubCode] = useState<number | null>(null);
  const [editingSubName, setEditingSubName] = useState("");

  const updateGroupMutation = useUpdateAccountGroupName();
  const updateSubMutation = useUpdateAccountSubGroupName();

  function startEditGroup(code: number, currentName: string) {
    setEditingSubCode(null);
    setEditingGroupCode(code);
    setEditingGroupName(currentName);
  }

  function startEditSub(code: number, currentName: string) {
    setEditingGroupCode(null);
    setEditingSubCode(code);
    setEditingSubName(currentName);
  }

  async function saveGroupName(code: number) {
    const name = editingGroupName.trim();
    if (!name) return;
    try {
      await updateGroupMutation.mutateAsync({ code, payload: { name } });
      toast.success("Group name updated.");
      setEditingGroupCode(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update name";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  }

  async function saveSubName(code: number) {
    const name = editingSubName.trim();
    if (!name) return;
    try {
      await updateSubMutation.mutateAsync({ code, payload: { name } });
      toast.success("Sub-group name updated.");
      setEditingSubCode(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update name";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    }
  }

  const { data: groups, isLoading, error } = useChartOfAccounts();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="mt-1 text-gray-500">Account categories and sub-categories</p>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border border-gray-200 bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load chart of accounts. Please try again.
        </div>
      </div>
    );
  }

  const coaGroups = groups ?? [];

  return (
    <div className="p-8">
      {showGroupModal && (
        <CreateGroupModal
          groups={coaGroups}
          onClose={() => setShowGroupModal(false)}
        />
      )}
      {showSubGroupModal && (
        <CreateSubGroupModal
          groups={coaGroups}
          onClose={() => setShowSubGroupModal(false)}
        />
      )}
      {inlineSubGroupFor && (
        <CreateSubGroupModal
          groups={coaGroups}
          preselectedGroup={inlineSubGroupFor}
          onClose={() => setInlineSubGroupFor(null)}
        />
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="mt-1 text-gray-500">
            Account groups and sub-groups used for transaction classification
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowSubGroupModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Sub-Group
            </button>
            <button
              onClick={() => setShowGroupModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Group
            </button>
          </div>
        )}
      </div>

      {/* Investment Account Mapping — always visible to finance users */}
      <div className="mb-6">
        <InvestmentAccountSetupPanel
          groups={coaGroups}
          canManage={canManage}
        />
      </div>

      {coaGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 text-center">
          <p className="text-gray-500">No account groups defined yet.</p>
          {canManage && (
            <button
              onClick={() => setShowGroupModal(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Create your first group
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {coaGroups.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              {/* Group header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-gray-200 font-mono text-sm font-bold text-gray-700 shadow-sm">
                    {group.code}
                  </div>
                  <div>
                    {canManage && editingGroupCode === group.code ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveGroupName(group.code);
                            if (e.key === "Escape") setEditingGroupCode(null);
                          }}
                          className="rounded-md border border-primary px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          onClick={() => void saveGroupName(group.code)}
                          disabled={
                            !editingGroupName.trim() ||
                            updateGroupMutation.isPending
                          }
                          className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                          {updateGroupMutation.isPending ? "…" : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingGroupCode(null)}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {group.name}
                        </p>
                        {canManage && (
                          <button
                            onClick={() =>
                              startEditGroup(group.code, group.name)
                            }
                            title="Rename group"
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Range: {group.rangeLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {canManage && (
                    <button
                      onClick={() => setInlineSubGroupFor(group)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 hover:text-gray-900"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Sub-group
                    </button>
                  )}
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${ACCOUNT_TYPE_COLORS[group.accountType]}`}
                  >
                    {ACCOUNT_TYPE_LABELS[group.accountType]}
                  </span>
                </div>
              </div>

              {/* Sub-groups */}
                {group.subGroups.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {group.subGroups.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-4 px-5 py-3"
                    >
                      <div className="ml-8 flex items-center gap-3">
                        <svg
                          className="h-3.5 w-3.5 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <span className="font-mono text-sm font-medium text-gray-700">
                          {sub.code}
                        </span>
                      </div>
                      {canManage && editingSubCode === sub.code ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={editingSubName}
                            onChange={(e) => setEditingSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void saveSubName(sub.code);
                              if (e.key === "Escape") setEditingSubCode(null);
                            }}
                            className="rounded-md border border-primary px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            onClick={() => void saveSubName(sub.code)}
                            disabled={
                              !editingSubName.trim() ||
                              updateSubMutation.isPending
                            }
                            className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                          >
                            {updateSubMutation.isPending ? "…" : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingSubCode(null)}
                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {sub.name}
                          </span>
                          {canManage && (
                            <button
                              onClick={() =>
                                startEditSub(sub.code, sub.name)
                              }
                              title="Rename sub-group"
                              className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                            >
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                      {sub.isInvestmentDebitAccount && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Investment DR
                        </span>
                      )}
                      {sub.isInvestmentCreditAccount && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Investment CR
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-3 text-sm text-gray-400 italic">
                  No sub-groups. Transactions can be posted directly under this group.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
