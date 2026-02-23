"use client";

import { useState } from "react";
import Link from "next/link";
import { usePortfolioAssets } from "@/services/portfolio-assets";
import { fmtCurrency } from "@/utils/formatters";

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function PortfolioAssetsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePortfolioAssets(page, 20);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Assets</h1>
          <p className="mt-1 text-gray-500">All portfolio asset entries</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Failed to load portfolio assets. Please try again later.
        </div>
      </div>
    );
  }

  const assets = data?.data ?? [];
  const pagination = data;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Assets</h1>
          <p className="mt-1 text-gray-500">All portfolio asset entries</p>
        </div>
        <Link
          href="/u/portfolio-assets/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
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
          New Portfolio Asset
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Asset ID
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Counter Party
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Profit Rate
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Tenor
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Start
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  End
                </th>
                <th className="px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Days to Maturity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No portfolio assets found.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        href={`/u/portfolio-assets/${asset.id}`}
                        className="font-mono text-sm font-semibold text-primary hover:underline"
                      >
                        {asset.portfolioAssetId}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {asset.counterParty}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-900">
                      {fmtCurrency(asset.investmentAmount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {Number(asset.profitRate).toFixed(2)}%
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {asset.investmentTenorDays} days
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(asset.investmentStartDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {formatDate(asset.investmentEndDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {asset.daysToMaturity} days
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
