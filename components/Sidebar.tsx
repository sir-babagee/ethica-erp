"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { ADMIN_ROLE } from "@/constants/roles";
import {
  UserIcon,
  LogoutIcon,
  SettingsIcon,
  ChevronDownIcon,
} from "@/components/icons/sidebar-icons";
import { navGroups } from "@/components/sidebar-routes";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const permissions = useAuthStore((s) => s.permissions);

  const isSystemAdmin = user?.role === ADMIN_ROLE;

  const filteredGroups = useMemo(
    () =>
      navGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            // Admin-only items are hidden from everyone except admin
            if (item.adminOnly) return isSystemAdmin;
            // System admin bypasses all other permission checks
            if (isSystemAdmin) return true;
            if (item.permissions && item.permissions.length > 0) {
              return item.permissions.some((p) => permissions.includes(p));
            }
            return true;
          }),
        }))
        .filter((group) => group.items.length > 0),
    [permissions, isSystemAdmin]
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const group = filteredGroups.find((g) =>
      g.items.some(
        (item) =>
          pathname === item.href ||
          (pathname.startsWith(`${item.href}/`) &&
            !g.items.some((o) => o.href !== item.href && pathname === o.href))
      )
    );
    if (group) setExpandedId(group.id);
  }, [pathname, filteredGroups]);

  const toggleGroup = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <Image
            src="/logo.png"
            alt="Ethica Capital"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <h1 className="font-semibold text-gray-900">Ethica Capital</h1>
            <p className="text-xs text-gray-500">ERP Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedId === group.id;
            const GroupIcon = group.icon;
            return (
              <div
                key={group.id}
                className={`rounded-lg transition-colors duration-200 ${
                  isExpanded ? "bg-gray-50/60" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                      <GroupIcon className="h-5 w-5" />
                    </span>
                    <span className="truncate">{group.label}</span>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="space-y-0.5 border-l-2 border-gray-100 pl-3 pt-1 pb-2 ml-6">
                      {group.items.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (pathname.startsWith(`${item.href}/`) &&
                            !group.items.some(
                              (o) => o.href !== item.href && pathname === o.href
                            ));
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {user?.role ? user.role.replace(/_/g, " ") : ""}
              </span>
              {user?.staffId && (
                <span className="font-mono text-xs text-gray-400">
                  {user.staffId}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-0.5">
            <Link
              href="/u/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <UserIcon className="h-5 w-5" />
              Profile
            </Link>
            <Link
              href="/u/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <SettingsIcon className="h-5 w-5" />
              Settings
            </Link>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                useAuthStore.getState().clearAuth();
                window.location.href = "/";
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <LogoutIcon className="h-5 w-5" />
              Log out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
