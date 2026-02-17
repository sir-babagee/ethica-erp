"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { useCustomers } from "@/services/customers";
import { useCorporateCustomers } from "@/services/corporateCustomers";
import { api } from "@/lib/api";
import { customerToExcelRow } from "@/lib/customerExportColumns";
import { corporateToExcelRow } from "@/lib/corporateExportColumns";
import type { Customer, CustomersResponse } from "@/types";
import type { CorporateCustomer, CorporateCustomersResponse } from "@/types";

function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    unverified: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-slate-100 text-slate-700",
  };
  const style = styles[status as keyof typeof styles] ?? styles.unverified;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

async function fetchAllCustomers(): Promise<Customer[]> {
  const all: Customer[] = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;
  while (hasMore) {
    const res = await api.get<CustomersResponse>("/api/proxy/customers", {
      params: { page, limit },
    });
    const { data, pagination } = res.data;
    all.push(...data);
    hasMore = pagination.currentPage < pagination.totalPages;
    page++;
  }
  return all;
}

async function fetchAllCorporateCustomers(): Promise<CorporateCustomer[]> {
  const all: CorporateCustomer[] = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;
  while (hasMore) {
    const res = await api.get<CorporateCustomersResponse>(
      "/api/proxy/corporate-customers",
      { params: { page, limit } }
    );
    const { data, pagination } = res.data;
    all.push(...data);
    hasMore = pagination.currentPage < pagination.totalPages;
    page++;
  }
  return all;
}

type Tab = "personal" | "corporate";

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const activeTab: Tab =
    searchParams.get("tab") === "corporate" ? "corporate" : "personal";

  const [personalPage, setPersonalPage] = useState(1);
  const [corporatePage, setCorporatePage] = useState(1);
  const [limit] = useState(10);
  const [exporting, setExporting] = useState(false);

  const { data: personalData, isLoading: personalLoading, error: personalError } =
    useCustomers(personalPage, limit, activeTab === "personal");
  const { data: corporateData, isLoading: corporateLoading, error: corporateError } =
    useCorporateCustomers(corporatePage, limit, activeTab === "corporate");

  const isLoading = activeTab === "personal" ? personalLoading : corporateLoading;
  const error = activeTab === "personal" ? personalError : corporateError;

  const personalCustomers = personalData?.data ?? [];
  const corporateCustomers = corporateData?.data ?? [];
  const customers = activeTab === "personal" ? personalCustomers : corporateCustomers;
  const pagination =
    activeTab === "personal" ? personalData?.pagination : corporateData?.pagination;

  async function handleExportExcel() {
    setExporting(true);
    try {
      if (activeTab === "personal") {
        const customers = await fetchAllCustomers();
        const rows = customers.map((c) =>
          customerToExcelRow(c as Record<string, unknown>)
        );
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Personal Customers");
        XLSX.writeFile(
          wb,
          `personal-customers-export-${new Date().toISOString().slice(0, 10)}.xlsx`
        );
        toast.success(`Exported ${customers.length} personal customers to Excel`);
      } else {
        const customers = await fetchAllCorporateCustomers();
        const rows = customers.map((c) =>
          corporateToExcelRow(c as Record<string, unknown>)
        );
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Corporate Customers");
        XLSX.writeFile(
          wb,
          `corporate-customers-export-${new Date().toISOString().slice(0, 10)}.xlsx`
        );
        toast.success(`Exported ${customers.length} corporate customers to Excel`);
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export customers. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "personal", label: "Personal" },
    { id: "corporate", label: "Corporate" },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-gray-500">
            Manage customer applications and records
          </p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const isBackendDown =
      (error as { response?: { status?: number } })?.response?.status === 503;
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {isBackendDown
            ? "Unable to connect to the API server. Please ensure the backend is running."
            : "Failed to load customers. Please try again later."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="mt-1 text-gray-500">
            Manage customer applications and records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/u/customers?tab=${tab.id}`}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  Exporting…
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export as Excel
                </>
              )}
            </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          {activeTab === "personal" ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Investment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {personalCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No personal customer applications yet.
                    </td>
                  </tr>
                ) : (
                  personalCustomers.map((customer: Customer) => (
                    <tr
                      key={customer.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/u/customers/personal/${customer.id}`}
                          className="block font-medium text-primary hover:text-primary/90 hover:underline"
                        >
                          {[customer.title, customer.firstName, customer.lastName]
                            .filter(Boolean)
                            .join(" ")}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {customer.email ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {customer.phone ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge
                          status={String(customer.status ?? "unverified")}
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(customer.investmentAmount ?? 0)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {customer.createdAt
                          ? new Date(
                              String(customer.createdAt)
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Investment
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {corporateCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No corporate customer applications yet.
                    </td>
                  </tr>
                ) : (
                  corporateCustomers.map((customer: CorporateCustomer) => (
                    <tr
                      key={customer.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/u/customers/corporate/${customer.id}`}
                          className="block font-medium text-primary hover:text-primary/90 hover:underline"
                        >
                          {customer.companyName ?? "—"}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {customer.companyCategory ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {customer.email ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                        {customer.phone1 ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge
                          status={String(customer.status ?? "unverified")}
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(
                          customer.initialInvestmentAmount ?? 0
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {customer.createdAt
                          ? new Date(
                              String(customer.createdAt)
                            ).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4">
            <p className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">
                {(pagination.currentPage - 1) * pagination.perPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  pagination.currentPage * pagination.perPage,
                  pagination.total
                )}
              </span>{" "}
              of <span className="font-medium">{pagination.total}</span> results
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  activeTab === "personal"
                    ? setPersonalPage((p) => Math.max(1, p - 1))
                    : setCorporatePage((p) => Math.max(1, p - 1))
                }
                disabled={pagination.currentPage <= 1}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  activeTab === "personal"
                    ? setPersonalPage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                    : setCorporatePage((p) =>
                        Math.min(pagination.totalPages, p + 1)
                      )
                }
                disabled={pagination.currentPage >= pagination.totalPages}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
