import { NextRequest, NextResponse } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/serverAuth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Best-effort: notify the backend so the logout gets recorded in the
  // activity log. We never let this failure block the actual logout.
  try {
    await proxyAuthenticatedRequest(req, "/staff/logout", { method: "POST" });
  } catch {
    // Intentionally swallowed — cookie deletion must always succeed
  }

  const response = NextResponse.json({ message: "Logout successful" });
  response.cookies.delete("authToken");
  return response;
}
