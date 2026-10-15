import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { revalidateNewsroomPaths } from "@/lib/blog/revalidate";
import { WORDPRESS_CACHE_TAG } from "@/lib/wordpress/client";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.WORDPRESS_REVALIDATE_SECRET?.trim();
  const provided = request.headers.get("x-revalidate-secret") || "";
  if (!secret) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the 100xFounder Headless WordPress plugin whenever a post or page changes. */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { type?: string; slug?: string };
  const slug = typeof body.slug === "string" && /^[a-z0-9-]+$/i.test(body.slug) ? body.slug : undefined;

  revalidateTag(WORDPRESS_CACHE_TAG);
  if (body.type === "page") {
    if (slug) revalidatePath(`/pages/${slug}`);
  } else {
    revalidateNewsroomPaths(slug);
  }

  return NextResponse.json({ success: true, revalidated: { type: body.type ?? "post", slug: slug ?? null } });
}
