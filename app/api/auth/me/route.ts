import { NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  return proxyAuthenticatedRequest(req, "/staff/me", { method: "GET" });
}
