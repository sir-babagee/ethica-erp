"use client";

import { useAuthStore } from "@/stores/authStore";
import { PERMISSIONS } from "@/constants/roles";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <span className="font-semibold">Note: </span>
      {children}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span className="font-semibold">Important: </span>
      {children}
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
        {number}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-gray-600">{children}</p>
      </div>
    </div>
  );
}

function FieldRow({
  name,
  required,
  description,
}: {
  name: string;
  required?: boolean;
  description: string;
}) {
  return (
    <tr className="border-b border-gray-100">
      <td className="py-2.5 pr-4 align-top">
        <span className="font-mono text-sm font-medium text-gray-900">
          {name}
        </span>
        {required && (
          <span className="ml-1.5 rounded bg-red-100 px-1 py-0.5 text-xs font-medium text-red-600">
            required
          </span>
        )}
      </td>
      <td className="py-2.5 text-sm text-gray-600">{description}</td>
    </tr>
  );
}

const TOC_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "how-it-flows", label: "How It All Flows" },
  { id: "chart-of-accounts", label: "Chart of Accounts" },
  { id: "investment-mapping", label: "↳ Investment Account Mapping" },
  { id: "journal-entries", label: "Journal Entries" },
  { id: "journal-header", label: "↳ Header Fields" },
  { id: "journal-lines", label: "↳ Journal Lines" },
  { id: "approval", label: "Approving a Journal" },
  { id: "hash-chain", label: "↳ Cryptographic Hash Chain" },
  { id: "general-ledger", label: "General Ledger" },
  { id: "trial-balance", label: "Trial Balance" },
  { id: "permissions", label: "Roles & Permissions" },
];

