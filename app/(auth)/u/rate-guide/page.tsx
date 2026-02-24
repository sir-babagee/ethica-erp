"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  useRateGuides,
  useCreateRateGuide,
  useUpdateRateGuide,
  useDeleteRateGuide,
  useBulkReplaceRateGuides,
  type RateGuide,
} from "@/services/rate-guides";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import type { CreateRateGuidePayload } from "@/types";
import { EMPTY_FORM, type FormState } from "./_components/form-config";
import { RateGuideModal } from "./_components/RateGuideModal";
import { DeleteConfirm } from "./_components/DeleteConfirm";
import { RateGuideRow } from "./_components/RateGuideRow";
import { SkeletonRows } from "./_components/SkeletonRows";
import { ImportModal } from "./_components/ImportModal";
import { ActionsMenu } from "./_components/ActionsMenu";
import { exportRateGuidesToXlsx, exportRateGuidesToCsv } from "@/utils/exportRateGuide";

type ModalMode = { kind: "add" } | { kind: "edit"; guide: RateGuide };

export default function RateGuidePage() {
  const permissions = useAuthStore((s) => s.permissions);
  const canManage = permissions.includes(PERMISSIONS.RATE_GUIDE_MANAGE);

  const { data: guides = [], isLoading, isError } = useRateGuides();
  const createMutation = useCreateRateGuide();
  const updateMutation = useUpdateRateGuide();
  const deleteMutation = useDeleteRateGuide();
  const bulkReplaceMutation = useBulkReplaceRateGuides();

  const [modal, setModal] = useState<ModalMode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RateGuide | null>(null);
  const [showImport, setShowImport] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAdd(data: FormState) {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Rate guide entry added.");
      setModal(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to add entry."));
    }
  }

  async function handleEdit(data: FormState) {
    if (modal?.kind !== "edit") return;
    try {
      await updateMutation.mutateAsync({ id: modal.guide.id, payload: data });
      toast.success("Rate guide entry updated.");
      setModal(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to update entry."));
    }
  }

  async function handleBulkReplace(entries: CreateRateGuidePayload[]) {
    try {
      const result = await bulkReplaceMutation.mutateAsync({ entries });
      toast.success(`Imported ${result.inserted} rate guide ${result.inserted === 1 ? "entry" : "entries"} successfully.`);
      setShowImport(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Import failed. Please try again."));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Rate guide entry deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete entry.");
    }
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const modalInitial: FormState =
    modal?.kind === "edit"
      ? {
          tenor: Number(modal.guide.tenor),
          indicativeRate: Number(modal.guide.indicativeRate),
          minimumSpread: Number(modal.guide.minimumSpread),
          ethicaRatio: Number(modal.guide.ethicaRatio),
          customerRatio: Number(modal.guide.customerRatio),
          aboveTargetEthicaRatio: Number(modal.guide.aboveTargetEthicaRatio),
          aboveTargetCustomerRatio: Number(modal.guide.aboveTargetCustomerRatio),
          minimumAmount: Number(modal.guide.minimumAmount),
          maximumAmount: Number(modal.guide.maximumAmount),
        }
      : { ...EMPTY_FORM };

  const mutationLoading =
    modal?.kind === "add" ? createMutation.isPending : updateMutation.isPending;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Guide</h1>
          <p className="mt-1 text-sm text-gray-500 max-w-4xl">
            Indicative rate bands used as suggestive defaults when creating investment entries. Values
            here are reference only — fund accountants may adjust them per entry.
          </p>
        </div>
        <ActionsMenu
          actions={[
            ...(canManage
              ? [
                  {
                    label: "Add New Entry",
                    description: "Manually enter a single rate band",
                    icon: (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    ),
                    onClick: () => setModal({ kind: "add" }),
                  },
                  {
                    label: "Import CSV / XLSX",
                    description: "Bulk replace all entries from a file",
                    icon: (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    ),
                    onClick: () => setShowImport(true),
                  },
                ]
              : []),
            {
              label: "Export as XLSX",
              description: "Download current entries as Excel",
              icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4 4l4 4 4-4M12 3v13" />
                </svg>
              ),
              onClick: () => exportRateGuidesToXlsx(guides),
              disabled: guides.length === 0,
            },
            {
              label: "Export as CSV",
              description: "Download current entries as CSV",
              icon: (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              onClick: () => exportRateGuidesToCsv(guides),
              disabled: guides.length === 0,
            },
          ]}
        />
      </div>

      {/* Stats strip */}
      <div className="mb-6 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {guides.length} {guides.length === 1 ? "entry" : "entries"}
        </span>
        <span className="text-xs text-gray-400">Sorted by tenor (ascending)</span>
      </div>

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">Failed to load rate guide data. Please refresh the page.</p>
        </div>
      )}

      {/* Table */}
      {!isError && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {[
                    "Tenor",
                    "Indicative Rate",
                    "Min Spread",
                    "Ethica Ratio",
                    "Customer Ratio",
                    "AT Ethica Ratio",
                    "AT Customer Ratio",
                    "Min Amount",
                    "Max Amount",
                    ...(canManage ? [""] : []),
                  ].map((col, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : guides.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 10 : 9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-500">No rate guide entries yet</p>
                        <p className="text-xs text-gray-400">Click &quot;Add Entry&quot; to define your first rate band.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  guides.map((guide) => (
                    <RateGuideRow
                      key={guide.id}
                      guide={guide}
                      canManage={canManage}
                      onEdit={(g) => setModal({ kind: "edit", guide: g })}
                      onDelete={(g) => setDeleteTarget(g)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {guides.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-2.5">
              <p className="text-xs text-gray-400">
                All rates are indicative. Percentage values are shown to 2 decimal places.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit modal */}
      {modal && (
        <RateGuideModal
          mode={modal.kind}
          initial={modalInitial}
          onClose={() => setModal(null)}
          onSubmit={modal.kind === "add" ? handleAdd : handleEdit}
          loading={mutationLoading}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirm
          tenor={Number(deleteTarget.tenor)}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}

      {/* Bulk import */}
      {canManage && showImport && (
        <ImportModal
          existingCount={guides.length}
          onClose={() => setShowImport(false)}
          onConfirm={handleBulkReplace}
          loading={bulkReplaceMutation.isPending}
        />
      )}
    </div>
  );
}
