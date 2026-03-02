import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { countryToSlug } from "@/lib/founders/country-tier";
import {
  getFoundersByIndustrySlug,
  getIndustryOptions,
  slugifySegment,
} from "@/lib/founders/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;
const HUB_STATIC_THRESHOLD = 15;
const STATIC_PARAMS_CAP = 5000;

type IndustryPageProps = {
  params: { slug: string };
};

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const options = await getIndustryOptions();
  return options
    .filter((item) => item.count >= HUB_STATIC_THRESHOLD)
    .slice(0, STATIC_PARAMS_CAP)
    .map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const context = await getFoundersByIndustrySlug(params.slug);
  if (!context) {
    return { title: "Industry Not Found | 100Xfounder" };
  }

  const canonical = `${getSiteBaseUrl()}/industries/${params.slug}`;
  return {
    title: `Top ${context.label} Startups | 100Xfounder`,
    description: `Explore ${context.label} startups with founders, funding rounds, and hiring signals.`,
    alternates: { canonical },
    robots:
      context.companies.length < HUB_STATIC_THRESHOLD
        ? {
            index: false,
            follow: true,
          }
        : undefined,
  };
}

export default async function IndustryPage({ params }: IndustryPageProps) {
  const context = await getFoundersByIndustrySlug(params.slug);
  if (!context) {
    notFound();
  }

  const topCountries = Array.from(
    context.companies.reduce((acc, item) => {
      const key = item.country || "Unknown";
      acc.set(key, (acc.get(key) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topStages = Array.from(
    context.companies.reduce((acc, item) => {
      const key = item.stage || "Unknown";
      acc.set(key, (acc.get(key) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const baseUrl = getSiteBaseUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/industries/${params.slug}#webpage`,
        url: `${baseUrl}/industries/${params.slug}`,
        name: `${context.label} startup directory`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Industries", item: `${baseUrl}/industries` },
          { "@type": "ListItem", position: 3, name: context.label, item: `${baseUrl}/industries/${params.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Industry Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.label} Startups
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            {context.companies.length} companies indexed with founder context, funding rounds, and hiring signals.
          </p>
        </header>

        <PillarCrosslinks
          context={{
            industry: context.label,
            stage: context.companies[0]?.stage,
            country: context.companies[0]?.country,
          }}
          includeGlobal
          maxLinks={8}
          title="Related Industry Routes"
          description="Explore matching startup taxonomy, stage hubs, and country routes linked to this industry."
          className="mt-6"
        />

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-xl font-semibold text-white">
            {context.label} market intelligence summary
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            This industry page is designed for users who need more than a static company list.
            The directory groups <strong>{context.label}</strong> startups with founder, funding,
            and hiring context so you can compare execution quality across similar business models.
            This makes it easier to understand whether movement in this sector is broad-based or
            concentrated in a few outlier companies.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            For deeper research, pair this page with
            <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
              {" funding round hubs"}
            </Link>
            , 
            <Link href="/countries" className="text-indigo-300 hover:text-indigo-200">
              {" country coverage"}
            </Link>
            , and
            <Link href={`/startups/industry/${params.slug}`} className="text-indigo-300 hover:text-indigo-200">
              {" startup industry taxonomy"}
            </Link>
            . This route helps reduce noise and speeds up market screening.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
                Top geographies
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {topCountries.map(([country, count]) => (
                  <Link
                    key={country}
                    href={country === "Unknown" ? "/countries" : `/countries/${countryToSlug(country)}`}
                    className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                  >
                    {country} ({count})
                  </Link>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
                Stage concentration
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {topStages.map(([stage, count]) => (
                  <Link
                    key={stage}
                    href={`/stages/${slugifySegment(stage)}`}
                    className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                  >
                    {stage} ({count})
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Founder</th>
                  <th className="px-4 py-3">Funding</th>
                  <th className="px-4 py-3">Hiring</th>
                </tr>
              </thead>
              <tbody>
                {context.companies.slice(0, 500).map((item) => (
                  <tr key={item.id} className="border-b border-white/10 last:border-0">
                    <td className="px-4 py-3 text-zinc-100">
                      <Link href={`/company/${item.companySlug}`} className="hover:text-white">
                        {item.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <Link href={`/founders/${item.slug}`} className="hover:text-white">
                        {item.founderName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.fundingTotalDisplay ?? item.fundingInfo ?? "Undisclosed"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.isHiring ? (item.hiringRoles?.slice(0, 2).join(", ") || "Hiring now") : "No active signal"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <Footer />
    </main>
  );
}
