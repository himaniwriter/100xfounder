import { NextRequest, NextResponse } from "next/server";
import { getInstagramFeed } from "@/lib/outreach/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || "6");
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 6;

  const items = await getInstagramFeed(limit);

  return NextResponse.json({
    success: true,
    updatedAt: new Date().toISOString(),
    items,
  });
}
