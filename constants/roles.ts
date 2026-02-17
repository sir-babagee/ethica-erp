export const ROLES = {
  ADMIN: "admin",
  CUSTOMER_SERVICE: "customer_service",
  FUND_ACCOUNTANT: "fund_accountant",
  COMPLIANCE_OFFICER: "compliance_officer",
  MD: "md",
  BOARD_MEMBER: "board_member",
} as const;

export const CREATABLE_ROLES = [
  { value: ROLES.CUSTOMER_SERVICE, label: "Customer Service" },
  { value: ROLES.FUND_ACCOUNTANT, label: "Fund Accountant" },
  { value: ROLES.COMPLIANCE_OFFICER, label: "Compliance Officer" },
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
} as const;

/**
 * Human-readable display labels for each role.
 * This is the single source of truth for role labels in the ERP.
 * Add new roles here when they are added to the backend.
 */
export const ROLE_LABELS: Record<string, string> = {
  [ROLES.ADMIN]: "Admin",
  [ROLES.CUSTOMER_SERVICE]: "Customer Service",
  [ROLES.FUND_ACCOUNTANT]: "Fund Accountant",
  [ROLES.COMPLIANCE_OFFICER]: "Compliance Officer",
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
