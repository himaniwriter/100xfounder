import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  readHomepageContent,
  writeHomepageContent,
} from "@/lib/content/homepage-content";

const homepageContentSchema = z.object({
  heroTitle: z.string().min(10).optional(),
  heroSubtitle: z.string().min(20).optional(),
  primaryCtaLabel: z.string().min(2).optional(),
  primaryCtaHref: z.string().min(1).optional(),
  secondaryCtaLabel: z.string().min(2).optional(),
  secondaryCtaHref: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const content = await readHomepageContent();
  return NextResponse.json({ success: true, content });
}

export async function PUT(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = homepageContentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid homepage content payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const content = await writeHomepageContent(parsed.data);
  return NextResponse.json({ success: true, content });
}
