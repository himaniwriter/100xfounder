import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import {
  deleteRedirectRuleById,
  normalizeRedirectSourcePath,
  normalizeRedirectTargetUrl,
  updateRedirectRuleById,
} from "@/lib/url-redirects";

const idSchema = z.object({
  id: z.string().uuid(),
});

const patchSchema = z
  .object({
    source_path: z.string().trim().min(1).max(240).optional(),
    target_url: z.string().trim().min(1).max(600).optional(),
    is_active: z.boolean().optional(),
    note: z.string().trim().max(400).optional().nullable(),
  })
  .refine(
    (value) =>
      value.source_path !== undefined ||
      value.target_url !== undefined ||
      value.is_active !== undefined ||
      value.note !== undefined,
    {
      message: "At least one field is required.",
    },
  );

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const parsedId = idSchema.safeParse(params);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid redirect id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid redirect update payload." },
      { status: 400 },
    );
  }

  try {
    const rule = await updateRedirectRuleById(parsedId.data.id, {
      sourcePath:
        parsed.data.source_path !== undefined
          ? normalizeRedirectSourcePath(parsed.data.source_path)
          : undefined,
      targetUrl:
        parsed.data.target_url !== undefined
          ? normalizeRedirectTargetUrl(parsed.data.target_url)
          : undefined,
      isActive: parsed.data.is_active,
      note: parsed.data.note,
    });

    if (!rule) {
      return NextResponse.json(
        { success: false, error: "Redirect rule not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, rule }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to update redirect rule."),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const parsedId = idSchema.safeParse(params);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid redirect id." }, { status: 400 });
  }

  try {
    const deleted = await deleteRedirectRuleById(parsedId.data.id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Redirect rule not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to delete redirect rule."),
      },
      { status: 500 },
    );
  }
}
