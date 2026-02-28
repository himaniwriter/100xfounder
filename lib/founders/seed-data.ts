import pdfSeed from "@/lib/founders/pdf-seed.json";
import { GROWTHLIST_US_SEED } from "@/lib/founders/growthlist-us-seed";
import { RECENT_FUNDED_SEED } from "@/lib/founders/recent-funded-seed";
import { SOURCE_A_SEED } from "@/lib/founders/source-a-seed";
import { WIKI_Eponymous_SEED } from "@/lib/founders/wiki-seed";
import type { FounderDirectoryItem } from "@/lib/founders/types";

export const PDF_SOURCE_URL =
  "EmpiricalListofGroupCompanieswithGIN_withoutPAN-20231103.pdf";

const normalizedPdf = (pdfSeed as unknown as Array<Record<string, unknown>>).map(
  (item) => {
    const companyName = String(item.companyName ?? "");
    const companySlug =
      typeof item.companySlug === "string" && item.companySlug
        ? item.companySlug
        : companyName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");

    return {
      ...item,
      companySlug,
      websiteUrl:
        typeof item.websiteUrl === "string" ? item.websiteUrl : null,
      employeeCount:
        typeof item.employeeCount === "string" ? item.employeeCount : null,
      techStack: Array.isArray(item.techStack)
        ? item.techStack.filter((value): value is string => typeof value === "string")
        : [],
      recentNews: Array.isArray(item.recentNews)
        ? item.recentNews.filter((value): value is string => typeof value === "string")
        : [],
      linkedinUrl:
        typeof item.linkedinUrl === "string" ? item.linkedinUrl : null,
      twitterUrl: typeof item.twitterUrl === "string" ? item.twitterUrl : null,
    } as FounderDirectoryItem;
  },
);

const combined = [
  ...RECENT_FUNDED_SEED,
  ...GROWTHLIST_US_SEED,
  ...SOURCE_A_SEED,
  ...normalizedPdf,
  ...WIKI_Eponymous_SEED,
];

const uniqueBySlug = new Map<string, FounderDirectoryItem>();

for (const item of combined) {
  if (!uniqueBySlug.has(item.slug)) {
    uniqueBySlug.set(item.slug, item);
  }
}

export const PDF_FOUNDER_SEED = Array.from(uniqueBySlug.values());
