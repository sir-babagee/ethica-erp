import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({ message: "Logout successful" });
  response.cookies.delete("authToken");
  return response;
}
