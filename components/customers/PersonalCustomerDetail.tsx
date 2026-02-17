"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  useCustomer,
  useApproveCustomer,
  useEscalateCustomer,
} from "@/services/customers";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import ApproveCustomerModal from "@/components/Modals/ApproveCustomerModal";
import EscalateCustomerModal from "@/components/Modals/EscalateCustomerModal";
import ImageViewer from "@/components/ImageViewer";
import type { CustomerDetail, PEPData } from "@/types";

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
      <dt className="min-w-[140px] text-sm font-medium text-gray-500">
        {label}
      </dt>
      <dd className="text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

interface PersonalCustomerDetailProps {
  id: string;
}

export default function PersonalCustomerDetail({ id }: PersonalCustomerDetailProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const { data: customer, isLoading, error } = useCustomer(id);
  const approveMutation = useApproveCustomer(id);
  const escalateMutation = useEscalateCustomer(id);

  const canApprove =
    permissions.includes(PERMISSIONS.ONBOARDING_APPROVE) &&
    customer?.status === "unverified";

  const canEscalate =
    permissions.includes(PERMISSIONS.ONBOARDING_VIEW) &&
    customer?.status === "unverified";

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !customer) {
    const isBackendDown =
      (error as { response?: { status?: number } })?.response?.status === 503;
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {isBackendDown
            ? "Unable to connect to the API server. Please ensure the backend is running."
            : "Failed to load customer. Please try again later."}
        </div>
        <Link
          href="/u/customers?tab=personal"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to customers
        </Link>
      </div>
    );
  }

  const c = customer as CustomerDetail;
  const fullName = [c.title, c.firstName, c.lastName, c.otherName]
    .filter(Boolean)
    .join(" ");
  const nokPhone =
    c.nokCountryCode && c.nokPhoneNumber
      ? `${c.nokCountryCode} ${c.nokPhoneNumber}`
      : c.nokPhoneNumber;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/u/customers?tab=personal"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <StatusBadge status={c.status} />
              {c.customerId && (
                <span className="text-gray-400">• {c.customerId}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <DetailSection title="Application Status">
          <DetailRow label="Status" value={<StatusBadge status={c.status} />} />
          <DetailRow label="Customer ID" value={c.customerId} />
          <DetailRow label="Submitted" value={formatDate(c.createdAt)} />
          <DetailRow label="Last updated" value={formatDate(c.updatedAt)} />
          {c.rejectionReason && (
            <DetailRow
              label="Rejection reason"
              value={
                <span className="text-red-600">{c.rejectionReason}</span>
              }
            />
          )}
          {c.activity && c.activity.length > 0 && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
              <dt className="min-w-[140px] text-sm font-medium text-gray-500">
                Activity
              </dt>
              <dd className="space-y-2">
                {c.activity.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span
                      className={
                        item.action === "approved"
                          ? "font-medium text-emerald-700"
                          : item.action === "escalated"
                            ? "font-medium text-amber-700"
                            : "font-medium text-slate-700"
                      }
                    >
                      {item.action}
                    </span>
                    {item.reason && (
                      <span className="text-gray-600"> — {item.reason}</span>
                    )}
                    <span className="block text-xs text-gray-500">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                ))}
              </dd>
            </div>
          )}
        </DetailSection>

        {(c.passportPhoto || c.idUpload || c.signature || c.idType) && (
          <DetailSection title="Documents & Identity">
            {c.passportPhoto && (
              <ImageViewer
                src={c.passportPhoto}
                alt="Passport"
                label="Passport photo"
                thumbnailClassName="h-24 w-24 rounded-lg border border-gray-200 object-cover cursor-pointer transition-opacity hover:opacity-90"
              />
            )}
            <DetailRow label="ID type" value={c.idType} />
            {c.idUpload && (
              <ImageViewer
                src={c.idUpload}
                alt="ID"
                label="ID document"
                thumbnailClassName="max-h-48 max-w-48 rounded-lg border border-gray-200 object-contain cursor-pointer transition-opacity hover:opacity-90"
              />
            )}
            {c.signature && (
              <ImageViewer
                src={c.signature}
                alt="Signature"
                label="Signature"
                thumbnailClassName="h-16 w-32 rounded border border-gray-200 bg-white object-contain cursor-pointer transition-opacity hover:opacity-90"
              />
            )}
          </DetailSection>
        )}

        <DetailSection title="Personal Information">
          <DetailRow label="Title" value={c.title} />
          <DetailRow label="First name" value={c.firstName} />
          <DetailRow label="Last name" value={c.lastName} />
          <DetailRow label="Other name" value={c.otherName} />
          <DetailRow label="Date of birth" value={formatDate(c.dateOfBirth)} />
          <DetailRow label="Gender" value={c.gender} />
          <DetailRow label="Marital status" value={c.maritalStatus} />
          <DetailRow label="Nationality" value={c.nationality} />
          <DetailRow label="State" value={c.state} />
          <DetailRow label="LGA" value={c.lga} />
          <DetailRow label="Email" value={c.email} />
          <DetailRow label="Phone" value={c.phone} />
          <DetailRow
            label="Contact address"
            value={
              <span className="whitespace-pre-wrap">{c.contactAddress}</span>
            }
          />
        </DetailSection>

        <DetailSection title="Employment">
          <DetailRow label="Employment status" value={c.employmentStatus} />
          {c.employmentStatus === "Employed" && (
            <>
              <DetailRow label="Employer name" value={c.employerName} />
              <DetailRow
                label="Employer address"
                value={
                  <span className="whitespace-pre-wrap">
                    {c.employerAddress}
                  </span>
                }
              />
            </>
          )}
        </DetailSection>

        <DetailSection title="Next of Kin">
          <DetailRow
            label="Full name"
            value={
              [c.nokFirstName, c.nokSurname, c.nokOtherName]
                .filter(Boolean)
                .join(" ")
            }
          />
          <DetailRow label="Date of birth" value={formatDate(c.nokDateOfBirth)} />
          <DetailRow label="Relationship" value={c.nokRelationship} />
          <DetailRow label="Phone" value={nokPhone} />
          <DetailRow label="Email" value={c.nokEmail} />
          <DetailRow
            label="Contact address"
            value={
              <span className="whitespace-pre-wrap">{c.nokContactAddress}</span>
            }
          />
        </DetailSection>

        <DetailSection title="Investment Details">
          <DetailRow
            label="Investment amount"
            value={
              <span className="font-semibold text-gray-900">
                {formatCurrency(c.investmentAmount)}
              </span>
            }
          />
          <DetailRow label="Tenor" value={c.tenor} />
          <DetailRow label="Rollover" value={c.rollover} />
        </DetailSection>

        <DetailSection title="Bank Details">
          <DetailRow label="BVN" value={c.bvn} />
          <DetailRow label="Bank name" value={c.bankName} />
          <DetailRow label="Account number" value={c.accountNumber} />
          <DetailRow label="Account name" value={c.accountName} />
          <DetailRow label="TIN" value={c.tin} />
        </DetailSection>

        {c.contactPersons && c.contactPersons.length > 0 && (
          <DetailSection title="Contact Persons">
            <ul className="space-y-2">
              {c.contactPersons.map((name, i) => (
                <li key={i} className="text-sm text-gray-900">
                  {name}
                </li>
              ))}
            </ul>
          </DetailSection>
        )}

        {(c.sourceOfWealth?.length || c.sourceOfWealthDetails) && (
          <DetailSection title="Source of Wealth">
            {c.sourceOfWealth && c.sourceOfWealth.length > 0 && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
                <dt className="min-w-[140px] text-sm font-medium text-gray-500">
                  Sources
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-2">
                    {c.sourceOfWealth.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            {c.sourceOfWealthDetails &&
              Object.keys(c.sourceOfWealthDetails).length > 0 && (
                <div className="mt-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  {Object.entries(c.sourceOfWealthDetails).map(([key, val]) => {
                    const label = key
                      .replace(/([A-Z])/g, " $1")
                      .trim()
                      .replace(/^\w/, (s) => s.toUpperCase());
                    return <DetailRow key={key} label={label} value={val} />;
                  })}
                </div>
              )}
          </DetailSection>
        )}

        {c.pepData && (c.pepData as PEPData).isPEP && (
          <DetailSection title="Politically Exposed Person (PEP)">
            <PEPDetails pep={c.pepData as PEPData} />
          </DetailSection>
        )}

        <DetailSection title="Terms & Conditions">
          <DetailRow
            label="Terms accepted"
            value={
              c.termsAccepted ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Yes
                </span>
              ) : (
                "No"
              )
            }
          />
        </DetailSection>

        {(canApprove || canEscalate) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Application actions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review this application and approve, or escalate to the next
                  tier if you cannot handle this approval.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(true)}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Approve customer
                  </button>
                )}
                {canEscalate && (
                  <button
                    type="button"
                    onClick={() => setEscalateModalOpen(true)}
                    className="rounded-lg border border-amber-300 bg-white px-6 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
                  >
                    Escalate
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <ApproveCustomerModal
          open={approveModalOpen}
          handleClose={() => setApproveModalOpen(false)}
          onConfirm={() => {
            approveMutation.mutate(undefined, {
              onSuccess: () => {
                toast.success("Customer approved successfully");
                setApproveModalOpen(false);
              },
              onError: (err) => {
                const message =
                  axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Failed to approve customer";
                toast.error(message);
              },
            });
          }}
          isPending={approveMutation.isPending}
        />

        <EscalateCustomerModal
          open={escalateModalOpen}
          handleClose={() => setEscalateModalOpen(false)}
          currentRole={
            customer?.currentAssigneeRole ?? user?.role ?? "customer_service"
          }
          onConfirm={(toRole, reason) => {
            escalateMutation.mutate({ toRole, reason }, {
              onSuccess: () => {
                toast.success("Customer escalated successfully");
                setEscalateModalOpen(false);
                router.push("/u/customers?tab=personal");
              },
              onError: (err) => {
                const message =
                  axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Failed to escalate customer";
                toast.error(message);
              },
            });
          }}
          isPending={escalateMutation.isPending}
        />
      </div>
    </div>
  );
}

