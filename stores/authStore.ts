"use client";

import { create } from "zustand";
import type { Staff } from "@/types/auth";

type AuthState = {
  user: Staff | null;
  permissions: string[];
  enabledModules: string[];
  isAuthenticated: boolean;
  setAuth: (user: Staff, permissions: string[], enabledModules: string[]) => void;
  clearAuth: () => void;
  isModuleEnabled: (moduleId: string) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: [],
  enabledModules: [],
  isAuthenticated: false,
  setAuth: (user, permissions, enabledModules) =>
    set({ user, permissions, enabledModules, isAuthenticated: true }),
  clearAuth: () =>
    set({ user: null, permissions: [], enabledModules: [], isAuthenticated: false }),
  isModuleEnabled: (moduleId) => get().enabledModules.includes(moduleId),
}));
