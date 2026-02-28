import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import {
  listRedirectRules,
  normalizeRedirectSourcePath,
  normalizeRedirectTargetUrl,
  upsertRedirectRule,
} from "@/lib/url-redirects";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  path: z.string().trim().max(240).optional(),
});

const createSchema = z.object({
  source_path: z.string().trim().min(1).max(240),
  target_url: z.string().trim().min(1).max(600),
  is_active: z.boolean().optional(),
  note: z.string().trim().max(400).optional().nullable(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const parsed = querySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    path: request.nextUrl.searchParams.get("path") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters." },
      { status: 400 },
    );
  }

  try {
    const redirects = await listRedirectRules({
      limit: parsed.data.limit ?? 200,
      pathContains: parsed.data.path,
    });
    return NextResponse.json({ success: true, redirects }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to load redirect rules."),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid redirect payload." },
      { status: 400 },
    );
  }

  try {
    const rule = await upsertRedirectRule({
      sourcePath: normalizeRedirectSourcePath(parsed.data.source_path),
      targetUrl: normalizeRedirectTargetUrl(parsed.data.target_url),
      isActive: parsed.data.is_active ?? true,
      note: parsed.data.note ?? null,
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: "Failed to save redirect rule." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, rule }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save redirect rule."),
      },
      { status: 500 },
    );
  }
}
