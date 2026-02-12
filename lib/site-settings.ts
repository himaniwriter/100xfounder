import { prisma } from "@/lib/prisma";

export type GlobalSiteSettings = {
  headCode: string;
  bodyCode: string;
  defaultMetaTitle: string;
  defaultOgImageUrl: string;
  twitterHandle: string;
};

export const DEFAULT_GLOBAL_SITE_SETTINGS: GlobalSiteSettings = {
  headCode: "",
  bodyCode: "",
  defaultMetaTitle: "100Xfounder | Indian Founder Intelligence",
  defaultOgImageUrl: "",
  twitterHandle: "@100xfounder",
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