function PEPDetails({ pep }: { pep: PEPData }) {
  const rows: { label: string; key: keyof PEPData }[] = [
    { label: "Is self", key: "pepIsSelf" },
    { label: "Categories", key: "pepCategories" },
    { label: "Full name", key: "pepFullName" },
    { label: "Relationship", key: "pepRelationship" },
    { label: "Nationality", key: "pepNationality" },
    { label: "Country of exposure", key: "pepCountryOfExposure" },
    { label: "Public office", key: "pepPublicOffice" },
    { label: "Government body", key: "pepGovernmentBody" },
    { label: "Date commenced", key: "pepDateCommenced" },
    { label: "Date ended", key: "pepDateEnded" },
    { label: "Source of wealth", key: "pepSourceOfWealth" },
    { label: "Source of funds", key: "pepSourceOfFunds" },
    { label: "Net worth", key: "pepNetWorth" },
    { label: "Funding pattern", key: "pepFundingPattern" },
    { label: "Transaction frequency", key: "pepTransactionFrequency" },
    { label: "Avg transaction size", key: "pepAvgTransactionSize" },
    { label: "Subject to sanctions", key: "pepSubjectToSanctions" },
    { label: "Investigated", key: "pepInvestigated" },
    { label: "Sanctions details", key: "pepSanctionsDetails" },
  ];

  return (
    <div className="space-y-4">
      {rows.map(({ label, key }) => {
        const val = pep[key];
        if (val === undefined || val === null || val === "") return null;
        const display = Array.isArray(val) ? val.join(", ") : String(val);
        return <DetailRow key={key} label={label} value={display} />;
      })}
    </div>
  );
}
