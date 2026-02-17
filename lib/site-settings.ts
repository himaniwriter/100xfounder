import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-config";

export type GlobalSiteSettings = {
  headCode: string;
  bodyCode: string;
  defaultMetaTitle: string;
  defaultOgImageUrl: string;
  twitterHandle: string;
  n8nPrimaryWebhookUrl: string;
  n8nBaseWebhookUrl: string;
  n8nNewsScraperWebhookUrl: string;
  n8nNewsletterWebhookUrl: string;
  n8nEnrichDataWebhookUrl: string;
  n8nClaimProfileWebhookUrl: string;
  n8nSecretKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  supabaseDatabaseUrl: string;
  supabaseProjectRef: string;
  supabaseStorageBucket: string;
  supabaseSchema: string;
};

export const DEFAULT_GLOBAL_SITE_SETTINGS: GlobalSiteSettings = {
  headCode: "",
  bodyCode: "",
  defaultMetaTitle: "100Xfounder | Indian Founder Intelligence",
  defaultOgImageUrl: "",
  twitterHandle: "@100xfounder",
  n8nPrimaryWebhookUrl: "",
  n8nBaseWebhookUrl: "",
  n8nNewsScraperWebhookUrl: "",
  n8nNewsletterWebhookUrl: "",
  n8nEnrichDataWebhookUrl: "",
  n8nClaimProfileWebhookUrl: "",
  n8nSecretKey: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  supabaseDatabaseUrl: "",
  supabaseProjectRef: "",
  supabaseStorageBucket: "images",
  supabaseSchema: "public",
};

const SITE_SETTINGS_FILE_PATH = path.join(
  process.cwd(),
  "lib/content/site-settings.local.json",
);

async function readGlobalSiteSettingsFromDisk(): Promise<GlobalSiteSettings> {
  try {
    const raw = await fs.readFile(SITE_SETTINGS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<GlobalSiteSettings>;
    return {
      ...DEFAULT_GLOBAL_SITE_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_GLOBAL_SITE_SETTINGS;
  }
}

export async function writeGlobalSiteSettingsToFile(
  settings: GlobalSiteSettings,
): Promise<void> {
  const normalized = {
    ...DEFAULT_GLOBAL_SITE_SETTINGS,
    ...settings,
  };
  await fs.mkdir(path.dirname(SITE_SETTINGS_FILE_PATH), { recursive: true });
  await fs.writeFile(
    SITE_SETTINGS_FILE_PATH,
    JSON.stringify(normalized, null, 2),
    "utf-8",
  );
}

export async function readGlobalSiteSettingsFromFile(): Promise<GlobalSiteSettings> {
  return readGlobalSiteSettingsFromDisk();
}

export async function readGlobalSiteSettings(): Promise<GlobalSiteSettings> {
  if (!isDatabaseConfigured()) {
    return readGlobalSiteSettingsFromDisk();
  }

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ value: Partial<GlobalSiteSettings> }>>(
      "SELECT value FROM site_settings WHERE key = 'global' LIMIT 1",
    );

    const fromFile = await readGlobalSiteSettingsFromDisk();
    if (!rows[0]?.value) {
      return fromFile;
    }

    return {
      ...fromFile,
      ...rows[0].value,
    };
  } catch {
    return readGlobalSiteSettingsFromDisk();
  }
}
