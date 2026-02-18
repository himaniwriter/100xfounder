import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getFounderDirectory, getFounderDirectoryLastUpdatedAt } from "@/lib/founders/store";

const querySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const limitRaw = request.nextUrl.searchParams.get("limit");
  const parsed = querySchema.safeParse({
    limit: limitRaw ? Number(limitRaw) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid limit parameter." },
      { status: 400 },
    );
  }

  const limit = parsed.data.limit ?? 25;
  const founders = await getFounderDirectory({ perCountryLimit: 500, limit: 1000 });
  const updatedAt = await getFounderDirectoryLastUpdatedAt();

  const items = founders
    .filter(
      (item) =>
        Boolean(item.lastRound) ||
        Boolean(item.fundingInfo) ||
        item.isHiring === true,
    )
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      companyName: item.companyName,
      founderName: item.founderName,
      companySlug: item.companySlug,
      founderSlug: item.slug,
      industry: item.industry,
      stage: item.stage,
      country: item.country ?? "Unknown",
      fundingTotal: item.fundingTotalDisplay ?? item.fundingInfo ?? "Undisclosed",
      lastRound: item.lastRound
        ? `${item.lastRound.round} ${item.lastRound.amount}`
        : "Undisclosed",
      isHiring: item.isHiring ?? false,
      hiringRoles: item.hiringRoles ?? [],
    }));

  return NextResponse.json(
    {
      success: true,
      updatedAt: updatedAt.toISOString(),
      items,
    },
    { status: 200 },
  );
}
