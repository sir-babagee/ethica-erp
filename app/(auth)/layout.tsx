"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    clearAuth();
    api
      .get("/api/auth/me")
      .then((res) => {
        const { staff, permissions } = res.data.data;
        setAuth(staff, permissions);
        if (staff.requiresPasswordChange && pathname !== "/u/change-password") {
          router.replace("/u/change-password");
        }
      })
      .catch(() => {
        // 401 will be handled by api interceptor (redirect to /)
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, [setAuth, clearAuth, pathname, router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
