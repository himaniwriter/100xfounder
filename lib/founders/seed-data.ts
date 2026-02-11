import pdfSeed from "@/lib/founders/pdf-seed.json";
import { WIKI_Eponymous_SEED } from "@/lib/founders/wiki-seed";
import type { FounderDirectoryItem } from "@/lib/founders/types";

export const PDF_SOURCE_URL =
  "EmpiricalListofGroupCompanieswithGIN_withoutPAN-20231103.pdf";

const combined = [
  ...(pdfSeed as unknown as FounderDirectoryItem[]),
  ...WIKI_Eponymous_SEED,
];

const uniqueBySlug = new Map<string, FounderDirectoryItem>();

for (const item of combined) {
  if (!uniqueBySlug.has(item.slug)) {
    uniqueBySlug.set(item.slug, item);
  }
}

export const PDF_FOUNDER_SEED = Array.from(uniqueBySlug.values());
