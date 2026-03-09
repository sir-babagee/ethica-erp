/**
 * Feature module identifiers — must match the backend FEATURE_MODULES values.
 * Used for sidebar filtering, route protection, and conditional UI rendering.
 */
export const FEATURE_MODULES = {
  CUSTOMERS: "customers",
  INVESTMENTS: "investments",
  FINANCE: "finance",
  ANALYTICS: "analytics",
} as const;

export type FeatureModuleId =
  (typeof FEATURE_MODULES)[keyof typeof FEATURE_MODULES];

/**
 * Maps URL path prefixes to the module they belong to.
 * Used by middleware to block navigation to disabled modules.
 */
export const ROUTE_MODULE_MAP: Record<string, FeatureModuleId> = {
  "/u/customers": FEATURE_MODULES.CUSTOMERS,
  "/u/transactions": FEATURE_MODULES.INVESTMENTS,
  "/u/rate-guide": FEATURE_MODULES.INVESTMENTS,
  "/u/portfolio-assets": FEATURE_MODULES.INVESTMENTS,
  "/u/finance": FEATURE_MODULES.FINANCE,
};
