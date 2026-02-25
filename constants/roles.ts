export const ROLES = {
  ADMIN: "admin",
  OVERSEER: "overseer",
  CUSTOMER_SERVICE: "customer_service",
  FUND_ACCOUNTANT: "fund_accountant",
  PORTFOLIO_MANAGER: "portfolio_manager",
  COMPLIANCE_OFFICER: "compliance_officer",
  CFO: "cfo",
  MD: "md",
  BOARD_MEMBER: "board_member",
} as const;

export const CREATABLE_ROLES = [
  { value: ROLES.OVERSEER, label: "Overseer" },
  { value: ROLES.CUSTOMER_SERVICE, label: "Customer Service" },
  { value: ROLES.FUND_ACCOUNTANT, label: "Fund Accountant" },
  { value: ROLES.PORTFOLIO_MANAGER, label: "Portfolio Manager" },
  { value: ROLES.COMPLIANCE_OFFICER, label: "Compliance Officer" },
  { value: ROLES.CFO, label: "Chief Financial Officer" },
  { value: ROLES.MD, label: "MD" },
  { value: ROLES.BOARD_MEMBER, label: "Board Member" },
] as const;

/** Escalation chain - ordered from lowest to highest tier.
 * Used to determine which roles can be escalated to. */
export const ESCALATION_CHAIN = [
  ROLES.CUSTOMER_SERVICE,
  ROLES.COMPLIANCE_OFFICER,
  ROLES.MD,
  ROLES.BOARD_MEMBER,
] as const;

const ESCALATION_ROLE_LABELS: Record<string, string> = {
  [ROLES.CUSTOMER_SERVICE]: "Customer Service",
  [ROLES.COMPLIANCE_OFFICER]: "Compliance Officer",
  [ROLES.MD]: "MD",
  [ROLES.BOARD_MEMBER]: "Board Member",
};

/** Get all roles higher than the given role in the escalation chain. */
export function getHigherEscalationTiers(currentRole: string): { value: string; label: string }[] {
  const idx = ESCALATION_CHAIN.indexOf(currentRole as (typeof ESCALATION_CHAIN)[number]);
  if (idx < 0 || idx >= ESCALATION_CHAIN.length - 1) return [];
  return ESCALATION_CHAIN.slice(idx + 1).map((role) => ({
    value: role,
    label: ESCALATION_ROLE_LABELS[role] ?? role.replace(/_/g, " "),
  }));
}

export const PERMISSIONS = {
  STAFF_CREATE: "staff:create",
  ONBOARDING_VIEW: "onboarding:view",
  ONBOARDING_APPROVE: "onboarding:approve",
  ONBOARDING_REJECT: "onboarding:reject",
  CUSTOMERS_VIEW: "customers:view",
  ACTIVITY_LOGS_VIEW: "activity_logs:view",
  INVESTMENTS_VIEW: "investments:view",
  INVESTMENTS_CREATE: "investments:create",
  INVESTMENTS_APPROVE: "investments:approve",
  RATE_GUIDE_VIEW: "rate_guide:view",
  RATE_GUIDE_MANAGE: "rate_guide:manage",
  PORTFOLIO_ASSETS_VIEW: "portfolio_assets:view",
  PORTFOLIO_ASSETS_MANAGE: "portfolio_assets:manage",
  FINANCE_VIEW: "finance:view",
  FINANCE_MANAGE: "finance:manage",
  FINANCE_COA_MANAGE: "finance:coa_manage",
} as const;

/**
 * Human-readable display labels for each role.
 * This is the single source of truth for role labels in the ERP.
 * Add new roles here when they are added to the backend.
 */
export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.OVERSEER]: "Overseer",
  [ROLES.CUSTOMER_SERVICE]: "Customer Service",
  [ROLES.FUND_ACCOUNTANT]: "Fund Accountant",
  [ROLES.PORTFOLIO_MANAGER]: "Portfolio Manager",
  [ROLES.COMPLIANCE_OFFICER]: "Compliance Officer",
  [ROLES.CFO]: "Chief Financial Officer",
  [ROLES.MD]: "MD",
  [ROLES.BOARD_MEMBER]: "Board Member",
};

/**
 * All non-admin roles as [value, label] pairs — useful for filter dropdowns
 * and staff creation forms.
 */
export const ALL_ROLES = Object.entries(ROLE_LABELS).filter(
  ([value]) => value !== ROLES.ADMIN
);
