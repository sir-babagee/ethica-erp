"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { useLogin } from "@/lib/auth";
import { useAuthStore } from "@/stores/authStore";

export default function StaffLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: loginMutation, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation(
      { email, password },
      {
        onSuccess: (res) => {
          const { staff, permissions } = res.data;
          setAuth(staff, permissions);
          toast.success("Login successful");
          if (staff.requiresPasswordChange) {
            if (typeof window !== "undefined") {
              sessionStorage.setItem("tempPasswordForChange", password);
            }
            router.push("/u/change-password");
          } else {
            router.push("/u/dashboard");
          }
        },
        onError: (error) => {
          const message =
            axios.isAxiosError(error) && error.response?.data?.message
              ? error.response.data.message
              : "Invalid email or password";
          toast.error(message);
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-primary via-primary/95 to-primary/90">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(254,170,54,0.15)_0%,transparent_50%,rgba(160,77,3,0.2)_100%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Image
              src="/logo.png"
              alt="Ethica Capital"
              width={120}
              height={120}
              className="object-contain drop-shadow-lg"
            />
            <h1 className="mt-8 text-3xl font-bold tracking-tight">
              Ethica Capital ERP
            </h1>
            <p className="mt-3 text-lg text-white/90 max-w-sm">
              Staff portal for managing operations, investments, and customer onboarding.
            </p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/90">
              Shariah-compliant investment management. Secure, transparent, and professionally managed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-gray-50">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="Ethica Capital"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Staff Sign In</h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter your credentials to access the ERP portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@ethicacapital.com"
                className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <a
                href="#"
                className="text-sm font-medium text-primary hover:text-primary/90 focus:outline-none focus:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">
            Authorized personnel only. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
