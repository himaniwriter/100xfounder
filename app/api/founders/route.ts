import { NextResponse } from "next/server";
import { getFounderDirectory } from "@/lib/founders/store";

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
  const limit =
    limitParam && !Number.isNaN(Number(limitParam))
      ? Number(limitParam)
      : undefined;

  const founders = await getFounderDirectory({
    limit,
    industry: readListParam(url.searchParams, "industry"),
    location: readListParam(url.searchParams, "location"),
    stage: readListParam(url.searchParams, "stage"),
  });

  return NextResponse.json(
    { success: true, count: founders.length, founders },
    { status: 200 },
  );
}
