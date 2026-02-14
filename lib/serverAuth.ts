import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import serverAxios from "./serverAxios";
import type { LoginCredentials } from "@/types/auth";

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  maxAge: number;
  path: string;
};

export async function setAuthCookie(
  response: NextResponse,
  token: string
): Promise<void> {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600,
    path: "/",
  };

  response.cookies.set("authToken", token, cookieOptions);
}

export function getAuthTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get("authToken")?.value ?? null;
}

export async function authenticate(
  credentials: LoginCredentials,
  endpoint: string
) {
  const response = await serverAxios.post(endpoint, credentials);
  return response.data;
}

export async function proxyAuthenticatedRequest(
  req: NextRequest,
  externalPath: string,
  options: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    data?: unknown;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  } = { method: "GET" }
): Promise<NextResponse> {
  const token = getAuthTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await serverAxios({
      url: externalPath,
      method: options.method,
      data: options.data,
      params: options.params,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    const err = error as { response?: { status?: number; data?: { message?: string } } };
    if (err.response?.status === 401) {
      const res = NextResponse.json(
        { error: "Token expired" },
        { status: 401 }
      );
      res.cookies.delete("authToken");
      return res;
    }
    return NextResponse.json(
      {
        error: err,
        message: err.response?.data?.message ?? "Request failed",
      },
      { status: err.response?.status ?? 500 }
    );
  }
}
