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
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [authChecked, setAuthChecked] = useState(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.requiresPasswordChange && pathname !== "/u/change-password") {
        router.replace("/u/change-password");
      }
      setAuthChecked(true);
      return;
    }

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
        // 401 is handled by the api interceptor (redirects to /)
      })
      .finally(() => {
        setAuthChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
