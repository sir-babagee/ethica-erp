import React from "react";
import type { CustomerDetail, PEPData } from "@/types";

function fmt(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtSnakeCase(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
} 

const PAGE_W = 794;
const BRAND = "#0f2d52";
const BRAND_LIGHT = "#e8eef6";
const DIVIDER = "#d1d9e6";
const TEXT_MAIN = "#111827";
const TEXT_MUTED = "#4b5563";
const TEXT_LABEL = "#6b7280";

const sectionWrap: React.CSSProperties = {
  marginBottom: 6,
  border: `1px solid ${DIVIDER}`,
  borderRadius: 4,
  overflow: "hidden",
};

const sectionHead: React.CSSProperties = {
  background: BRAND,
  color: "#fff",
  padding: "2px 10px",
  paddingBottom: 8,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const sectionBody: React.CSSProperties = {
  background: "#fff",
  padding: "6px 10px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  paddingTop: 2,
  paddingBottom: 2,
  borderBottom: `1px solid #f3f4f6`,
  fontSize: 10,
};

const labelStyle: React.CSSProperties = {
  minWidth: 100,
  fontWeight: 600,
  color: TEXT_LABEL,
  paddingRight: 8,
  flexShrink: 0,
  fontSize: 10,
};

const valueStyle: React.CSSProperties = {
  color: TEXT_MAIN,
  flex: 1,
  wordBreak: "break-word",
  fontSize: 10,
};

function Row({
  label,
  value,
  centerValue,
}: {
  label: string;
  value?: React.ReactNode;
  centerValue?: boolean;
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}</span>
      <span
        style={{
          ...valueStyle,
          ...(centerValue && {
            display: "flex",
            justifyContent: "center",
          }),
        }}
      >
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionWrap}>
      <div style={sectionHead}>{title}</div>
      <div style={sectionBody}>{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    approved: { bg: "#d1fae5", color: "#065f46" },
    unverified: { bg: "#fef3c7", color: "#92400e" },
    rejected: { bg: "#f3f4f6", color: "#374151" },
  };
  const c = colors[status] ?? colors.unverified;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: c.color,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

interface Props {
  customer: CustomerDetail;
  pdfRef: React.RefObject<HTMLDivElement | null>;
}

export function CustomerPDFTemplate({ customer: c, pdfRef }: Props) {
  const fullName = [c.title, c.firstName, c.lastName, c.otherName]
    .filter(Boolean)
    .join(" ");
  const nokName = [c.nokFirstName, c.nokSurname, c.nokOtherName]
    .filter(Boolean)
    .join(" ");
  const nokPhone =
    c.nokCountryCode && c.nokPhoneNumber
      ? `${c.nokCountryCode} ${c.nokPhoneNumber}`
      : c.nokPhoneNumber;

  return (
    <div
      ref={pdfRef}
      style={{
        position: "fixed",
        top: 0,
        left: "-9999px",
        width: PAGE_W,
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        background: "#f9fafb",
        padding: 12,
        boxSizing: "border-box",
        color: TEXT_MAIN,
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: BRAND,
          borderRadius: 6,
          padding: "8px 16px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Ethica Capital"
            style={{
              height: 32,
              width: "auto",
              objectFit: "contain",
              background: "#fff",
              borderRadius: 4,
              padding: 2,
            }}
            crossOrigin="anonymous"
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
              Ethica Capital
            </div>
            <div style={{ fontSize: 9, color: "#93c5fd", marginTop: 1 }}>
              Customer Report — Personal Account
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#93c5fd" }}>Generated</div>
          <div style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      {/* ── CUSTOMER NAME BANNER ── */}
      <div
        style={{
          background: BRAND_LIGHT,
          borderRadius: 4,
          padding: "6px 12px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          border: `1px solid ${DIVIDER}`,
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: BRAND, letterSpacing: "0.01em" }}>
            {fullName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            <StatusPill status={c.status} />
            {c.customerId && (
              <span style={{ fontSize: 10, color: TEXT_MUTED }}>• {c.customerId}</span>
            )}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: TEXT_LABEL }}>Submitted</div>
          <div style={{ fontSize: 10, color: TEXT_MAIN, fontWeight: 600 }}>
            {fmtDate(c.createdAt)}
          </div>
        </div>
      </div>

      {/* ── APPLICATION STATUS ── */}
      <Section title="Application Status">
        <Row label="Status" value={<StatusPill status={c.status} />} />
        <Row label="Customer ID" value={c.customerId} />
        <Row label="Submitted" value={fmtDate(c.createdAt)} />
        <Row label="Last updated" value={fmtDate(c.updatedAt)} />
        {c.rejectionReason && (
          <Row
            label="Rejection reason"
            value={
              <span style={{ color: "#b91c1c" }}>{c.rejectionReason}</span>
            }
          />
        )}
        {(() => {
          const approvedRejected = (c.activity ?? []).filter(
            (item) => item.action === "approved" || item.action === "rejected"
          );
          if (approvedRejected.length === 0) return null;
          const value = approvedRejected
            .map((item) => `${item.action} — ${fmtDate(item.timestamp)}`)
            .join("; ");
          return <Row label="Activity" value={value} />;
        })()}
      </Section>

      {/* ── DOCUMENTS & IDENTITY (ID type only, no images) ── */}
      {c.idType && (
        <Section title="Documents & Identity">
          <Row label="ID type" value={c.idType} />
        </Section>
      )}

      {/* ── PERSONAL INFORMATION ── */}
      <Section title="Personal Information">
        <Row label="Title" value={c.title} />
        <Row label="First name" value={c.firstName} />
        <Row label="Last name" value={c.lastName} />
        <Row label="Other name" value={c.otherName} />
        <Row label="Date of birth" value={fmtDate(c.dateOfBirth)} />
        <Row label="Gender" value={c.gender} />
        <Row label="Marital status" value={c.maritalStatus} />
        <Row label="Nationality" value={c.nationality} />
        <Row label="State" value={c.state} />
        <Row label="LGA" value={c.lga} />
        <Row label="Email" value={c.email} />
        <Row label="Phone" value={c.phone} />
        <Row label="Contact address" value={c.contactAddress} />
        {c.contactAddressState && (
          <Row label="Address state" value={c.contactAddressState} />
        )}
      </Section>

      {/* ── EMPLOYMENT ── */}
      <Section title="Employment">
        <Row label="Employment status" value={c.employmentStatus} />
        {c.employmentStatus === "Employed" && (
          <>
            <Row label="Employer name" value={c.employerName} />
            <Row label="Employer address" value={c.employerAddress} />
          </>
        )}
      </Section>

      {/* ── NEXT OF KIN ── */}
      <Section title="Next of Kin">
        <Row label="Full name" value={nokName} />
        <Row label="Date of birth" value={fmtDate(c.nokDateOfBirth)} />
        <Row label="Relationship" value={c.nokRelationship} />
        <Row label="Phone" value={nokPhone} />
        <Row label="Email" value={c.nokEmail} />
        <Row label="Contact address" value={c.nokContactAddress} />
        {c.nokAddressState && (
          <Row label="Address state" value={c.nokAddressState} />
        )}
      </Section>

      {/* ── INVESTMENT DETAILS ── */}
      <Section title="Investment Details">
        <Row
          label="Investment amount"
          value={
            <span style={{ fontWeight: 700, color: BRAND }}>
              {fmt(c.investmentAmount)}
            </span>
          }
        />
        <Row label="Tenor" value={c.tenor} />
        <Row label="Rollover" value={c.rollover} />
      </Section>

      {/* ── BANK DETAILS ── */}
      <Section title="Bank Details">
        <Row label="BVN" value={c.bvn} />
        <Row label="Bank name" value={c.bankName} />
        <Row label="Account number" value={c.accountNumber} />
        <Row label="Account name" value={c.accountName} />
        <Row label="TIN" value={c.tin} />
      </Section>

      {/* ── CONTACT PERSONS ── */}
      {c.contactPersons && c.contactPersons.length > 0 && (
        <Section title="Contact Persons">
          {c.contactPersons.map((name, i) => (
            <div key={i} style={rowStyle}>
              <span style={labelStyle}>Person {i + 1}</span>
              <span style={valueStyle}>{name}</span>
            </div>
          ))}
        </Section>
      )}

      {/* ── SOURCE OF WEALTH ── */}
      {(c.sourceOfWealth?.length || c.sourceOfWealthDetails) && (
        <Section title="Source of Wealth">
          {c.sourceOfWealth && c.sourceOfWealth.length > 0 && (
            <div style={{ ...rowStyle, alignItems: "flex-start" }}>
              <span style={labelStyle}>Sources</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {c.sourceOfWealth.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      background: BRAND_LIGHT,
                      color: BRAND,
                      borderRadius: 999,
                      padding: "2px 6px",
                      fontSize: 9,
                      fontWeight: 600,
                    }}
                  >
                    {fmtSnakeCase(s)}
                  </span>
                ))}
              </div>
            </div>
          )}
          {c.sourceOfWealthDetails &&
            Object.keys(c.sourceOfWealthDetails).length > 0 &&
            Object.entries(c.sourceOfWealthDetails).map(([key, val]) => {
              const label = key.includes("_")
                ? fmtSnakeCase(key)
                : key
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .replace(/^\w/, (s) => s.toUpperCase());
              return <Row key={key} label={label} value={val} />;
            })}
        </Section>
      )}

      {/* ── PEP ── */}
      {c.pepData && (c.pepData as PEPData).isPEP && (
        <Section title="Politically Exposed Person (PEP)">
          <PEPRows pep={c.pepData as PEPData} />
        </Section>
      )}

      {/* ── TERMS ── */}
      <Section title="Terms & Conditions">
        <Row
          label="Terms accepted"
          value={
            c.termsAccepted ? (
              <span style={{ color: "#065f46", fontWeight: 600 }}>✓ Yes</span>
            ) : (
              "No"
            )
          }
        />
      </Section>

      {/* ── FOOTER ── */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 6,
          borderTop: `1px solid ${DIVIDER}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 8,
          color: TEXT_LABEL,
        }}
      >
        <span>Ethica Capital — Confidential Customer Record</span>
        <span>
          Generated {new Date().toLocaleString("en-GB")}
        </span>
      </div>
    </div>
  );
}

function PEPRows({ pep }: { pep: PEPData }) {
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
    <>
      {rows.map(({ label, key }) => {
        const val = pep[key];
        if (val === undefined || val === null || val === "") return null;
        const display = Array.isArray(val) ? val.join(", ") : String(val);
        return <Row key={key} label={label} value={display} />;
      })}
    </>
  );
}
