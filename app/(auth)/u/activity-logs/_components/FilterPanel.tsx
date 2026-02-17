"use client";

import SearchableSelect from "@/components/SearchableSelect";
import type { SelectOption, SelectGroup } from "@/components/SearchableSelect";
import type { Staff } from "@/types/auth";
import { ALL_ROLES, ACTION_GROUPS, ROLE_LABELS } from "./constants";

interface FilterPanelProps {
  staffRole: string;
  staffId: string;
  action: string;
  startDate: string;
  endDate: string;
  hasActiveFilters: boolean;
  staffList: Staff[] | undefined;
  onStaffRoleChange: (val: string) => void;
  onStaffIdChange: (val: string) => void;
  onActionChange: (val: string) => void;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onClearFilters: () => void;
}

export default function FilterPanel({
  staffRole,
  staffId,
  action,
  startDate,
  endDate,
  hasActiveFilters,
  staffList,
  onStaffRoleChange,
  onStaffIdChange,
  onActionChange,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
}: FilterPanelProps) {
  // When a role is active, only show staff of that role in the dropdown
  const staffForDropdown = staffList
    ? staffRole
      ? staffList.filter((s) => s.role === staffRole)
      : staffList
    : [];

  const roleOptions: SelectOption[] = ALL_ROLES.map(([value, label]) => ({
    value,
    label,
  }));

  const staffOptions: SelectOption[] = staffForDropdown.map((s) => ({
    value: s.id,
    label:
      `${s.firstName} ${s.lastName}` +
      (!staffRole ? ` (${ROLE_LABELS[s.role] ?? s.role})` : ""),
  }));

  const activityGroups: SelectGroup[] = ACTION_GROUPS.map((g) => ({
    label: g.label,
    options: g.actions,
  }));

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Role */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Role
          </label>
          <SearchableSelect
            options={roleOptions}
            value={staffRole}
            allLabel="All Roles"
            placeholder="All Roles"
            onChange={(val) => {
              onStaffRoleChange(val);
              // Clear specific staff if they no longer belong to the new role
              if (staffId && staffList) {
                const current = staffList.find((s) => s.id === staffId);
                if (current && current.role !== val) {
                  onStaffIdChange("");
                }
              }
            }}
          />
        </div>

        {/* Staff Member */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Staff Member
          </label>
          <SearchableSelect
            options={staffOptions}
            value={staffId}
            allLabel="All Staff"
            placeholder="All Staff"
            onChange={onStaffIdChange}
          />
        </div>

        {/* Activity */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Activity
          </label>
          <SearchableSelect
            groups={activityGroups}
            value={action}
            allLabel="All Activities"
            placeholder="All Activities"
            onChange={onActionChange}
          />
        </div>

        {/* From date */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            From
          </label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* To date */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            To
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
}
