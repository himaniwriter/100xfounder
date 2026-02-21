import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GLOBAL_SITE_SETTINGS, type GlobalSiteSettings } from "@/lib/site-settings";

const optionalHttpUrl = z.union([z.string().url(), z.literal("")]).optional();
const optionalPostgresUrl = z
  .union([z.string().regex(/^postgres(ql)?:\/\//i, "Must be a postgres URL"), z.literal("")])
  .optional();

const settingsSchema = z.object({
  headCode: z.string().optional(),
  bodyCode: z.string().optional(),
  defaultMetaTitle: z.string().optional(),
  defaultOgImageUrl: optionalHttpUrl,
  twitterHandle: z.string().optional(),
  editorialReviewSlaHours: z.string().optional(),
  correctionsResponseSlaHours: z.string().optional(),
  publishCadencePerDay: z.string().optional(),
  n8nPrimaryWebhookUrl: optionalHttpUrl,
  n8nBaseWebhookUrl: optionalHttpUrl,
  n8nNewsScraperWebhookUrl: optionalHttpUrl,
  n8nNewsletterWebhookUrl: optionalHttpUrl,
  n8nEnrichDataWebhookUrl: optionalHttpUrl,
  n8nFoundersSyncWebhookUrl: optionalHttpUrl,
  n8nClaimProfileWebhookUrl: optionalHttpUrl,
  n8nSecretKey: z.string().optional(),
  supabaseUrl: optionalHttpUrl,
  supabaseAnonKey: z.string().optional(),
  supabaseServiceRoleKey: z.string().optional(),
  supabaseDatabaseUrl: optionalPostgresUrl,
  supabaseProjectRef: z.string().optional(),
  supabaseStorageBucket: z.string().optional(),
  supabaseSchema: z.string().optional(),
});

type SensitiveSettingKey =
  | "n8nSecretKey"
  | "supabaseAnonKey"
  | "supabaseServiceRoleKey"
  | "supabaseDatabaseUrl";

const SENSITIVE_SETTING_KEYS: SensitiveSettingKey[] = [
  "n8nSecretKey",
  "supabaseAnonKey",
  "supabaseServiceRoleKey",
  "supabaseDatabaseUrl",
];

type PublicAdminSettings = Omit<GlobalSiteSettings, SensitiveSettingKey> & {
  n8nSecretKey: "";
  supabaseAnonKey: "";
  supabaseServiceRoleKey: "";
  supabaseDatabaseUrl: "";
  hasN8nSecretKey: boolean;
  hasSupabaseAnonKey: boolean;
  hasSupabaseServiceRoleKey: boolean;
  hasSupabaseDatabaseUrl: boolean;
};

async function ensureSiteSettingsTable() {
  await prisma.$executeRaw(
    Prisma.sql`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `,
  );
}

async function readCurrentSettings(): Promise<GlobalSiteSettings> {
  await ensureSiteSettingsTable();

  const rows = await prisma.$queryRaw<Array<{ value: Partial<GlobalSiteSettings> }>>(
    Prisma.sql`SELECT value FROM site_settings WHERE key = 'global' LIMIT 1`,
  );

  if (!rows[0]?.value) {
    return DEFAULT_GLOBAL_SITE_SETTINGS;
  }

  return {
    ...DEFAULT_GLOBAL_SITE_SETTINGS,
    ...rows[0].value,
  };
}

function toPublicSettings(settings: GlobalSiteSettings): PublicAdminSettings {
  return {
    ...settings,
    n8nSecretKey: "",
    supabaseAnonKey: "",
    supabaseServiceRoleKey: "",
    supabaseDatabaseUrl: "",
    hasN8nSecretKey: Boolean(settings.n8nSecretKey.trim()),
    hasSupabaseAnonKey: Boolean(settings.supabaseAnonKey.trim()),
    hasSupabaseServiceRoleKey: Boolean(settings.supabaseServiceRoleKey.trim()),
    hasSupabaseDatabaseUrl: Boolean(settings.supabaseDatabaseUrl.trim()),
  };
}

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const settings = await readCurrentSettings();

    return NextResponse.json({ success: true, settings: toPublicSettings(settings) });
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

  try {
    const currentSettings = await readCurrentSettings();
    const settings: GlobalSiteSettings = {
      ...DEFAULT_GLOBAL_SITE_SETTINGS,
      ...currentSettings,
    };

    Object.entries(parsed.data).forEach(([key, value]) => {
      if (typeof value !== "string") {
        return;
      }

      const typedKey = key as keyof GlobalSiteSettings;
      if (
        SENSITIVE_SETTING_KEYS.includes(typedKey as SensitiveSettingKey) &&
        value.trim().length === 0
      ) {
        return;
      }

      settings[typedKey] = value;
    });

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ('global', CAST(${JSON.stringify(settings)} AS jsonb), now())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = now();
      `,
    );

    return NextResponse.json({ success: true, settings: toPublicSettings(settings) });
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
