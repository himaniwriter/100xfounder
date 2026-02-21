import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getPublishedNews } from "@/lib/news/service";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters." },
      { status: 400 },
    );
  }

  try {
    const items = await getPublishedNews(parsed.data.limit ?? 20);
    return NextResponse.json({
      success: true,
      count: items.length,
      items,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load latest news.",
      },
      { status: 500 },
    );
  }
}
