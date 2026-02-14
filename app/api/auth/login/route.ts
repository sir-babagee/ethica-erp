import { NextRequest, NextResponse } from "next/server";
import { authenticate, setAuthCookie } from "@/lib/serverAuth";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const credentials = await req.json();
    const authResponse = await authenticate(credentials, "/staff/login");

    const { staff, permissions, token } = authResponse.data;

    const response = NextResponse.json({
      message: "Login successful",
      staff,
      permissions,
    });

    await setAuthCookie(response, token);
    return response;
  } catch (error: unknown) {
    const err = error as {
      code?: string;
      response?: { status?: number; data?: { message?: string } };
    };

    if (err.code === "ECONNREFUSED") {
      return NextResponse.json(
        { error: "Backend server is not running. Please start your API server." },
        { status: 503 }
      );
    }

    if (err.response) {
      return NextResponse.json(
        {
          error:
            err.response.data?.message ??
            err.response.data ??
            "Authentication failed",
        },
        { status: err.response.status ?? 400 }
      );
    }

    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 400 }
    );
  }
}
