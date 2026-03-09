"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationDrawer } from "@/components/NotificationDrawer";
import { useAuthStore } from "@/stores/authStore";
import { ROUTE_MODULE_MAP } from "@/constants/modules";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const enabledModules = useAuthStore((s) => s.enabledModules);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || enabledModules.length === 0) return;

    const disabledRoute = Object.entries(ROUTE_MODULE_MAP).find(
      ([prefix, moduleId]) =>
        pathname.startsWith(prefix) && !enabledModules.includes(moduleId),
    );

    if (disabledRoute) {
      router.replace("/u/dashboard");
    }
  }, [pathname, enabledModules, isAuthenticated, router]);

  const isChangePassword = pathname === "/u/change-password";

  if (isChangePassword) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col pl-64">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-end border-b border-gray-200 bg-white px-6">
          <NotificationDrawer />
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
