"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import {
  useFunds,
  useCreateFund,
  useUpdateFund,
  useFundAccess,
  useAddFundAccess,
  useRemoveFundAccess,
} from "@/services/finance";
import { useAllStaff } from "@/services/staff";
import { useBranches } from "@/services/branches";
import { useAuthStore } from "@/stores/authStore";
import { ADMIN_ROLE } from "@/constants/roles";
import type { Fund, FundAccess } from "@/types";
import type { Staff } from "@/types/auth";

const CURRENCIES = ["NGN", "USD", "EUR", "GBP"];

// All assignable roles (excludes admin — admin always has access implicitly)
const ASSIGNABLE_ROLES = [
  { value: "fund_accountant", label: "Fund Accountant" },
  { value: "cfo", label: "CFO" },
  { value: "md", label: "Managing Director" },
  { value: "overseer", label: "Overseer" },
  { value: "board_member", label: "Board Member" },
  { value: "portfolio_manager", label: "Portfolio Manager" },
  { value: "compliance_officer", label: "Compliance Officer" },
  { value: "customer_service", label: "Customer Service" },
];

interface FundFormState {
  name: string;
  code: string;
  description: string;
  currency: string;
}

const emptyForm = (): FundFormState => ({
  name: "",
  code: "",
  description: "",
  currency: "NGN",
});

// ─── Staff search autocomplete ────────────────────────────────────────────────

function StaffSearchAutocomplete({
  onSelect,
  onClear,
  selected,
}: {
  onSelect: (staff: Staff) => void;
  onClear: () => void;
  selected: Staff | null;
}) {
  const { data: allStaff } = useAllStaff();
  const { data: branches } = useBranches();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = query.trim().length >= 1 && allStaff
    ? allStaff.filter((s) => {
        const q = query.toLowerCase();
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const staffId = (s.staffId ?? "").toLowerCase();
        return fullName.includes(q) || staffId.includes(q);
      }).slice(0, 8)
    : [];

  const branchName = (branchId: string | null) =>
    branches?.find((b) => b.id === branchId)?.name ?? "—";

  const roleLabel = (role: string) =>
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (selected) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-gray-900">
              {selected.firstName} {selected.lastName}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
              {selected.staffId && (
                <span className="font-mono font-medium text-gray-700">{selected.staffId}</span>
              )}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 capitalize">
                {roleLabel(selected.role)}
              </span>
              <span>{branchName(selected.branchId)}</span>
              <span className="text-gray-400">{selected.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onClear(); setQuery(""); }}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            title="Clear selection"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name or staff ID…"
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s);
                setQuery("");
                setOpen(false);
              }}
              className="flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-primary/5"
            >
              <span className="text-sm font-medium text-gray-900">
                {s.firstName} {s.lastName}
                {s.staffId && (
                  <span className="ml-2 font-mono text-xs text-gray-400">{s.staffId}</span>
                )}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {roleLabel(s.role)} · {branchName(s.branchId)}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length >= 1 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-lg">
          No staff found
        </div>
      )}
    </div>
  );
}

// ─── Access Panel (per-fund) ───────────────────────────────────────────────────

