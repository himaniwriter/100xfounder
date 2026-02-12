import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  headCode: z.string().optional().default(""),
  bodyCode: z.string().optional().default(""),
  defaultMetaTitle: z.string().optional().default(""),
  defaultOgImageUrl: z.string().optional().default(""),
  twitterHandle: z.string().optional().default(""),
});

type SettingsValue = {
  headCode: string;
  bodyCode: string;
  defaultMetaTitle: string;
  defaultOgImageUrl: string;
  twitterHandle: string;
};

const DEFAULT_SETTINGS: SettingsValue = {
  headCode: "",
  bodyCode: "",
  defaultMetaTitle: "100Xfounder | Indian Founder Intelligence",
  defaultOgImageUrl: "",
  twitterHandle: "@100xfounder",
};

async function ensureSiteSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    await ensureSiteSettingsTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ value: SettingsValue }>>(
      "SELECT value FROM site_settings WHERE key = 'global' LIMIT 1",
    );

    const settings = rows[0]?.value
      ? { ...DEFAULT_SETTINGS, ...rows[0].value }
      : DEFAULT_SETTINGS;

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load site settings.",
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

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid settings payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const settings = { ...DEFAULT_SETTINGS, ...parsed.data };

  try {
    await ensureSiteSettingsTable();
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ('global', $1::jsonb, now())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = now();
      `,
      JSON.stringify(settings),
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save site settings.",
      },
      { status: 500 },
    );
  }
}
