import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { searchSite } from "@/lib/search/service";

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  type: z.enum(["all", "founder", "company", "blog"]).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawLimit = url.searchParams.get("limit");

  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    type: url.searchParams.get("type") ?? undefined,
    limit: rawLimit ? Number(rawLimit) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid search query." },
      { status: 400 },
    );
  }

  const data = await searchSite({
    query: parsed.data.q,
    type: parsed.data.type ?? "all",
    limit: parsed.data.limit ?? 20,
  });

  return NextResponse.json(data, { status: 200 });
}