function FundAccessPanel({ fund }: { fund: Fund }) {
  const { data: branches } = useBranches();
  const [open, setOpen] = useState(false);
  const [accessType, setAccessType] = useState<"role" | "staff">("role");
  const [roleValue, setRoleValue] = useState(ASSIGNABLE_ROLES[0].value);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const { data: grants, isLoading } = useFundAccess(open ? fund.id : "");
  const addAccess = useAddFundAccess();
  const removeAccess = useRemoveFundAccess();

  const branchName = (branchId: string | null) =>
    branches?.find((b) => b.id === branchId)?.name ?? "—";

  const roleLabel = (role: string) =>
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const handleAdd = () => {
    if (accessType === "role") {
      addAccess.mutate(
        { fundId: fund.id, payload: { type: "role", role: roleValue } },
        {
          onSuccess: () => toast.success("Access granted"),
          onError: (err) => {
            const msg =
              axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : "Failed to grant access";
            toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
          },
        }
      );
    } else {
      if (!selectedStaff) {
        toast.error("Please select a staff member");
        return;
      }
      addAccess.mutate(
        { fundId: fund.id, payload: { type: "staff", staffId: selectedStaff.id } },
        {
          onSuccess: () => {
            toast.success(`Access granted to ${selectedStaff.firstName} ${selectedStaff.lastName}`);
            setSelectedStaff(null);
          },
          onError: (err) => {
            const msg =
              axios.isAxiosError(err) && err.response?.data?.message
                ? err.response.data.message
                : "Failed to grant access";
            toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
          },
        }
      );
    }
  };

  const handleRemove = (grant: FundAccess) => {
    removeAccess.mutate(
      { fundId: fund.id, accessId: grant.id },
      {
        onSuccess: () => toast.success("Access revoked"),
        onError: () => toast.error("Failed to revoke access"),
      }
    );
  };

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Manage Access
      </button>

      {open && (
        <div className="mt-3 space-y-4">
          {/* Current grants */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Current Access Grants
            </p>
            {isLoading ? (
              <p className="text-xs text-gray-400">Loading…</p>
            ) : !grants || grants.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No access grants yet. Only admin can use this fund.
              </p>
            ) : (
              <div className="space-y-1">
                {grants.map((grant) => (
                  <GrantRow
                    key={grant.id}
                    grant={grant}
                    branchName={branchName}
                    roleLabel={roleLabel}
                    onRevoke={() => handleRemove(grant)}
                    isRevoking={removeAccess.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add grant form */}
          <div className="rounded-lg border border-dashed border-gray-200 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Grant Access
            </p>

            {/* Type selector */}
            <div className="mb-3 flex gap-4">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="radio"
                  name={`access-type-${fund.id}`}
                  value="role"
                  checked={accessType === "role"}
                  onChange={() => { setAccessType("role"); setSelectedStaff(null); }}
                  className="accent-primary"
                />
                By Role
              </label>
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700">
                <input
                  type="radio"
                  name={`access-type-${fund.id}`}
                  value="staff"
                  checked={accessType === "staff"}
                  onChange={() => { setAccessType("staff"); }}
                  className="accent-primary"
                />
                By Staff Member
              </label>
            </div>

            {/* Value input */}
            <div className="flex flex-wrap items-end gap-3">
              {accessType === "role" ? (
                <select
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full">
                  <StaffSearchAutocomplete
                    selected={selectedStaff}
                    onSelect={setSelectedStaff}
                    onClear={() => setSelectedStaff(null)}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleAdd}
                disabled={addAccess.isPending || (accessType === "staff" && !selectedStaff)}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {addAccess.isPending ? "Granting…" : "Grant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Renders a single grant row — resolves staff details from the staff list for per-staff grants
function GrantRow({
  grant,
  branchName,
  roleLabel,
  onRevoke,
  isRevoking,
}: {
  grant: FundAccess;
  branchName: (id: string | null) => string;
  roleLabel: (role: string) => string;
  onRevoke: () => void;
  isRevoking: boolean;
}) {
  const { data: allStaff } = useAllStaff();
  const staffMember = grant.type === "staff" && grant.staffId
    ? allStaff?.find((s) => s.id === grant.staffId) ?? null
    : null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            grant.type === "role"
              ? "bg-blue-100 text-blue-700"
              : "bg-purple-100 text-purple-700"
          }`}
        >
          {grant.type === "role" ? "Role" : "Staff"}
        </span>
        {grant.type === "role" ? (
          <span className="text-sm text-gray-700">
            {ASSIGNABLE_ROLES.find((r) => r.value === grant.role)?.label ?? grant.role}
          </span>
        ) : staffMember ? (
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-900">
              {staffMember.firstName} {staffMember.lastName}
            </span>
            <span className="ml-2 font-mono text-xs text-gray-400">{staffMember.staffId}</span>
            <div className="text-xs text-gray-500 capitalize">
              {roleLabel(staffMember.role)} · {branchName(staffMember.branchId)}
            </div>
          </div>
        ) : (
          <span className="font-mono text-xs text-gray-500">{grant.staffId}</span>
        )}
      </div>
      <button
        type="button"
        onClick={onRevoke}
        disabled={isRevoking}
        className="ml-3 shrink-0 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
      >
        Revoke
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function FundsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Redirect non-admin users away from this page
  useEffect(() => {
    if (user && user.role !== ADMIN_ROLE) {
      router.replace("/u/dashboard");
    }
  }, [user, router]);

  const { data: funds, isLoading } = useFunds();
  const createFund = useCreateFund();
  const updateFund = useUpdateFund();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Fund | null>(null);
  const [form, setForm] = useState<FundFormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<FundFormState>>({});

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setShowCreateModal(true);
  };

  const openEdit = (fund: Fund) => {
    setEditTarget(fund);
    setForm({
      name: fund.name,
      code: fund.code,
      description: fund.description ?? "",
      currency: fund.currency,
    });
    setErrors({});
  };

  const closeAll = () => {
    setShowCreateModal(false);
    setEditTarget(null);
    setForm(emptyForm());
    setErrors({});
  };

  const validate = (isCreate: boolean): boolean => {
    const next: Partial<FundFormState> = {};
    if (!form.name.trim()) next.name = "Fund name is required";
    if (isCreate && !form.code.trim()) next.code = "Fund code is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(true)) return;
    createFund.mutate(
      {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        currency: form.currency,
      },
      {
        onSuccess: () => {
          toast.success("Fund created successfully");
          closeAll();
        },
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Failed to create fund";
          toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
        },
      }
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !validate(false)) return;
    updateFund.mutate(
      {
        id: editTarget.id,
        payload: {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Fund updated successfully");
          closeAll();
        },
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Failed to update fund";
          toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
        },
      }
    );
  };

  const handleToggleActive = (fund: Fund) => {
    updateFund.mutate(
      { id: fund.id, payload: { isActive: !fund.isActive } },
      {
        onSuccess: () =>
          toast.success(fund.isActive ? "Fund deactivated" : "Fund activated"),
        onError: () => toast.error("Failed to update fund status"),
      }
    );
  };

  // Render nothing while redirecting non-admin
  if (!user || user.role !== ADMIN_ROLE) return null;

  const isModalOpen = showCreateModal || !!editTarget;
  const isSubmitting = createFund.isPending || updateFund.isPending;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funds</h1>
          <p className="mt-1 text-gray-500">
            Create investment funds and control which roles or staff members can
            post journal entries against each fund.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Fund
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-16 rounded bg-gray-200" />
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="h-4 w-24 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : !funds || funds.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-6 w-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No funds yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first fund to start tagging journal entries.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {funds.map((fund) => (
              <div key={fund.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-medium text-blue-700">
                      {fund.code}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{fund.name}</p>
                      {fund.description && (
                        <p className="text-xs text-gray-500 mt-0.5 max-w-sm truncate">
                          {fund.description}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-xs text-gray-400">{fund.currency}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fund.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {fund.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(fund)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(fund)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                        fund.isActive
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {fund.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                {/* Access management panel — expandable per fund */}
                <FundAccessPanel fund={fund} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editTarget ? "Edit Fund" : "New Fund"}
              </h2>
              <button
                type="button"
                onClick={closeAll}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={editTarget ? handleUpdate : handleCreate}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Fund Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ethica Income Fund"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Code — only on create */}
              {!editTarget ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fund Code{" "}
                    <span className="font-normal text-gray-400">(short unique identifier)</span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g. EIF-01"
                    maxLength={20}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fund Code
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                    <span className="font-mono text-sm text-gray-500">{editTarget.code}</span>
                    <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
                  </div>
                </div>
              )}

              {/* Currency — only on create */}
              {!editTarget && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Base Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this fund"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {isSubmitting
                    ? editTarget
                      ? "Saving…"
                      : "Creating…"
                    : editTarget
                    ? "Save Changes"
                    : "Create Fund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
