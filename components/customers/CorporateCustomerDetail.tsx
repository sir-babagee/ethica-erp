"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import {
  useCorporateCustomer,
  useApproveCorporateCustomer,
  useRejectCorporateCustomer,
  useEscalateCorporateCustomer,
} from "@/services/corporateCustomers";
import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";
import ApproveCustomerModal from "@/components/Modals/ApproveCustomerModal";
import RejectCustomerModal from "@/components/Modals/RejectCustomerModal";
import EscalateCustomerModal from "@/components/Modals/EscalateCustomerModal";
import ImageViewer from "@/components/ImageViewer";
import type {
  CorporateCustomerDetail as CorporateCustomerDetailType,
  UBOData,
  SignatoryData,
  AccountMandateData,
} from "@/types";

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

interface CorporateCustomerDetailProps {
  id: string;
}

export default function CorporateCustomerDetail({
  id,
}: CorporateCustomerDetailProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const { data: customer, isLoading, error } = useCorporateCustomer(id);
  const approveMutation = useApproveCorporateCustomer(id);
  const rejectMutation = useRejectCorporateCustomer(id);
  const escalateMutation = useEscalateCorporateCustomer(id);

  const canApprove =
    permissions.includes(PERMISSIONS.ONBOARDING_APPROVE) &&
    customer?.status === "unverified";

  const canReject =
    permissions.includes(PERMISSIONS.ONBOARDING_REJECT) &&
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
            : "Failed to load corporate customer. Please try again later."}
        </div>
        <Link
          href="/u/customers?tab=corporate"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back to customers
        </Link>
      </div>
    );
  }

  const c = customer as CorporateCustomerDetailType;

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/u/customers?tab=corporate"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {c.companyName}
            </h1>
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

        <DetailSection title="Company Details">
          <DetailRow label="Company name" value={c.companyName} />
          <DetailRow label="Category" value={c.companyCategory} />
          <DetailRow label="Registration number" value={c.registrationNumber} />
          <DetailRow
            label="Date of incorporation"
            value={formatDate(c.dateOfIncorporation)}
          />
          <DetailRow
            label="Country of incorporation"
            value={c.countryOfIncorporation}
          />
          <DetailRow label="Type of business" value={c.typeOfBusiness} />
          <DetailRow label="Sector/Industry" value={c.sectorIndustry} />
          <DetailRow
            label="Operating address"
            value={
              <span className="whitespace-pre-wrap">{c.operatingAddress}</span>
            }
          />
          <DetailRow label="Operating state" value={c.operatingState} />
          <DetailRow
            label="Registered address"
            value={
              <span className="whitespace-pre-wrap">{c.registeredAddress}</span>
            }
          />
          <DetailRow label="Registered state" value={c.registeredState} />
          <DetailRow label="TIN" value={c.tin} />
          {c.otherJurisdiction && (
            <DetailRow label="Other jurisdiction" value={c.otherJurisdiction} />
          )}
          {c.usTaxId && (
            <DetailRow label="US Tax ID" value={c.usTaxId} />
          )}
          <DetailRow label="Email" value={c.email} />
          <DetailRow label="Phone 1" value={c.phone1} />
          <DetailRow label="Phone 2" value={c.phone2} />
          <DetailRow label="SCUML Reg No" value={c.scumlRegNo} />
        </DetailSection>

        {c.ubos && c.ubos.length > 0 && (
          <DetailSection title="Ultimate Beneficial Owners (UBOs)">
            <div className="space-y-6">
              {c.ubos.map((ubo: UBOData, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    UBO {i + 1}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailRow
                      label="Name"
                      value={`${ubo.title} ${ubo.surname} ${ubo.firstName} ${ubo.otherName || ""}`.trim()}
                    />
                    <DetailRow label="Gender" value={ubo.gender} />
                    <DetailRow
                      label="Date of birth"
                      value={formatDate(ubo.dateOfBirth)}
                    />
                    <DetailRow label="Nationality" value={ubo.nationality} />
                    <DetailRow label="Designation" value={ubo.designation} />
                    <DetailRow
                      label="Shareholding %"
                      value={ubo.shareholdingPercent}
                    />
                    <DetailRow
                      label="Source of wealth"
                      value={ubo.sourceOfWealth}
                    />
                    <DetailRow
                      label="Also signatory"
                      value={ubo.isAlsoSignatory}
                    />
                    <DetailRow label="State" value={ubo.state} />
                    <DetailRow label="LGA" value={ubo.lga} />
                    <DetailRow
                      label="Residential address"
                      value={
                        <span className="whitespace-pre-wrap">
                          {ubo.residentialAddress}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Contact"
                      value={`${ubo.phoneCountryCode || ""} ${ubo.contactNumber || ""}`.trim() || ubo.contactNumber}
                    />
                    <DetailRow label="Email" value={ubo.email} />
                    <DetailRow label="BVN" value={ubo.bvn} />
                    <DetailRow label="NIN" value={ubo.nin} />
                  </div>
                  {ubo.signature && (
                    <div className="mt-4">
                      <ImageViewer
                        src={ubo.signature}
                        alt={`Signature for UBO ${i + 1}`}
                        label="Signature"
                        thumbnailClassName="h-16 w-32 rounded border border-gray-200 object-contain bg-white cursor-pointer transition-opacity hover:opacity-90"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {c.signatories && c.signatories.length > 0 && (
          <DetailSection title="Signatories">
            <div className="space-y-6">
              {c.signatories.map((sig: SignatoryData, i: number) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <h3 className="mb-4 text-sm font-semibold text-gray-700">
                    Signatory {i + 1}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailRow
                      label="Name"
                      value={`${sig.title} ${sig.surname} ${sig.firstName} ${sig.otherName || ""}`.trim()}
                    />
                    <DetailRow label="Gender" value={sig.gender} />
                    <DetailRow
                      label="Date of birth"
                      value={formatDate(sig.dateOfBirth)}
                    />
                    <DetailRow label="Marital status" value={sig.maritalStatus} />
                    <DetailRow label="Nationality" value={sig.nationality} />
                    <DetailRow label="State of origin" value={sig.stateOfOrigin} />
                    <DetailRow label="LGA" value={sig.lga} />
                    <DetailRow label="Occupation" value={sig.occupation} />
                    <DetailRow label="Job title" value={sig.jobTitle} />
                    <DetailRow label="Place of work" value={sig.placeOfWork} />
                    <DetailRow
                      label="Work address"
                      value={
                        <span className="whitespace-pre-wrap">
                          {sig.workAddress}
                        </span>
                      }
                    />
                    <DetailRow label="Work state" value={sig.workState} />
                    <DetailRow
                      label="Residential address"
                      value={
                        <span className="whitespace-pre-wrap">
                          {sig.residentialAddress}
                        </span>
                      }
                    />
                    <DetailRow
                      label="Residential state"
                      value={sig.residentialState}
                    />
                    <DetailRow
                      label="Contact"
                      value={`${sig.phoneCountryCode || ""} ${sig.contactNumber || ""}`.trim() || sig.contactNumber}
                    />
                    <DetailRow label="Email" value={sig.email} />
                    <DetailRow label="BVN" value={sig.bvn} />
                    <DetailRow label="NIN" value={sig.nin} />
                    <DetailRow label="ID type" value={sig.idType} />
                    <DetailRow label="Is PEP" value={sig.isPep} />
                  </div>
                  {sig.idPhoto && (
                    <div className="mt-4">
                      <ImageViewer
                        src={sig.idPhoto}
                        alt={`ID for signatory ${i + 1}`}
                        label="ID photo"
                        thumbnailClassName="h-24 w-32 rounded border border-gray-200 object-cover cursor-pointer transition-opacity hover:opacity-90"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        <DetailSection title="Investment Details">
          <DetailRow
            label="Initial investment amount"
            value={
              <span className="font-semibold text-gray-900">
                {formatCurrency(c.initialInvestmentAmount)}
              </span>
            }
          />
          <DetailRow label="Tenor" value={c.tenor} />
          <DetailRow label="Profit remittance" value={c.profitRemittance} />
        </DetailSection>

        <DetailSection title="Bank Details">
          <DetailRow label="Primary bank" value={c.primaryBankName} />
          <DetailRow label="Primary account name" value={c.primaryAccountName} />
          <DetailRow
            label="Primary account number"
            value={c.primaryAccountNumber}
          />
          {c.secondaryBankName && (
            <>
              <DetailRow label="Secondary bank" value={c.secondaryBankName} />
              <DetailRow
                label="Secondary account name"
                value={c.secondaryAccountName}
              />
              <DetailRow
                label="Secondary account number"
                value={c.secondaryAccountNumber}
              />
            </>
          )}
          {c.accountMandates && c.accountMandates.length > 0 && (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-4">
              <dt className="min-w-[140px] text-sm font-medium text-gray-500">
                Account mandates
              </dt>
              <dd className="space-y-4">
                {c.accountMandates.map((m: AccountMandateData, i: number) => (
                  <div
                    key={i}
                    className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="mb-3 grid gap-2 sm:grid-cols-2">
                      <DetailRow label="Name" value={m.name} />
                      <DetailRow
                        label="Class of signatory"
                        value={m.classOfSignatory}
                      />
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {m.passport && (
                        <ImageViewer
                          src={m.passport}
                          alt={`Passport for ${m.name}`}
                          label="Passport"
                          thumbnailClassName="h-24 w-24 rounded border border-gray-200 object-cover cursor-pointer transition-opacity hover:opacity-90"
                        />
                      )}
                      {m.signature && (
                        <ImageViewer
                          src={m.signature}
                          alt={`Signature for ${m.name}`}
                          label="Signature"
                          thumbnailClassName="h-16 w-32 rounded border border-gray-200 object-contain bg-white cursor-pointer transition-opacity hover:opacity-90"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </dd>
            </div>
          )}
        </DetailSection>

        <DetailSection title="Indemnity">
          <DetailRow label="Designated email" value={c.designatedEmail} />
          <DetailRow label="Designated phone" value={c.designatedPhone} />
          <DetailRow
            label="Indemnity confirmed"
            value={
              <span
                className={
                  c.indemnityConfirmed
                    ? "text-emerald-600"
                    : "text-amber-600"
                }
              >
                {c.indemnityConfirmed ? "Yes" : "No"}
              </span>
            }
          />
          <DetailRow
            label="Data usage agreed"
            value={
              <span
                className={
                  c.dataUsageAgreed ? "text-emerald-600" : "text-amber-600"
                }
              >
                {c.dataUsageAgreed ? "Yes" : "No"}
              </span>
            }
          />
        </DetailSection>

        {(canApprove || canReject || canEscalate) && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Application actions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Review this application and approve, reject, or escalate to
                  the next tier if you cannot handle this approval.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                {canApprove && (
                  <button
                    type="button"
                    onClick={() => setApproveModalOpen(true)}
                    className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Approve
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
                {canReject && (
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(true)}
                    className="rounded-lg border border-red-300 bg-white px-6 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Reject
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
                toast.success("Corporate customer approved successfully");
                setApproveModalOpen(false);
              },
              onError: (err) => {
                const message =
                  axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Failed to approve corporate customer";
                toast.error(message);
              },
            });
          }}
          isPending={approveMutation.isPending}
        />

        <RejectCustomerModal
          open={rejectModalOpen}
          handleClose={() => setRejectModalOpen(false)}
          onConfirm={(reason) => {
            rejectMutation.mutate(reason, {
              onSuccess: () => {
                toast.success("Corporate customer rejected");
                setRejectModalOpen(false);
              },
              onError: (err) => {
                const message =
                  axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Failed to reject corporate customer";
                toast.error(message);
              },
            });
          }}
          isPending={rejectMutation.isPending}
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
                toast.success("Corporate customer escalated successfully");
                setEscalateModalOpen(false);
                router.push("/u/customers?tab=corporate");
              },
              onError: (err) => {
                const message =
                  axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Failed to escalate corporate customer";
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
