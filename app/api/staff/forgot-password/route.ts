import { NextRequest, NextResponse } from "next/server";
import serverAxios from "@/lib/serverAxios";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const response = await serverAxios.post("/staff/forgot-password", body);
    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    const err = error as {
      code?: string;
      response?: { status?: number; data?: unknown };
    };

    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return NextResponse.json(
        { message: "Service unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (err.response) {
      return NextResponse.json(err.response.data, {
        status: err.response.status ?? 400,
      });
    }

    return NextResponse.json({ message: "Request failed" }, { status: 500 });
  }
}
