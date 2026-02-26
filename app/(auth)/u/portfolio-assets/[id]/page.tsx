"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { usePortfolioAsset } from "@/services/portfolio-assets";
import { fmtCurrency } from "@/utils/formatters";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

export default function PortfolioAssetDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: asset, isLoading, error } = usePortfolioAsset(id);

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

  if (error || !asset) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load portfolio asset. It may not exist or you may not have
          access.
        </div>
        <Link
          href="/u/portfolio-assets"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          ← Back to Portfolio Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/u/portfolio-assets"
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
          Back to Portfolio Assets
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Portfolio Asset {asset.portfolioAssetId}
          </h1>
          <p className="mt-1 text-gray-500">Portfolio asset details</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Overview */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Overview</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Asset reference and counter party
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-0 divide-y divide-gray-100">
              <DetailRow
                label="Portfolio Asset ID"
                value={
                  <span className="font-mono font-semibold text-primary">
                    {asset.portfolioAssetId}
                  </span>
                }
              />
              <DetailRow label="Counter Party" value={asset.counterParty} />
              <DetailRow
                label="Created"
                value={formatDate(asset.createdAt)}
              />
            </div>
          </div>
        </div>

        {/* Investment Terms */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Investment Terms</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Amount, tenor, dates, and rates
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-0 divide-y divide-gray-100">
              <DetailRow
                label="Investment Amount"
                value={fmtCurrency(asset.investmentAmount)}
              />
              <DetailRow label="Profit Rate" value={`${Number(asset.profitRate).toFixed(2)}%`} />
              <DetailRow
                label="Investment Tenor"
                value={`${asset.investmentTenorDays} days`}
              />
              <DetailRow
                label="Start Date"
                value={formatDate(asset.investmentStartDate)}
              />
              <DetailRow
                label="End Date"
                value={formatDate(asset.investmentEndDate)}
              />
            </div>
          </div>
        </div>

        {/* Accrued & Maturity */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-semibold text-gray-900">Accrued & Maturity</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Accrued days and profit calculations
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-0 divide-y divide-gray-100">
              <DetailRow
                label="Accrued Days (Cut-off)"
                value={asset.accruedDaysCutoff}
              />
              <DetailRow
                label="Days to Maturity"
                value={`${asset.daysToMaturity} days`}
              />
              <DetailRow
                label="Accrued Profit (Cut-off)"
                value={fmtCurrency(asset.accruedProfitCutoff)}
              />
              <DetailRow
                label="Accrued Profit (End Date)"
                value={fmtCurrency(asset.accruedProfitEndDate)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
