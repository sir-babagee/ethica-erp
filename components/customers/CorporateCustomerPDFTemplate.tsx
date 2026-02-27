import React from "react";
import type {
  CorporateCustomerDetail,
  UBOData,
  SignatoryData,
  AccountMandateData,
} from "@/types";

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
  breakInside: "avoid",
  pageBreakInside: "avoid",
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
    <div style={sectionWrap} data-pdf-section>
      <div style={sectionHead}>{title}</div>
      <div style={sectionBody}>{children}</div>
    </div>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...sectionWrap,
        marginLeft: 8,
        borderColor: "#e5e7eb",
      }}
      data-pdf-section
    >
      <div
        style={{
          ...sectionHead,
          background: "#374151",
          fontSize: 8,
          padding: "2px 8px",
        }}
      >
        {title}
      </div>
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
  customer: CorporateCustomerDetail;
  pdfRef: React.RefObject<HTMLDivElement | null>;
}

export function CorporateCustomerPDFTemplate({ customer: c, pdfRef }: Props) {
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
        data-pdf-section
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
              Customer Report — Corporate Account
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

      {/* ── COMPANY BANNER ── */}
      <div
        data-pdf-section
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
            {c.companyName}
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
            value={<span style={{ color: "#b91c1c" }}>{c.rejectionReason}</span>}
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

      {/* ── COMPANY DETAILS ── */}
      <Section title="Company Details">
        <Row label="Company name" value={c.companyName} />
        <Row label="Category" value={c.companyCategory} />
        <Row label="Registration number" value={c.registrationNumber} />
        <Row label="Date of incorporation" value={fmtDate(c.dateOfIncorporation)} />
        <Row label="Country of incorporation" value={c.countryOfIncorporation} />
        <Row label="Type of business" value={c.typeOfBusiness} />
        <Row label="Sector/Industry" value={c.sectorIndustry} />
        <Row label="Operating address" value={c.operatingAddress} />
        <Row label="Operating state" value={c.operatingState} />
        <Row label="Registered address" value={c.registeredAddress} />
        <Row label="Registered state" value={c.registeredState} />
        <Row label="TIN" value={c.tin} />
        {c.otherJurisdiction && (
          <Row label="Other jurisdiction" value={c.otherJurisdiction} />
        )}
        {c.usTaxId && <Row label="US Tax ID" value={c.usTaxId} />}
        <Row label="Email" value={c.email} />
        <Row label="Phone 1" value={c.phone1} />
        <Row label="Phone 2" value={c.phone2} />
        <Row
          label="CAC documents"
          value={c.cacMerged ? "Merged — single file" : "Separate files"}
        />
        <Row label="Has SCUML" value={c.hasScuml ? "Yes" : "No"} />
        {c.hasScuml && c.scumlRegNo && (
          <Row label="SCUML Reg No" value={c.scumlRegNo} />
        )}
      </Section>

      {/* ── UBOs ── */}
      {c.ubos && c.ubos.length > 0 && (
        <Section title="Ultimate Beneficial Owners (UBOs)">
          {c.ubos.map((ubo: UBOData, i: number) => (
            <SubSection key={i} title={`UBO ${i + 1}`}>
              <Row
                label="Name"
                value={`${ubo.title} ${ubo.surname} ${ubo.firstName} ${ubo.otherName || ""}`.trim()}
              />
              <Row label="Gender" value={ubo.gender} />
              <Row label="Date of birth" value={fmtDate(ubo.dateOfBirth)} />
              <Row label="Nationality" value={ubo.nationality} />
              <Row label="Designation" value={ubo.designation} />
              <Row label="Shareholding %" value={ubo.shareholdingPercent} />
              <Row
                label="Source of wealth"
                value={ubo.sourceOfWealth ? fmtSnakeCase(ubo.sourceOfWealth) : undefined}
              />
              <Row label="Also signatory" value={ubo.isAlsoSignatory} />
              <Row label="State" value={ubo.state} />
              <Row label="LGA" value={ubo.lga} />
              <Row label="Residential address" value={ubo.residentialAddress} />
              <Row
                label="Contact"
                value={`${ubo.phoneCountryCode || ""} ${ubo.contactNumber || ""}`.trim() || ubo.contactNumber}
              />
              <Row label="Email" value={ubo.email} />
              <Row label="BVN" value={ubo.bvn} />
              <Row label="NIN" value={ubo.nin} />
              <Row label="ID type" value={ubo.idType} />
            </SubSection>
          ))}
        </Section>
      )}

      {/* ── SIGNATORIES ── */}
      {c.signatories && c.signatories.length > 0 && (
        <Section title="Signatories">
          {c.signatories.map((sig: SignatoryData, i: number) => (
            <SubSection key={i} title={`Signatory ${i + 1}`}>
              <Row
                label="Name"
                value={`${sig.title} ${sig.surname} ${sig.firstName} ${sig.otherName || ""}`.trim()}
              />
              <Row label="Gender" value={sig.gender} />
              <Row label="Date of birth" value={fmtDate(sig.dateOfBirth)} />
              <Row label="Marital status" value={sig.maritalStatus} />
              <Row label="Nationality" value={sig.nationality} />
              <Row label="Occupation" value={sig.occupation} />
              <Row label="Job title" value={sig.jobTitle} />
              <Row label="Place of work" value={sig.placeOfWork} />
              <Row label="Work address" value={sig.workAddress} />
              <Row label="Residential address" value={sig.residentialAddress} />
              <Row
                label="Contact"
                value={`${sig.phoneCountryCode || ""} ${sig.contactNumber || ""}`.trim() || sig.contactNumber}
              />
              <Row label="Email" value={sig.email} />
              <Row label="BVN" value={sig.bvn} />
              <Row label="NIN" value={sig.nin} />
              <Row label="ID type" value={sig.idType} />
              <Row label="Is PEP" value={sig.isPep} />
            </SubSection>
          ))}
        </Section>
      )}

      {/* ── INVESTMENT DETAILS ── */}
      <Section title="Investment Details">
        <Row
          label="Initial investment"
          value={
            <span style={{ fontWeight: 700, color: BRAND }}>
              {fmt(c.initialInvestmentAmount)}
            </span>
          }
        />
        <Row label="Tenor" value={c.tenor} />
        <Row label="Profit remittance" value={c.profitRemittance} />
      </Section>

      {/* ── BANK DETAILS ── */}
      <Section title="Bank Details">
        <Row label="Primary bank" value={c.primaryBankName} />
        <Row label="Primary account name" value={c.primaryAccountName} />
        <Row label="Primary account number" value={c.primaryAccountNumber} />
        {c.secondaryBankName && (
          <>
            <Row label="Secondary bank" value={c.secondaryBankName} />
            <Row label="Secondary account name" value={c.secondaryAccountName} />
            <Row label="Secondary account number" value={c.secondaryAccountNumber} />
          </>
        )}
        {c.accountMandates && c.accountMandates.length > 0 && (
          <>
            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <span style={labelStyle}>Account mandates</span>
              <span style={valueStyle} />
            </div>
            {c.accountMandates.map((m: AccountMandateData, i: number) => (
              <div
                key={i}
                style={{
                  marginTop: 4,
                  padding: "4px 8px",
                  background: "#f9fafb",
                  borderRadius: 4,
                  border: "1px solid #e5e7eb",
                }}
                data-pdf-section
              >
                <Row label="Name" value={m.name} />
                <Row label="Class of signatory" value={m.classOfSignatory} />
                <Row label="BVN" value={m.bvn} />
                <Row label="ID type" value={m.idType} />
              </div>
            ))}
          </>
        )}
      </Section>

      {/* ── INDEMNITY ── */}
      <Section title="Indemnity">
        <Row label="Designated email" value={c.designatedEmail} />
        <Row label="Designated phone" value={c.designatedPhone} />
        <Row
          label="Indemnity confirmed"
          value={
            <span style={{ color: c.indemnityConfirmed ? "#065f46" : "#92400e", fontWeight: 600 }}>
              {c.indemnityConfirmed ? "Yes" : "No"}
            </span>
          }
        />
        <Row
          label="Data usage agreed"
          value={
            <span style={{ color: c.dataUsageAgreed ? "#065f46" : "#92400e", fontWeight: 600 }}>
              {c.dataUsageAgreed ? "Yes" : "No"}
            </span>
          }
        />
      </Section>

      {/* ── FOOTER ── */}
      <div
        data-pdf-section
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
        <span>Ethica Capital — Confidential Corporate Customer Record</span>
        <span>Generated {new Date().toLocaleString("en-GB")}</span>
      </div>
    </div>
  );
}
