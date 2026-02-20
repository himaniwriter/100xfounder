import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSignalsFeed } from "@/lib/signals/feed";

const querySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
});

export const runtime = "nodejs";

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
  const { items, updatedAt } = await getSignalsFeed(limit);

  return NextResponse.json(
    {
      success: true,
      updatedAt,
      items,
    },
    { status: 200 },
  );
}
