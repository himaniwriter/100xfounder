import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { StartupsClient } from "./startups-client";
import {
  getFounderDirectory,
  getFounderDirectoryLastUpdatedAt,
} from "@/lib/founders/store";

function normalize(value: string | null | undefined): string {
  if (!value) return "";
  return value.toLowerCase();
}

function includesAny(source: string, values: string[]): boolean {
  return values.some((value) => source.includes(value.toLowerCase()));
}

export default async function StartupsPage() {
  const founders = await getFounderDirectory({ perCountryLimit: 500, limit: 1500 });
  const updatedAt = await getFounderDirectoryLastUpdatedAt();

  const cityKeywords: Record<string, string[]> = {
    Delhi: ["delhi", "new delhi", "gurgaon", "gurugram", "noida"],
    Bangalore: ["bangalore", "bengaluru"],
    Mumbai: ["mumbai"],
    "San Francisco": ["san francisco", "sf bay area"],
    "New York": ["new york"],
    Austin: ["austin"],
  };

  const cityStats = Object.fromEntries(
    Object.entries(cityKeywords).map(([city, keywords]) => {
      const companySlugs = new Set(
        founders
          .filter((item) => includesAny(normalize(item.headquarters), keywords))
          .map((item) => item.companySlug),
      );
      return [city, companySlugs.size];
    }),
  );

  const collectionStats = {
    soonicorns: new Set(
      founders
        .filter((item) => /series b|series c|series d/i.test(item.stage))
        .map((item) => item.companySlug),
    ).size,
    genaiIndia: new Set(
      founders
        .filter(
          (item) =>
            /india/i.test(item.country ?? "") &&
            /ai|artificial intelligence|llm|gen ai/i.test(
              `${item.industry} ${item.productSummary}`,
            ),
        )
        .map((item) => item.companySlug),
    ).size,
    b2bSaas: new Set(
      founders
        .filter((item) =>
          /saas/i.test(item.industry) ||
          /b2b|enterprise software|workflow/i.test(item.productSummary),
        )
        .map((item) => item.companySlug),
    ).size,
    usAiInfrastructure: new Set(
      founders
        .filter(
          (item) =>
            /united states/i.test(item.country ?? "") &&
            /ai infrastructure|model|inference|ai/i.test(
              `${item.industry} ${item.productSummary}`,
            ),
        )
        .map((item) => item.companySlug),
    ).size,
    usFintech: new Set(
      founders
        .filter(
          (item) =>
            /united states/i.test(item.country ?? "") &&
            /fintech|payments|lending|banking/i.test(
              `${item.industry} ${item.productSummary}`,
            ),
        )
        .map((item) => item.companySlug),
    ).size,
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupsClient
        cityStats={cityStats}
        collectionStats={collectionStats}
        updatedAt={updatedAt.toISOString()}
      />
      <Footer />
    </main>
  );
}
