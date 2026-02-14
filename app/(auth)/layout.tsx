"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    api
      .get("/api/auth/me")
      .then((res) => {
        const { staff, permissions } = res.data.data;
        setAuth(staff, permissions);
      })
      .catch(() => {
        // 401 will be handled by api interceptor (redirect to /)
      });
  }, [setAuth]);

  return <>{children}</>;
}
