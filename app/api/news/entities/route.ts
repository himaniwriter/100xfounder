import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getEntityNews, type NewsEntityType } from "@/lib/news/service";

const querySchema = z.object({
  type: z.enum(["topic", "company", "founder"]),
  slug: z.string().min(2).max(160),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    type: request.nextUrl.searchParams.get("type") ?? undefined,
    slug: request.nextUrl.searchParams.get("slug") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid entity query parameters." },
      { status: 400 },
    );
  }

  try {
    const { entityLabel, items } = await getEntityNews(
      parsed.data.type as NewsEntityType,
      parsed.data.slug,
      parsed.data.limit ?? 30,
    );

    return NextResponse.json({
      success: true,
      type: parsed.data.type,
      slug: parsed.data.slug,
      entityLabel,
      count: items.length,
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load entity news.",
      },
      { status: 500 },
    );
  }
}
