export const ROLES = {
  ADMIN: "admin",
  CUSTOMER_SERVICE: "customer_service",
  FUND_ACCOUNTANT: "fund_accountant",
  COMPLIANCE_OFFICER: "compliance_officer",
} as const;

export const CREATABLE_ROLES = [
  { value: ROLES.CUSTOMER_SERVICE, label: "Customer Service" },
  { value: ROLES.FUND_ACCOUNTANT, label: "Fund Accountant" },
  { value: ROLES.COMPLIANCE_OFFICER, label: "Compliance Officer" },
] as const;

export const PERMISSIONS = {
  STAFF_CREATE: "staff:create",
  ONBOARDING_VIEW: "onboarding:view",
  ONBOARDING_APPROVE: "onboarding:approve",
  ONBOARDING_REJECT: "onboarding:reject",
  CUSTOMERS_VIEW: "customers:view",
} as const;
