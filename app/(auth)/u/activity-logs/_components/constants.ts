// ROLE_LABELS and ALL_ROLES live in @/constants/roles — the single source
// of truth for role display labels across the entire ERP.
export { ROLE_LABELS, ALL_ROLES } from "@/constants/roles";

export const LIMIT = 20;

export const ACTION_GROUPS = [
  {
    label: "Authentication",
    actions: [
      { value: "login", label: "Login" },
      { value: "logout", label: "Logout" },
      { value: "auto_logout", label: "Auto Logout" },
    ],
  },
  {
    label: "Customer Management",
    actions: [
      { value: "approve_customer", label: "Approved Customer" },
      { value: "reject_customer", label: "Rejected Customer" },
      { value: "escalate_customer", label: "Escalated Customer" },
      { value: "approve_corporate_customer", label: "Approved Corporate" },
      { value: "reject_corporate_customer", label: "Rejected Corporate" },
      { value: "escalate_corporate_customer", label: "Escalated Corporate" },
    ],
  },
  {
    label: "Staff Management",
    actions: [
      { value: "create_staff", label: "Created Staff" },
      { value: "password_changed", label: "Changed Password" },
    ],
  },
  {
    label: "Rate Guide Management",
    actions: [
      { value: "create_rate_guide", label: "Created Rate Guide" },
      { value: "update_rate_guide", label: "Updated Rate Guide" },
      { value: "delete_rate_guide", label: "Deleted Rate Guide" },
      { value: "bulk_replace_rate_guide", label: "Bulk Replaced Rate Guide" },
    ],
  },
  {
    label: "Investment Management",
    actions: [
      { value: "create_investment", label: "Created Investment" },
      { value: "approve_investment", label: "Approved Investment" },
      { value: "reject_investment", label: "Rejected Investment" },
    ],
  },
  {
    label: "Portfolio Asset Management",
    actions: [
      { value: "create_portfolio_asset", label: "Created Portfolio Asset" },
      { value: "update_portfolio_asset", label: "Updated Portfolio Asset" },
      { value: "delete_portfolio_asset", label: "Deleted Portfolio Asset" },
    ],
  },
];

export const ACTION_LABELS: Record<string, string> = ACTION_GROUPS.flatMap(
  (g) => g.actions
).reduce(
  (acc, a) => ({ ...acc, [a.value]: a.label }),
  {} as Record<string, string>
);

export const ACTION_STYLES: Record<string, string> = {
  login: "bg-sky-100 text-sky-800",
  logout: "bg-gray-100 text-gray-700",
  auto_logout: "bg-amber-100 text-amber-800",
  approve_customer: "bg-emerald-100 text-emerald-800",
  reject_customer: "bg-red-100 text-red-800",
  escalate_customer: "bg-blue-100 text-blue-800",
  approve_corporate_customer: "bg-emerald-100 text-emerald-800",
  reject_corporate_customer: "bg-red-100 text-red-800",
  escalate_corporate_customer: "bg-blue-100 text-blue-800",
  create_staff: "bg-purple-100 text-purple-800",
  password_changed: "bg-slate-100 text-slate-700",
  create_rate_guide: "bg-teal-100 text-teal-800",
  update_rate_guide: "bg-teal-100 text-teal-800",
  delete_rate_guide: "bg-red-100 text-red-800",
  bulk_replace_rate_guide: "bg-teal-100 text-teal-800",
  create_investment: "bg-indigo-100 text-indigo-800",
  approve_investment: "bg-emerald-100 text-emerald-800",
  reject_investment: "bg-red-100 text-red-800",
  create_portfolio_asset: "bg-violet-100 text-violet-800",
  update_portfolio_asset: "bg-violet-100 text-violet-800",
  delete_portfolio_asset: "bg-red-100 text-red-800",
};
