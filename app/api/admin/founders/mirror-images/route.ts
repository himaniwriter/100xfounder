import { NextResponse, type NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { mirrorFounderDirectoryCompanyImages } from "@/lib/founders/store";

export const runtime = "nodejs";

function hasValidSetupKey(request: NextRequest): boolean {
  const expected = process.env.SETUP_KEY?.trim();
  if (!expected) {
    return false;
  }

  const queryKey = request.nextUrl.searchParams.get("key")?.trim();
  const headerKey = request.headers.get("x-setup-key")?.trim();
  return queryKey === expected || headerKey === expected;
}

export async function POST(request: NextRequest) {
  if (!hasValidSetupKey(request)) {
    const access = await requireAdminApi(request);
    if (access instanceof NextResponse) {
      return access;
    }
  }

  const limitRaw = request.nextUrl.searchParams.get("limit");
  const parsedLimit = limitRaw ? Number(limitRaw) : undefined;

  if (typeof parsedLimit !== "undefined" && (!Number.isFinite(parsedLimit) || parsedLimit <= 0)) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid limit parameter.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await mirrorFounderDirectoryCompanyImages({
      limit: parsedLimit,
    });
    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mirror company images.",
      },
      { status: 500 },
    );
  }
}
