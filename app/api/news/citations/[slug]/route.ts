import { NextResponse, type NextRequest } from "next/server";
import { getNewsCitationsBySlug } from "@/lib/news/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: { slug: string } },
) {
  try {
    const result = await getNewsCitationsBySlug(context.params.slug);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "News article not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load citations.",
      },
      { status: 500 },
    );
  }
}
