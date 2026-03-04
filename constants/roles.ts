/**
 * Reserved slug for the system admin role. This value is hardcoded because
 * the admin role is immutable — it cannot be renamed or deleted.
 */
export const ADMIN_ROLE = "admin" as const;

export const PERMISSIONS = {
  STAFF_CREATE: "staff:create",
  ONBOARDING_VIEW: "onboarding:view",
  ONBOARDING_APPROVE: "onboarding:approve",
  ONBOARDING_REJECT: "onboarding:reject",
  CUSTOMERS_VIEW: "customers:view",
  ACTIVITY_LOGS_VIEW: "activity_logs:view",
  ERROR_LOGS_VIEW: "error_logs:view",
  INVESTMENTS_VIEW: "investments:view",
  /** Assigned to roles that may only see their own investment entries. */
  INVESTMENTS_VIEW_OWN: "investments:view_own",
  INVESTMENTS_CREATE: "investments:create",
  INVESTMENTS_APPROVE: "investments:approve",
  RATE_GUIDE_VIEW: "rate_guide:view",
  RATE_GUIDE_MANAGE: "rate_guide:manage",
  PORTFOLIO_ASSETS_VIEW: "portfolio_assets:view",
  PORTFOLIO_ASSETS_MANAGE: "portfolio_assets:manage",
  FINANCE_VIEW: "finance:view",
  FINANCE_MANAGE: "finance:manage",
  FINANCE_COA_MANAGE: "finance:coa_manage",
  FINANCE_APPROVE: "finance:approve",
  ROLES_MANAGE: "roles:manage",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * All permissions grouped by functional area — used in the roles management UI
 * to render the permission assignment matrix.
 */
export const PERMISSION_GROUPS = [
  {
    label: "Staff Management",
    permissions: [
      { key: PERMISSIONS.STAFF_CREATE, label: "Create & Manage Staff" },
    ],
  },
  {
    label: "Customer Onboarding",
    permissions: [
      { key: PERMISSIONS.CUSTOMERS_VIEW, label: "View Customers" },
      { key: PERMISSIONS.ONBOARDING_VIEW, label: "View Onboarding Applications" },
      { key: PERMISSIONS.ONBOARDING_APPROVE, label: "Approve Onboarding Applications" },
      { key: PERMISSIONS.ONBOARDING_REJECT, label: "Reject Onboarding Applications" },
    ],
  },
  {
    label: "Investments",
    permissions: [
      { key: PERMISSIONS.INVESTMENTS_VIEW, label: "View All Investments" },
      { key: PERMISSIONS.INVESTMENTS_VIEW_OWN, label: "View Own Investments Only" },
      { key: PERMISSIONS.INVESTMENTS_CREATE, label: "Create Investment Entries" },
      { key: PERMISSIONS.INVESTMENTS_APPROVE, label: "Approve / Reject Investments" },
    ],
  },
  {
    label: "Rate Guide",
    permissions: [
      { key: PERMISSIONS.RATE_GUIDE_VIEW, label: "View Rate Guide" },
      { key: PERMISSIONS.RATE_GUIDE_MANAGE, label: "Manage Rate Guide" },
    ],
  },
  {
    label: "Portfolio Assets",
    permissions: [
      { key: PERMISSIONS.PORTFOLIO_ASSETS_VIEW, label: "View Portfolio Assets" },
      { key: PERMISSIONS.PORTFOLIO_ASSETS_MANAGE, label: "Manage Portfolio Assets" },
    ],
  },
  {
    label: "Finance",
    permissions: [
      { key: PERMISSIONS.FINANCE_VIEW, label: "View Finance" },
      { key: PERMISSIONS.FINANCE_MANAGE, label: "Manage Journal Entries" },
      { key: PERMISSIONS.FINANCE_COA_MANAGE, label: "Manage Chart of Accounts & Funds" },
      { key: PERMISSIONS.FINANCE_APPROVE, label: "Approve & Post Entries" },
    ],
  },
  {
    label: "System",
    permissions: [
      { key: PERMISSIONS.ACTIVITY_LOGS_VIEW, label: "View Activity Logs" },
      { key: PERMISSIONS.ERROR_LOGS_VIEW, label: "View Error Logs" },
      { key: PERMISSIONS.ROLES_MANAGE, label: "Manage Roles & Permissions" },
    ],
  },
] as const;
