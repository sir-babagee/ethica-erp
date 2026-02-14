"use client";

import { create } from "zustand";
import type { Staff } from "@/types/auth";

type AuthState = {
  user: Staff | null;
  permissions: string[];
  isAuthenticated: boolean;
  setAuth: (user: Staff, permissions: string[]) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  permissions: [],
  isAuthenticated: false,
  setAuth: (user, permissions) =>
    set({ user, permissions, isAuthenticated: true }),
  clearAuth: () =>
    set({ user: null, permissions: [], isAuthenticated: false }),
}));
