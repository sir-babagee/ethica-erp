"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  useInvestment,
  useApproveInvestment,
  useRejectInvestment,
} from "@/services/investments";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import { fmtCurrency } from "@/utils/formatters";
import { ApproveConfirmModal } from "./_components/ApproveConfirmModal";
import { RejectConfirmModal } from "./_components/RejectConfirmModal";
import { useState } from "react";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatStaffName(staff: { firstName?: string; lastName?: string } | null): string {
  if (!staff) return "—";
  return [staff.firstName, staff.lastName].filter(Boolean).join(" ") || "—";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const permissions = useAuthStore((s) => s.permissions);
  const canApprove = permissions.includes(PERMISSIONS.INVESTMENTS_APPROVE);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: investment, isLoading, error } = useInvestment(id);
  const approveMutation = useApproveInvestment();
  const rejectMutation = useRejectInvestment();

  async function handleApprove() {
    if (!investment) return;
    try {
      await approveMutation.mutateAsync(investment.id);
      toast.success(`Investment ${investment.investmentRef} approved.`);
      setShowApproveModal(false);
    } catch {
      toast.error("Failed to approve investment.");
    }
  }

  async function handleReject(reason: string) {
    if (!investment) return;
    try {
      await rejectMutation.mutateAsync({ id: investment.id, reason });
      toast.success(`Investment ${investment.investmentRef} rejected.`);
      setShowRejectModal(false);
    } catch {
      toast.error("Failed to reject investment.");
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-64 rounded-xl border border-gray-200 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !investment) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load transaction. It may not exist or you may not have
          access.
        </div>
        <Link
          href="/u/transactions"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          ← Back to Transactions
        </Link>
      </div>
    );
  }

  return (
    <>
      {showApproveModal && (
        <ApproveConfirmModal
          investmentRef={investment.investmentRef}
          customerName={investment.customerName}
          investmentAmount={fmtCurrency(investment.investmentAmount)}
          onConfirm={handleApprove}
          onCancel={() => setShowApproveModal(false)}
          loading={approveMutation.isPending}
        />
      )}

      {showRejectModal && (
        <RejectConfirmModal
          investmentRef={investment.investmentRef}
          customerName={investment.customerName}
          investmentAmount={fmtCurrency(investment.investmentAmount)}
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          loading={rejectMutation.isPending}
        />
      )}

      <div className="p-8">
        <div className="mb-8">
          <Link
            href="/u/transactions"
            className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Transactions
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Investment {investment.investmentRef}
              </h1>
              <p className="mt-1 text-gray-500">
                Mudarabah Fund investment details
              </p>
            </div>
            {canApprove && investment.status === "pending" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApproveModal(true)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Overview</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Investment reference and status
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-0 divide-y divide-gray-100">
                <DetailRow
                  label="Investment Reference"
                  value={
                    <span className="font-mono font-semibold text-primary">
                      {investment.investmentRef}
                    </span>
                  }
                />
                <DetailRow label="Status" value={<StatusBadge status={investment.status} />} />
                <DetailRow label="Product" value={investment.product} />
                <DetailRow label="Created" value={formatDate(investment.createdAt)} />
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Customer</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Customer details at time of entry
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-0 divide-y divide-gray-100">
                <DetailRow label="Customer Name" value={investment.customerName} />
                <DetailRow label="Customer ID" value={<span className="font-mono">{investment.customerCode}</span>} />
                <DetailRow label="Customer Type" value={<span className="capitalize">{investment.customerType}</span>} />
              </div>
            </div>
          </div>

          {/* Investment Terms */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Investment Terms</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Amount, tenor, and dates
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-0 divide-y divide-gray-100">
                <DetailRow label="Investment Amount" value={fmtCurrency(investment.investmentAmount)} />
                <DetailRow label="Tenor" value={`${investment.tenorDays} days`} />
                <DetailRow label="Start Date" value={formatDate(investment.startDate)} />
                <DetailRow label="End Date" value={formatDate(investment.endDate)} />
                <DetailRow label="Profit Remittance" value={investment.profitRemittance} />
                <DetailRow label="Rollover" value={investment.rollover} />
              </div>
            </div>
          </div>

          {/* Rates & Profit */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Rates & Profit</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Indicative rate and sharing ratios
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-0 divide-y divide-gray-100">
                <DetailRow label="Indicative Rate" value={`${Number(investment.indicativeRate).toFixed(2)}%`} />
                <DetailRow label="Customer Sharing Ratio" value={`${Number(investment.customerSharingRatio).toFixed(2)}%`} />
                <DetailRow label="Above Target Customer Sharing Ratio" value={`${Number(investment.aboveTargetCustomerSharingRatio).toFixed(2)}%`} />
                <DetailRow label="Accrued Profit (Cut-off)" value={fmtCurrency(investment.accruedProfitCutoff)} />
                <DetailRow label="Accrued Profit (End Date)" value={fmtCurrency(investment.accruedProfitEndDate)} />
              </div>
            </div>
          </div>

          {/* Workflow */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Workflow</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Created by, approved by, or rejected by
              </p>
            </div>
            <div className="px-6 py-5">
              <div className="space-y-0 divide-y divide-gray-100">
                <DetailRow label="Created By" value={formatStaffName(investment.createdBy)} />
                {investment.approvedBy && (
                  <DetailRow label="Approved By" value={formatStaffName(investment.approvedBy)} />
                )}
                {investment.rejectedBy && (
                  <DetailRow label="Rejected By" value={formatStaffName(investment.rejectedBy)} />
                )}
                {investment.rejectionReason && (
                  <DetailRow label="Rejection Reason" value={investment.rejectionReason} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
