"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import axios from "axios";
import { useBranches, useCreateBranch, useUpdateBranch } from "@/services/branches";
import type { Branch } from "@/types";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

interface BranchFormState {
  name: string;
  code: string;
  address: string;
  state: string;
  isHeadOffice: boolean;
}

const emptyForm = (): BranchFormState => ({
  name: "",
  code: "",
  address: "",
  state: "",
  isHeadOffice: false,
});

export default function BranchesPage() {
  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchFormState>(emptyForm());
  const [errors, setErrors] = useState<Partial<BranchFormState>>({});

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setShowCreateModal(true);
  };

  const openEdit = (branch: Branch) => {
    setEditTarget(branch);
    setForm({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      state: branch.state,
      isHeadOffice: branch.isHeadOffice,
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
    const next: Partial<BranchFormState> = {};
    if (!form.name.trim()) next.name = "Branch name is required";
    if (isCreate && !form.code.trim()) next.code = "Branch code is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.state) next.state = "State is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(true)) return;
    createBranch.mutate(
      {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim(),
        state: form.state,
        country: "Nigeria",
        isHeadOffice: form.isHeadOffice,
      },
      {
        onSuccess: () => {
          toast.success("Branch created successfully");
          closeAll();
        },
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Failed to create branch";
          toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
        },
      }
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !validate(false)) return;
    updateBranch.mutate(
      {
        id: editTarget.id,
        payload: {
          name: form.name.trim(),
          address: form.address.trim(),
          state: form.state,
          isHeadOffice: form.isHeadOffice,
        },
      },
      {
        onSuccess: () => {
          toast.success("Branch updated successfully");
          closeAll();
        },
        onError: (err) => {
          const msg =
            axios.isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Failed to update branch";
          toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
        },
      }
    );
  };

  const handleToggleActive = (branch: Branch) => {
    updateBranch.mutate(
      { id: branch.id, payload: { isActive: !branch.isActive } },
      {
        onSuccess: () =>
          toast.success(
            branch.isActive ? "Branch deactivated" : "Branch activated"
          ),
        onError: () => toast.error("Failed to update branch status"),
      }
    );
  };

  const isModalOpen = showCreateModal || !!editTarget;
  const isSubmitting = createBranch.isPending || updateBranch.isPending;

  const existingHeadOffice = (branches ?? []).find(
    (b) => b.isHeadOffice && b.id !== editTarget?.id
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company Branches</h1>
          <p className="mt-1 text-gray-500">
            Manage company branches. Staff are assigned to a branch, which is
            recorded automatically on journal entries.
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
          New Branch
        </button>
      </div>

      {/* Branch list */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-0 divide-y divide-gray-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 rounded bg-gray-200" />
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="h-4 w-32 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : !branches || branches.length === 0 ? (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">No branches yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first branch to start assigning staff.
            </p>
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {branches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-medium text-gray-700">
                      {branch.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {branch.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {branch.isHeadOffice ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                        Head Office
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Branch</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {branch.address}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {branch.state}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        branch.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {branch.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(branch)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(branch)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          branch.isActive
                            ? "text-amber-600 hover:bg-amber-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                      >
                        {branch.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {editTarget ? "Edit Branch" : "New Branch"}
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
                  Branch Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Victoria Island Branch"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Code — only editable on create */}
              {!editTarget && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Branch Code{" "}
                    <span className="font-normal text-gray-400">
                      (short unique identifier, e.g. VI-001)
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
                    placeholder="e.g. VI-001"
                    maxLength={20}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.code && (
                    <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                  )}
                </div>
              )}

              {editTarget && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Branch Code
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                    <span className="font-mono text-sm text-gray-500">
                      {editTarget.code}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="e.g. 4 Akin Adesola Street, Victoria Island"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  State
                </label>
                <select
                  value={form.state}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, state: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                )}
              </div>

              {/* Head Office toggle */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    <input
                      type="checkbox"
                      checked={form.isHeadOffice}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, isHeadOffice: e.target.checked }))
                      }
                      disabled={!!existingHeadOffice && !form.isHeadOffice}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      This is the Head Office
                    </span>
                    {existingHeadOffice && !form.isHeadOffice ? (
                      <p className="mt-0.5 text-xs text-amber-600">
                        Cannot select — <strong>{existingHeadOffice.name}</strong> is already the head office. Edit that branch first to remove the designation.
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-gray-500">
                        Only one branch can be designated as the head office.
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Country (read-only) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Country
                </label>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <span className="text-sm text-gray-600">Nigeria</span>
                </div>
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
                    : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
