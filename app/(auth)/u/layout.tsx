"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { NotificationDrawer } from "@/components/NotificationDrawer";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
