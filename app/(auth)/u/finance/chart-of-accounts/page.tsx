"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import {
  useChartOfAccounts,
  useCreateAccountGroup,
  useCreateAccountSubGroup,
} from "@/services/finance";
import type {
  AccountType,
  CoaGroup,
  CreateAccountGroupPayload,
  CreateAccountSubGroupPayload,
} from "@/types";

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  asset: "bg-blue-100 text-blue-700",
  liability: "bg-red-100 text-red-700",
  equity: "bg-purple-100 text-purple-700",
  revenue: "bg-green-100 text-green-700",
  expense: "bg-orange-100 text-orange-700",
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
  onClose,
}: {
  groups: CoaGroup[];
  onClose: () => void;
}) {
  // The group the user picks first
  const [selectedGroupCode, setSelectedGroupCode] = useState<number | "">(
    groups[0]?.code ?? ""
  );
  // Only the 3 digits the user types (e.g. "001" → combined with prefix "1" = "1001")
  const [suffix, setSuffix] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const mutation = useCreateAccountSubGroup();

  const selectedGroup = groups.find((g) => g.code === selectedGroupCode);

  // The locked prefix is the first digit of the group code (e.g. "1" for group 1000)
  const prefix = selectedGroup ? String(selectedGroup.code)[0] : "";

  // Assembled 4-digit sub-group code
  const fullCode =
    prefix && suffix.length === 3
      ? parseInt(`${prefix}${suffix}`, 10)
      : null;

  // All codes already in use
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
    // Allow only digits, max 3 chars
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
          New Account Sub-Group
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Select a group, then enter the last 3 digits of the sub-group code.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1 — Pick group */}
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
                  setSuffix(""); // reset suffix when group changes
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

          {/* Step 2 — Sub-group code with locked prefix */}
          {selectedGroup && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                2. Sub-Group Code
              </label>
              <div className="flex items-center gap-0 overflow-hidden rounded-lg border border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                {/* Locked prefix */}
                <div className="flex items-center gap-1.5 border-r border-gray-300 bg-gray-100 px-3 py-2">
                  <span className="font-mono text-sm font-bold text-gray-700">
                    {prefix}
                  </span>
                  <span className="text-xs text-gray-400">fixed</span>
                </div>
                {/* User-typed suffix */}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="___"
                  value={suffix}
                  onChange={(e) => handleSuffixChange(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                />
                {/* Live preview */}
                {suffix.length > 0 && (
                  <div className="border-l border-gray-200 bg-gray-50 px-3 py-2">
                    <span className="font-mono text-sm text-gray-500">
                      = {prefix}
                      {suffix.padEnd(3, "_")}
                    </span>
                  </div>
                )}
              </div>

              {/* Feedback */}
              {suffix.length === 3 && fullCode !== null ? (
                suffixError ? (
                  <p className="mt-1 text-xs text-red-600">{suffixError}</p>
                ) : (
                  <p className="mt-1 text-xs text-green-600">
                    ✓ Code{" "}
                    <span className="font-mono font-semibold">{fullCode}</span>{" "}
                    — will be added under{" "}
                    <strong>
                      {selectedGroup.code} – {selectedGroup.name}
                    </strong>
                  </p>
                )
              ) : suffix.length > 0 ? (
                <p className="mt-1 text-xs text-gray-400">
                  Enter {3 - suffix.length} more digit
                  {3 - suffix.length !== 1 ? "s" : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-gray-400">
                  Type 3 digits — e.g. "001" to create code{" "}
                  <span className="font-mono">{prefix}001</span>
                </p>
              )}
            </div>
          )}

          {/* Step 3 — Name */}
          {selectedGroup && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                3. Name
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChartOfAccountsPage() {
  const permissions = useAuthStore((s) => s.permissions);
  const canManage = permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSubGroupModal, setShowSubGroupModal] = useState(false);

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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 font-mono text-sm font-bold text-gray-700 shadow-sm">
                    {group.code}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{group.name}</p>
                    <p className="text-xs text-gray-500">
                      Range: {group.rangeLabel}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${ACCOUNT_TYPE_COLORS[group.accountType]}`}
                >
                  {ACCOUNT_TYPE_LABELS[group.accountType]}
                </span>
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
                      <span className="text-sm text-gray-600">{sub.name}</span>
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