export default function FinanceDocsPage() {
  const permissions = useAuthStore((s) => s.permissions);

  if (!permissions.includes(PERMISSIONS.FINANCE_VIEW)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-lg font-semibold text-red-700">Access Denied</p>
          <p className="mt-1 text-sm text-red-600">
            This page is only accessible to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-8 p-8">
      {/* Table of contents */}
      <aside className="hidden w-52 shrink-0 xl:block">
        <div className="sticky top-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            On This Page
          </p>
          <nav className="space-y-1">
            {TOC_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`block rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-100 hover:text-primary ${
                  item.label.startsWith("↳")
                    ? "pl-5 text-gray-400 hover:text-primary"
                    : "font-medium text-gray-600"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 space-y-12">
        {/* Page title */}
        <div className="border-b border-gray-200 pb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Admin Only
            </span>
            <span className="text-xs text-gray-400">Finance Module</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Finance Module — User Guide
          </h1>
          <p className="mt-2 text-gray-500">
            A complete reference for how the finance module works — from setting
            up accounts all the way to reading the trial balance.
          </p>
        </div>

        {/* OVERVIEW */}
        <Section id="overview" title="Overview">
          <p>
            The Finance Module implements a standard double-entry bookkeeping
            system tailored for an Islamic fund management operation. It is
            built around four interconnected components:
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                title: "Chart of Accounts",
                color: "border-blue-200 bg-blue-50",
                text: "Defines the account structure — groups (e.g. Assets, Liabilities) and optional sub-groups (e.g. Cash at Bank — Operating). Every transaction must reference a valid account.",
              },
              {
                title: "Journal Entries",
                color: "border-purple-200 bg-purple-50",
                text: "The primary recording mechanism. Each journal has multiple debit and credit lines that must balance (total DR = total CR). Journals start as Pending and are posted only after approval.",
              },
              {
                title: "General Ledger",
                color: "border-green-200 bg-green-50",
                text: "Shows all posted transactions per account, with a running balance. You can drill down from a group head into its sub-accounts (subledgers) and see individual entries.",
              },
              {
                title: "Trial Balance",
                color: "border-amber-200 bg-amber-50",
                text: "A snapshot of all account balances as of any chosen date. Confirms that the books balance (total debits = total credits). Computed on-demand — backdated entries are automatically reflected.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`rounded-lg border p-4 ${card.color}`}
              >
                <p className="mb-1 font-semibold text-gray-900">{card.title}</p>
                <p className="text-sm text-gray-600">{card.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* HOW IT FLOWS */}
        <Section id="how-it-flows" title="How It All Flows">
          <p>
            Think of the finance module as a pipeline. Everything starts from
            the Chart of Accounts and flows through to the Trial Balance:
          </p>
          <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex min-w-[520px] items-center justify-between gap-2">
              {[
                {
                  step: "1",
                  label: "Chart of Accounts",
                  sub: "Define account groups & sub-groups",
                  color: "bg-blue-100 text-blue-700",
                },
                {
                  step: "→",
                  label: "",
                  sub: "",
                  color: "",
                },
                {
                  step: "2",
                  label: "Post Journal",
                  sub: "Create multi-line entry (Pending)",
                  color: "bg-purple-100 text-purple-700",
                },
                {
                  step: "→",
                  label: "",
                  sub: "",
                  color: "",
                },
                {
                  step: "3",
                  label: "Approve",
                  sub: "CFO / MD approves → Posted",
                  color: "bg-amber-100 text-amber-700",
                },
                {
                  step: "→",
                  label: "",
                  sub: "",
                  color: "",
                },
                {
                  step: "4",
                  label: "GL & Trial Balance",
                  sub: "Live in reporting",
                  color: "bg-green-100 text-green-700",
                },
              ].map((node, i) =>
                node.label === "" ? (
                  <span
                    key={i}
                    className="text-xl font-bold text-gray-300"
                  >
                    →
                  </span>
                ) : (
                  <div key={i} className="flex-1 text-center">
                    <div
                      className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${node.color}`}
                    >
                      {node.step}
                    </div>
                    <p className="text-xs font-semibold text-gray-900">
                      {node.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{node.sub}</p>
                  </div>
                )
              )}
            </div>
          </div>
          <Warning>
            A journal entry only appears in the GL and Trial Balance
            <strong> after it has been approved and posted</strong>. Saving a
            journal as Pending does not affect any balances.
          </Warning>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="mb-2 font-semibold text-emerald-900">
              Investments → automatic journals
            </p>
            <p className="text-sm text-emerald-800">
              When a Mudarabah Fund investment is <strong>approved</strong>, the
              system automatically skips to step 3 — it creates and immediately
              posts the journal on your behalf (DR Custodian, CR Customer
              Liabilities). You do not need to create a manual journal for
              investment inflows; this is handled entirely by the approval
              workflow.
            </p>
          </div>
        </Section>

        {/* CHART OF ACCOUNTS */}
        <Section id="chart-of-accounts" title="1. Chart of Accounts">
          <p>
            Before any journal can be posted, the relevant accounts must exist
            in the Chart of Accounts. Accounts are structured in two levels:
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Groups (Head Accounts)
              </p>
              <p className="text-gray-600">
                4-digit codes that are <strong>multiples of 1000</strong> (e.g.{" "}
                <span className="font-mono text-sm">1000</span>,{" "}
                <span className="font-mono text-sm">2000</span>). Each group
                implicitly owns a range of 1000 codes. For example, group{" "}
                <span className="font-mono text-sm">1000</span> (Assets) covers
                all accounts from 1000 to 1999. Groups have an Account Type
                which determines which section of the Trial Balance they appear
                in.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["1000", "Assets", "blue"],
                  ["2000", "Liabilities", "red"],
                  ["3000", "Equity", "purple"],
                  ["4000", "Revenue", "green"],
                  ["5000", "Expenses", "orange"],
                  ["6000", "Fund Control", "teal"],
                  ["7000", "Suspense", "gray"],
                ].map(([code, name, color]) => (
                  <span
                    key={code}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium bg-${color}-100 text-${color}-700`}
                  >
                    {code} — {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Sub-groups (Optional)
              </p>
              <p className="text-gray-600">
                4-digit codes that are <strong>NOT</strong> multiples of 1000
                (e.g. <span className="font-mono text-sm">1001</span>,{" "}
                <span className="font-mono text-sm">1002</span>). The parent
                group is resolved automatically by the system — e.g.{" "}
                <span className="font-mono text-sm">1002</span> is automatically
                placed under <span className="font-mono text-sm">1000</span>{" "}
                (Assets). Sub-groups give you more granularity within a group,
                such as splitting Cash into Operating vs. Client Settlement.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                How accounts are used in transactions
              </p>
              <p className="text-gray-600">
                When posting a journal, you use a{" "}
                <strong>10-digit account number</strong>. The system reads the
                first 4 digits to identify the group or sub-group. For example:
              </p>
              <div className="mt-2 rounded-lg bg-gray-50 p-3 font-mono text-sm">
                <p>
                  <span className="text-blue-600">1002</span>020301{" "}
                  <span className="text-gray-400">
                    → Cash at Bank – Client Settlement (Assets)
                  </span>
                </p>
                <p>
                  <span className="text-red-600">2001</span>010001{" "}
                  <span className="text-gray-400">
                    → Trade Payable – Brokers (Liabilities)
                  </span>
                </p>
                <p>
                  <span className="text-teal-600">6101</span>000001{" "}
                  <span className="text-gray-400">
                    → Client Ledger Control – Cash (Fund Control)
                  </span>
                </p>
              </div>
              <p className="mt-2 text-gray-600">
                The system validates the first 4 digits in real-time as you
                type — you will see a green confirmation if the prefix matches a
                known COA entry, or an amber warning if it does not.
              </p>
            </div>
          </div>

          <Note>
            Only staff with the <strong>COA Manage</strong> permission (admin
            and fund accountant) can create new groups and sub-groups. All
            account codes are globally unique — the same code cannot be used as
            both a group and a sub-group.
          </Note>
        </Section>

        {/* INVESTMENT ACCOUNT MAPPING */}
        <Section id="investment-mapping" title="Investment Account Mapping">
          <p>
            The finance module integrates directly with the Investments module.
            When an investment is <strong>approved</strong> by a CFO, MD, or
            Admin, the system automatically creates and posts a double-entry
            journal in the books — no manual entry required.
          </p>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 font-semibold text-gray-900">
              What gets posted on approval
            </p>
            <div className="rounded-lg bg-gray-50 p-4 font-mono text-sm">
              <div className="grid grid-cols-[1fr_auto_auto] gap-x-6">
                <span className="font-semibold text-gray-400">Account</span>
                <span className="font-semibold text-gray-400">DR</span>
                <span className="font-semibold text-gray-400">CR</span>
                <span className="text-blue-700">Custodian Account (Asset)</span>
                <span className="font-medium text-blue-700">Investment Amount</span>
                <span className="text-gray-300">—</span>
                <span className="text-rose-700">Customer Liabilities Account (Liability)</span>
                <span className="text-gray-300">—</span>
                <span className="font-medium text-rose-700">Investment Amount</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              The journal is tagged <strong>Source: Subscription</strong>, uses
              the investment start date, links the{" "}
              <strong>Client ID</strong> to the investor, and carries the
              investment reference in the narration. It appears immediately in
              the GL and Trial Balance with no further action required.
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="mb-2 font-semibold text-amber-900">
                Prerequisite: designate both accounts first
              </p>
              <p className="text-sm text-amber-800">
                Before any investment entry can be submitted, a COA manager
                must designate exactly one sub-group as the{" "}
                <strong>Custodian Account (DR)</strong> and one as the{" "}
                <strong>Customer Liabilities Account (CR)</strong>. Until both
                are set, the Submit button on the new investment form is
                disabled.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-3 font-semibold text-gray-900">
                How to set up the accounts
              </p>
              <div className="space-y-3">
                <Step number={1} title="Go to Chart of Accounts">
                  Open the Chart of Accounts page from the Finance section of
                  the sidebar.
                </Step>
                <Step number={2} title="Find the Investment Account Mapping panel">
                  At the top of the page, above the account tree, you will see
                  the <strong>Investment Account Mapping</strong> panel. It
                  shows the current status — amber if not configured, green
                  once both accounts are set.
                </Step>
                <Step number={3} title='Click "Designate account" under DR'>
                  A dropdown will appear showing all sub-groups under{" "}
                  <strong>Asset groups only</strong>. Select the sub-group that
                  represents the Custodian Account where incoming investment
                  funds are held (e.g. Cash at Bank — Client Settlement). Click{" "}
                  <strong>Confirm</strong>.
                </Step>
                <Step number={4} title='Click "Designate account" under CR'>
                  A dropdown will appear showing all sub-groups under{" "}
                  <strong>Liability groups only</strong>. Select the sub-group
                  that represents the Customer Liabilities Account (the
                  obligation owed to the investor). Click{" "}
                  <strong>Confirm</strong>.
                </Step>
                <Step number={5} title="The panel turns green">
                  Once both accounts are designated, the panel shows the green{" "}
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                    Configured
                  </span>{" "}
                  badge. Investment entries can now be submitted and the auto-journal
                  will fire on approval.
                </Step>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Validation rules
              </p>
              <ul className="list-inside list-disc space-y-1.5 text-sm text-gray-600">
                <li>
                  The <strong>debit account</strong> must belong to an{" "}
                  <strong>Asset</strong> group. Trying to designate a liability
                  or equity sub-group will be rejected.
                </li>
                <li>
                  The <strong>credit account</strong> must belong to a{" "}
                  <strong>Liability</strong> group. Trying to designate an
                  asset or equity sub-group will be rejected.
                </li>
                <li>
                  You can change the designation at any time — setting a new
                  account automatically removes the flag from the previous one.
                  This change only affects future investment approvals; already
                  posted journals are never modified.
                </li>
                <li>
                  The auto-journal is created as <strong>Posted</strong>{" "}
                  immediately. The investment approval itself serves as the
                  authorisation. No separate Finance Approve step is needed for
                  it.
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Viewing the auto-posted journal
              </p>
              <p className="text-sm text-gray-600">
                After approving an investment, go to the{" "}
                <strong>Accounting</strong> page (Journal Entries) and filter
                by <strong>Source: Subscription</strong>. You will find the
                auto-generated journal referencing the investment. Open it to
                see the full double-entry lines, the hash chain fingerprint,
                and the linked client ID. The same entries appear in the{" "}
                <strong>General Ledger</strong> under the designated Custodian
                Account and Customer Liabilities Account.
              </p>
            </div>
          </div>

          <Note>
            Only staff with the <strong>COA Manage</strong> permission can
            designate or change the investment accounts. All{" "}
            <strong>Finance View</strong> holders can see the current mapping
            but cannot edit it.
          </Note>
        </Section>

        {/* JOURNAL ENTRIES */}
        <Section id="journal-entries" title="2. Journal Entries">
          <p>
            A journal entry records one complete accounting event. Unlike a
            simple transaction, a journal can have <strong>multiple lines</strong>{" "}
            — any number of debit and credit legs — as long as the total debits
            equal the total credits.
          </p>
          <p>
            For example, a fund subscription (investor sends ₦10m) results in
            four lines posted simultaneously:
          </p>
          <div className="rounded-lg border border-gray-200 bg-white p-4 font-mono text-sm">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-6">
              <span className="font-semibold text-gray-400">Account</span>
              <span className="font-semibold text-gray-400">DR</span>
              <span className="font-semibold text-gray-400">CR</span>
              <span className="text-blue-700">1002xxxxxx — Cash (Client Settlement)</span>
              <span className="font-medium text-blue-700">₦10m</span>
              <span className="text-gray-300">—</span>
              <span className="text-rose-700">2203xxxxxx — Client Cash Control</span>
              <span className="text-gray-300">—</span>
              <span className="font-medium text-rose-700">₦10m</span>
            </div>
            <div className="mt-3 border-t border-dashed border-gray-200 pt-3 grid grid-cols-[1fr_auto_auto] gap-x-6">
              <span className="text-blue-700">2203xxxxxx — Client Cash Control</span>
              <span className="font-medium text-blue-700">₦10m</span>
              <span className="text-gray-300">—</span>
              <span className="text-rose-700">6001xxxxxx — Fund A Units Issued</span>
              <span className="text-gray-300">—</span>
              <span className="font-medium text-rose-700">₦10m</span>
            </div>
          </div>
          <p>
            You cannot post an unbalanced journal — the system blocks submission
            until total DR equals total CR. The balance indicator at the bottom
            of the form turns green when balanced.
          </p>
        </Section>

        {/* JOURNAL HEADER FIELDS */}
        <Section id="journal-header" title="Journal Header Fields">
          <p>
            Every journal has a header section that provides context about the
            entry. Here is what each field means:
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <FieldRow
                  name="Date"
                  required
                  description="The economic date of the event — not necessarily today. You can backdate journals (e.g. posting a trade that settled yesterday). The GL and Trial Balance always use this date, not the creation timestamp."
                />
                <FieldRow
                  name="Source Module"
                  required
                  description="Identifies what type of activity generated this journal. Options: Manual (hand-entered override), Trade (securities purchase/sale), Subscription (investor putting money in), Redemption (investor taking money out), NAV Adjustment (daily valuation entries), FX Revaluation (currency revaluation), Purification (AAOIFI haram income allocation), Management Fee (fee accruals), Payroll (staff salary entries). This tag is used for filtering and auditability — you can view all journals from a specific source."
                />
                <FieldRow
                  name="Fund ID"
                  description="The name or identifier of the fund this journal belongs to (e.g. 'Fund A', 'Ethica Equity Fund I'). Required when the posting relates to a specific fund. Leave blank for entity-level postings like payroll or overheads."
                />
                <FieldRow
                  name="Client ID"
                  description="The investor or client this journal relates to. Used for subscription, redemption, and client-specific ledger entries. Links the journal to a specific investor's account for reconciliation against the client subledger (GL 6101)."
                />
                <FieldRow
                  name="Entity ID"
                  description="The legal entity whose books are being posted. Ethica Capital may operate as both a fund manager (the company) and as fund trustee or operator. This field separates postings by entity so that each entity's P&L and balance sheet can be produced independently."
                />
                <FieldRow
                  name="Narration"
                  description="A free-text description of what the journal is for. Appears in the General Ledger alongside each entry. Keep it clear and specific — it is the primary human-readable explanation of every line in the books."
                />
              </tbody>
            </table>
          </div>
        </Section>

        {/* JOURNAL LINES */}
        <Section id="journal-lines" title="Journal Line Fields">
          <p>
            Each line in a journal represents one leg of the double-entry. A
            minimum of 2 lines is required, but you can add as many as needed.
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Field
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <FieldRow
                  name="Account"
                  required
                  description="The 10-digit account number for this leg. The first 4 digits must match a known COA group or sub-group — the system validates and shows the name in real-time as you type."
                />
                <FieldRow
                  name="DR / CR"
                  required
                  description="Whether this line is a debit (DR) or credit (CR). Each line must be one or the other — never both. In accounting convention: debits increase assets and expenses; credits increase liabilities, equity, and revenue."
                />
                <FieldRow
                  name="Amount"
                  required
                  description="The value of this leg. Must be greater than zero. Enter the amount in the chosen currency."
                />
                <FieldRow
                  name="Shari'ah Tag"
                  description="AAOIFI classification for this line: Halal (permissible income/expense), Haram (non-permissible income requiring purification), or Purification (the allocation entry for haram amounts). Used for Shari'ah compliance reporting and the purification reserve calculation. Leave blank if not applicable."
                />
                <FieldRow
                  name="Currency"
                  description="ISO 4217 currency code for this line (e.g. NGN, USD). Defaults to NGN. For foreign-currency lines, also provide the FX rate so the system knows the NGN equivalent for the GL and Trial Balance."
                />
              </tbody>
            </table>
          </div>
          <Note>
            The <strong>balance indicator</strong> at the bottom of the form
            shows your running DR and CR totals in real time. The Submit button
            is only enabled when the totals match. If you see a non-zero
            difference, find the line with the wrong side or wrong amount.
          </Note>
        </Section>

        {/* APPROVAL */}
        <Section id="approval" title="3. Approving a Journal">
          <p>
            All journals start as <strong>Pending</strong> when saved. A pending
            journal is visible in the Journal Entries list but does not yet
            affect the GL or Trial Balance. This is by design — it gives a
            second set of eyes before anything hits the books.
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-3 font-semibold text-gray-900">
                Who can approve?
              </p>
              <p className="text-gray-600">
                Only staff with the{" "}
                <strong>Finance Approve</strong> permission: CFO, MD, and Admin.
                Fund accountants can create journals but cannot self-approve.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-3 font-semibold text-gray-900">
                How to approve
              </p>
              <div className="space-y-3">
                <Step number={1} title="Go to Accounting">
                  Open the Journal Entries page from the sidebar.
                </Step>
                <Step number={2} title="Filter by Pending">
                  Click the{" "}
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Pending
                  </span>{" "}
                  filter to see only journals awaiting approval.
                </Step>
                <Step number={3} title='Click "Approve & Post"'>
                  Each pending journal row shows an Approve &amp; Post button on
                  the right. Click it once — the button changes to{" "}
                  <strong>Confirm Post</strong> as a safety step.
                </Step>
                <Step number={4} title="Confirm">
                  Click Confirm Post to finalise. The journal status changes to{" "}
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    Posted
                  </span>{" "}
                  and it is now live in the GL and Trial Balance.
                </Step>
              </div>
            </div>

            <Warning>
              Once posted, a journal <strong>cannot be deleted or modified</strong>.
              If you posted an incorrect entry, create a reversal journal with
              the same accounts and amounts but with DR and CR swapped.
            </Warning>
          </div>
        </Section>

        {/* HASH CHAIN */}
        <Section id="hash-chain" title="Cryptographic Hash Chain">
          <p>
            Every journal entry carries two hash fields — <span className="font-mono text-sm font-medium text-gray-800">Previous Hash</span> and{" "}
            <span className="font-mono text-sm font-medium text-gray-800">Current Hash</span> — visible at the bottom of any journal detail page
            under the <strong>Cryptographic Hash Chain</strong> panel.
            These are long strings of letters and numbers that may look
            unfamiliar, but they serve a critical audit and compliance purpose.
            No action is ever required from you — they are generated and
            verified automatically by the system.
          </p>

          <div className="mt-4 space-y-4">

            {/* What is a hash */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                What is a hash?
              </p>
              <p className="text-gray-600">
                A <strong>hash</strong> (specifically SHA-256, the same
                algorithm used in banking and Bitcoin) is a mathematical
                fingerprint. You feed it any piece of data — text, numbers, a
                whole document — and it produces a fixed 64-character string.
                The key properties are:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-1.5 text-gray-600">
                <li>
                  <strong>Deterministic</strong> — the same input always
                  produces the exact same output.
                </li>
                <li>
                  <strong>Unique</strong> — even a single character change
                  produces a completely different output. Changing{" "}
                  <span className="font-mono text-xs">₦10,000,000</span> to{" "}
                  <span className="font-mono text-xs">₦10,000,001</span>{" "}
                  produces a totally different hash.
                </li>
                <li>
                  <strong>One-way</strong> — you cannot reverse-engineer the
                  original data from the hash. It is a fingerprint, not an
                  encryption.
                </li>
              </ul>
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs">
                <p className="font-medium text-gray-500 mb-1">Example — SHA-256 of the word &quot;hello&quot;:</p>
                <p className="font-mono break-all text-gray-700">
                  2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
                </p>
              </div>
            </div>

            {/* How the chain works */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                How the chain works
              </p>
              <p className="text-gray-600">
                When a journal is <strong>created</strong>, the system hashes
                together the following pieces of its content:
              </p>
              <div className="mt-3 rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-700">
                <p>reference + date + sourceModule + narration</p>
                <p>+ all line accounts, amounts, currencies</p>
                <p>+ creation timestamp</p>
                <p>+ <span className="text-primary font-bold">previousHash</span> (the hash of the journal before this one)</p>
                <p className="mt-2 border-t border-dashed border-gray-300 pt-2 font-bold text-gray-900">
                  = currentHash (this journal&apos;s fingerprint)
                </p>
              </div>
              <p className="mt-3 text-gray-600">
                The result is stored as this journal&apos;s{" "}
                <span className="font-mono text-sm font-medium">currentHash</span>.
                The <em>next</em> journal to be created will then include{" "}
                <em>this</em> hash as its own{" "}
                <span className="font-mono text-sm font-medium">previousHash</span>.
                This creates an unbroken chain: each journal is mathematically
                locked to the one before it, all the way back to the very first
                entry.
              </p>
              {/* Visual chain */}
              <div className="mt-4 overflow-x-auto">
                <div className="flex min-w-[520px] items-center gap-2">
                  {[
                    { ref: "JNL-001", label: "First journal", note: "previousHash = \"genesis\"", color: "border-gray-300 bg-gray-50" },
                    { ref: "JNL-002", label: "Second journal", note: "previousHash = hash of JNL-001", color: "border-blue-200 bg-blue-50" },
                    { ref: "JNL-003", label: "Third journal", note: "previousHash = hash of JNL-002", color: "border-purple-200 bg-purple-50" },
                  ].map((node, i, arr) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`rounded-lg border p-3 text-center ${node.color}`} style={{ minWidth: 140 }}>
                        <p className="font-mono text-xs font-bold text-gray-800">{node.ref}</p>
                        <p className="mt-0.5 text-xs font-medium text-gray-700">{node.label}</p>
                        <p className="mt-1 text-xs text-gray-500 leading-tight">{node.note}</p>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="text-lg font-bold text-gray-300">→</span>
                      )}
                    </div>
                  ))}
                  <span className="text-lg font-bold text-gray-300">→ …</span>
                </div>
              </div>
            </div>

            {/* The genesis journal */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                The &quot;genesis&quot; entry
              </p>
              <p className="text-gray-600">
                The very first journal ever created has no predecessor, so its{" "}
                <span className="font-mono text-sm font-medium">previousHash</span>{" "}
                shows as <span className="font-mono text-sm font-medium text-gray-700">genesis (first journal)</span>.
                This is intentional and correct — it simply marks the
                starting point of the chain, similar to how a blockchain has
                a &quot;genesis block&quot;.
              </p>
            </div>

            {/* Why it matters */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Why it matters — tamper evidence
              </p>
              <p className="text-gray-600">
                The hash chain turns the journal ledger into a{" "}
                <strong>tamper-evident, append-only record</strong>. Here is
                what that means in practice:
              </p>
              <ul className="mt-3 list-inside list-disc space-y-2 text-gray-600">
                <li>
                  If anyone were to silently edit a historical journal — change
                  an amount, swap an account, alter a date — that journal&apos;s
                  content would no longer match its stored{" "}
                  <span className="font-mono text-sm font-medium">currentHash</span>.
                  The tampering is immediately detectable.
                </li>
                <li>
                  Because every subsequent journal contains the previous
                  journal&apos;s hash, a change to one old entry breaks the
                  chain for <em>every</em> journal that came after it. There
                  is no way to quietly patch history — every change propagates
                  a visible break.
                </li>
                <li>
                  This provides a cryptographic guarantee that the ledger you
                  see today is exactly the ledger that was posted at the time,
                  without any silent alterations.
                </li>
              </ul>
            </div>

            {/* What you see on the detail page */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                What you see on the journal detail page
              </p>
              <p className="text-gray-600">
                When you open any journal entry and expand the{" "}
                <strong>Cryptographic Hash Chain</strong> panel at the bottom,
                you will see:
              </p>
              <div className="mt-3 space-y-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Previous Hash</p>
                  <p className="font-mono text-xs break-all text-gray-600">
                    a3f5c2d8e1b047a9c3f62d1e5a8b0c4f2d7e9a1b3c5f7d2e4a6b8c0d1e3f5a7
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500">
                    The fingerprint of the journal immediately before this one.
                    Connecting this journal to the chain.
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Current Hash</p>
                  <p className="font-mono text-xs break-all text-gray-600">
                    9b2e4f7d1c6a3e8b0d5f2a9c4e7b1d3f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500">
                    This journal&apos;s own fingerprint. The next journal
                    will store this value as its <em>Previous Hash</em>.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-gray-600">
                These hashes are read-only. You never need to type, copy,
                or do anything with them — they are there for auditors,
                regulators, and the system&apos;s own integrity verification.
              </p>
            </div>

          </div>

          <Note>
            The hash chain satisfies the <strong>immutable ledger</strong>{" "}
            requirement under AAOIFI Governance Standard 6 (Audit and
            Internal Control) and provides a verifiable audit trail suitable
            for SEC Nigeria examination. Any discrepancy in the chain is
            immediately reportable evidence of record tampering.
          </Note>
        </Section>

        {/* GENERAL LEDGER */}
        <Section id="general-ledger" title="4. General Ledger">
          <p>
            The General Ledger shows you the full history of all posted
            transactions for any account, along with a running balance. Only{" "}
            <strong>posted</strong> journals appear here.
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Main view — Head Accounts
              </p>
              <p className="text-gray-600">
                The default GL view shows all <strong>head account groups</strong>{" "}
                (1000, 2000, 3000, etc.) with their current balances. You can
                filter by date range using the From/To date inputs at the top.
                A positive balance is a debit balance; a negative balance shown
                in <span className="font-mono">(parentheses)</span> is a credit
                balance.
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Drilling down into a head account
              </p>
              <p className="text-gray-600">
                Click any row to open the ledger detail for that account group.
                You will see:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-gray-600">
                <li>
                  <strong>Subledgers</strong> — each sub-account under that
                  group (e.g. 1001, 1002 under Assets). Click to expand and see
                  individual entries for that sub-account.
                </li>
                <li>
                  <strong>All Transactions</strong> — every posted journal line
                  touching any account in the group, ordered by date, with a
                  running balance.
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">
                Reading the running balance
              </p>
              <p className="text-gray-600">
                The running balance column cumulates as you go down the page.
                Positive = debit balance (normal for assets and expenses).
                Negative shown in red{" "}
                <span className="font-mono text-red-600">(50,000)</span> =
                credit balance (normal for liabilities, equity, and revenue).
                An unexpected sign may indicate a posting error worth
                investigating.
              </p>
            </div>
          </div>
        </Section>

        {/* TRIAL BALANCE */}
        <Section id="trial-balance" title="5. Trial Balance">
          <p>
            The Trial Balance is a point-in-time summary of every account
            balance in the system, as of a date you choose. It is the primary
            tool for confirming that the books are in balance.
          </p>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="mb-2 font-semibold text-gray-900">How to use it</p>
              <div className="space-y-3">
                <Step number={1} title='Select the "As of Date"'>
                  Pick any date from the date picker. The system will compute
                  balances using all posted journals with a transaction date on
                  or before that date.
                </Step>
                <Step number={2} title="Read by account type section">
                  Accounts are grouped by type: Assets, Liabilities, Equity,
                  Revenue, Expenses, Fund / Client Control, Suspense. Accounts
                  with a zero balance are hidden automatically.
                </Step>
                <Step number={3} title="Check the totals row">
                  The bottom row shows total debits and total credits. In a
                  correctly maintained set of books, these must be equal. If
                  they are not, a warning banner appears — this means there is
                  an unbalanced journal somewhere that needs investigating.
                </Step>
              </div>
            </div>

            <Note>
              The Trial Balance is computed on-demand every time you load the
              page. There is no cached version — backdated journals posted after
              you last looked are automatically included.
            </Note>
          </div>
        </Section>

        {/* PERMISSIONS */}
        <Section id="permissions" title="6. Roles & Permissions">
          <p>
            Access to the finance module is controlled by four permissions.
            Here is who has what:
          </p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Permission
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    What It Allows
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Who Has It
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  {
                    perm: "Finance View",
                    allows:
                      "View GL, Trial Balance, Chart of Accounts, and journal list",
                    who: "Admin, Fund Accountant, CFO, MD, Board Member, Overseer",
                  },
                  {
                    perm: "Finance Manage",
                    allows:
                      "Create new journal entries (saved as Pending)",
                    who: "Admin, Fund Accountant",
                  },
                  {
                    perm: "Finance COA Manage",
                    allows:
                      "Create and manage Chart of Account groups and sub-groups; designate the investment debit and credit accounts",
                    who: "Admin, Fund Accountant",
                  },
                  {
                    perm: "Finance Approve",
                    allows:
                      "Approve and post Pending journals to the GL; approve investments (which auto-posts the subscription journal)",
                    who: "Admin, CFO, MD",
                  },
                ].map((row) => (
                  <tr key={row.perm}>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {row.perm}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.allows}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {row.who}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-2 font-semibold text-gray-900">
              The segregation of duties
            </p>
            <p className="text-gray-600">
              The system is designed so that the person who{" "}
              <strong>creates</strong> a journal (Fund Accountant) is never the
              same person who <strong>approves</strong> it (CFO / MD / Admin).
              This four-eyes principle is enforced at the permission level and
              cannot be bypassed. The only exception is Admin, who holds both
              permissions — useful for testing and override scenarios.
            </p>
          </div>
        </Section>
      </main>
    </div>
  );
}
