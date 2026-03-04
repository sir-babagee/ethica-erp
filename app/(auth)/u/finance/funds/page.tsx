"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useFunds, useCreateFund, useUpdateFund } from "@/services/finance";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import type { Fund } from "@/types";

const CURRENCIES = ["NGN", "USD", "EUR", "GBP"];

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

export default function FundsPage() {
  const permissions = useAuthStore((s) => s.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.FINANCE_COA_MANAGE);

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

  const isModalOpen = showCreateModal || !!editTarget;
  const isSubmitting = createFund.isPending || updateFund.isPending;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funds</h1>
          <p className="mt-1 text-gray-500">
            Manage investment funds. When creating a journal entry, select a
            fund from this list to tag the entry against that fund.
          </p>
        </div>
        {canManage && (
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
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
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
            {canManage ? (
              <p className="mt-1 text-sm text-gray-500">
                Create your first fund to start tagging journal entries.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-500">
                No funds have been configured yet. Contact your fund accountant
                or COA manager.
              </p>
            )}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                {canManage && <th className="px-6 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {funds.map((fund) => (
                <tr key={fund.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-medium text-blue-700">
                      {fund.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {fund.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {fund.description ?? (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="font-mono text-xs text-gray-600">
                      {fund.currency}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        fund.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {fund.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {canManage && (
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Ethica Income Fund"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Code — only editable on create */}
              {!editTarget ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fund Code{" "}
                    <span className="font-normal text-gray-400">
                      (short unique identifier)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        code: e.target.value.toUpperCase(),
                      }))
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
                    <span className="font-mono text-sm text-gray-500">
                      {editTarget.code}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      (cannot be changed)
                    </span>
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currency: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
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
