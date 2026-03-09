import type { ComponentType } from "react";
import { PERMISSIONS } from "@/constants/roles";
import { FEATURE_MODULES, type FeatureModuleId } from "@/constants/modules";
import {
  DashboardIcon,
  TransactionsIcon,
  UsersIcon,
  UserGroupIcon,
  UserPlusIcon,
  ActivityLogsIcon,
  ErrorLogsIcon,
  RateGuideIcon,
  PortfolioAssetsIcon,
  ChartOfAccountsIcon,
  AccountingIcon,
  LedgerIcon,
  TrialBalanceIcon,
  AuditIcon,
  FundsIcon,
  BranchIcon,
  FinanceGuideIcon,
  RolesIcon,
} from "@/components/icons/sidebar-icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permissions?: readonly string[];
  /** When true, this item is only visible to users whose role is 'admin'. */
  adminOnly?: boolean;
  /** Feature module this item belongs to. Hidden when the module is disabled. */
  module?: FeatureModuleId;
};

export type NavGroup = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  items: NavItem[];
  /** Feature module this entire group belongs to. Hidden when disabled. */
  module?: FeatureModuleId;
};

export const navGroups: NavGroup[] = [
  {
    id: "core",
    label: "Core",
    icon: DashboardIcon,
    items: [
      { href: "/u/dashboard", label: "Dashboard", icon: DashboardIcon },
      { href: "/u/customers", label: "Customers", icon: UsersIcon, module: FEATURE_MODULES.CUSTOMERS },
    ],
  },
  {
    id: "investments",
    label: "Investments",
    icon: TransactionsIcon,
    module: FEATURE_MODULES.INVESTMENTS,
    items: [
      { href: "/u/transactions", label: "Transactions", icon: TransactionsIcon, permissions: [PERMISSIONS.INVESTMENTS_VIEW] },
      { href: "/u/rate-guide", label: "Rate Guide", icon: RateGuideIcon, permissions: [PERMISSIONS.RATE_GUIDE_VIEW, PERMISSIONS.RATE_GUIDE_MANAGE] },
      { href: "/u/portfolio-assets", label: "Portfolio Assets", icon: PortfolioAssetsIcon, permissions: [PERMISSIONS.PORTFOLIO_ASSETS_VIEW, PERMISSIONS.PORTFOLIO_ASSETS_MANAGE] },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: LedgerIcon,
    module: FEATURE_MODULES.FINANCE,
    items: [
      { href: "/u/finance/chart-of-accounts", label: "Chart of Accounts", icon: ChartOfAccountsIcon, permissions: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_COA_MANAGE] },
      { href: "/u/finance/funds", label: "Funds", icon: FundsIcon, adminOnly: true },
      { href: "/u/finance/accounting-transactions", label: "Entries", icon: AccountingIcon, permissions: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_COA_MANAGE] },
      { href: "/u/finance/gl", label: "General Ledger", icon: LedgerIcon, permissions: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_COA_MANAGE] },
      { href: "/u/finance/trial-balance", label: "Trial Balance", icon: TrialBalanceIcon, permissions: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE, PERMISSIONS.FINANCE_COA_MANAGE] },
      { href: "/u/finance/docs", label: "Finance Guide", icon: FinanceGuideIcon, permissions: [PERMISSIONS.FINANCE_VIEW] },
      { href: "/u/finance/audit", label: "Ledger Audit", icon: AuditIcon, permissions: [PERMISSIONS.FINANCE_VIEW] },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: UserGroupIcon,
    items: [
      { href: "/u/staff", label: "Staff", icon: UserGroupIcon, permissions: [PERMISSIONS.STAFF_CREATE] },
      { href: "/u/staff/add", label: "Add Staff", icon: UserPlusIcon, permissions: [PERMISSIONS.STAFF_CREATE] },
      { href: "/u/branches", label: "Branches", icon: BranchIcon, permissions: [PERMISSIONS.STAFF_CREATE] },
      { href: "/u/roles", label: "Roles & Permissions", icon: RolesIcon, permissions: [PERMISSIONS.ROLES_MANAGE] },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: ActivityLogsIcon,
    items: [
      { href: "/u/activity-logs", label: "Activity Logs", icon: ActivityLogsIcon, permissions: [PERMISSIONS.ACTIVITY_LOGS_VIEW] },
      { href: "/u/error-logs", label: "Error Logs", icon: ErrorLogsIcon, permissions: [PERMISSIONS.ERROR_LOGS_VIEW] },
    ],
  },
];
