import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isDatabaseConfigured } from "@/lib/db-config";
import { getCronSecret } from "@/lib/launch/config";
import { parseStages, runDailyGrowthPipeline } from "@/lib/launch/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) {
    return false;
  }
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; other schedulers can do the same.
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: false, error: "DATABASE_URL is not configured" }, { status: 503 });
  }

  const stages = parseStages(request.nextUrl.searchParams.get("stages"));
  const results = await runDailyGrowthPipeline(stages);
  return NextResponse.json({ success: results.every((result) => result.ok), results });
}

export const GET = handle;
export const POST = handle;
