import { NextResponse } from "next/server";
import { getFounderDirectory } from "@/lib/founders/store";
import type { CountryTier } from "@/lib/founders/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readListParam(searchParams: URLSearchParams, key: string): string[] {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const perCountryLimitParam = url.searchParams.get("perCountryLimit");
  const limit =
    limitParam && !Number.isNaN(Number(limitParam))
      ? Number(limitParam)
      : undefined;
  const perCountryLimit =
    perCountryLimitParam && !Number.isNaN(Number(perCountryLimitParam))
      ? Number(perCountryLimitParam)
      : undefined;
  const tiers = readListParam(url.searchParams, "tier")
    .map((value) => value.trim().toUpperCase())
    .filter((value): value is CountryTier => value === "TIER_1" || value === "TIER_2" || value === "TIER_3");

  const founders = await getFounderDirectory({
    limit,
    perCountryLimit,
    industry: readListParam(url.searchParams, "industry"),
    location: readListParam(url.searchParams, "location"),
    stage: readListParam(url.searchParams, "stage"),
    country: readListParam(url.searchParams, "country"),
    tier: tiers,
  });

  return NextResponse.json(
    { success: true, count: founders.length, founders },
    { status: 200 },
  );
}
