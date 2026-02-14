"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "./api";

export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post("/api/auth/login", credentials),
  });
};
