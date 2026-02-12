import { prisma } from "@/lib/prisma";

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

export async function readGlobalSiteSettings(): Promise<GlobalSiteSettings> {
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ value: Partial<GlobalSiteSettings> }>>(
      "SELECT value FROM site_settings WHERE key = 'global' LIMIT 1",
    );

    if (!rows[0]?.value) {
      return DEFAULT_GLOBAL_SITE_SETTINGS;
    }

    return {
      ...DEFAULT_GLOBAL_SITE_SETTINGS,
      ...rows[0].value,
    };
  } catch {
    return DEFAULT_GLOBAL_SITE_SETTINGS;
  }
}
