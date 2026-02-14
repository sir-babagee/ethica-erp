import { NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/serverAuth";

function getQueryParams(req: NextRequest): Record<string, string> {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const externalPath = `/${path.join("/")}`;
  const queryParams = getQueryParams(req);

  return proxyAuthenticatedRequest(req, externalPath, {
    method: "GET",
    params: queryParams,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const externalPath = `/${path.join("/")}`;
  const queryParams = getQueryParams(req);

  let body: unknown;
  try {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await req.json();
    } else {
      body = undefined;
    }
  } catch {
    body = undefined;
  }

  return proxyAuthenticatedRequest(req, externalPath, {
    method: "POST",
    data: body,
    params: queryParams,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const externalPath = `/${path.join("/")}`;
  const queryParams = getQueryParams(req);

  let body: unknown;
  try {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await req.json();
    } else {
      body = undefined;
    }
  } catch {
    body = undefined;
  }

  return proxyAuthenticatedRequest(req, externalPath, {
    method: "PUT",
    data: body,
    params: queryParams,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const externalPath = `/${path.join("/")}`;
  const queryParams = getQueryParams(req);

  let body: unknown;
  try {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      body = await req.json();
    } else {
      body = undefined;
    }
  } catch {
    body = undefined;
  }

  return proxyAuthenticatedRequest(req, externalPath, {
    method: "PATCH",
    data: body,
    params: queryParams,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const externalPath = `/${path.join("/")}`;
  const queryParams = getQueryParams(req);

  return proxyAuthenticatedRequest(req, externalPath, {
    method: "DELETE",
    params: queryParams,
  });
}
