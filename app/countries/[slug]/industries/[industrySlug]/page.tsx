import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCountryIndustryContext } from "@/lib/founders/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

type CountryIndustryPageProps = {
  params: {
    slug: string;
    industrySlug: string;
  };
};

export async function generateMetadata({ params }: CountryIndustryPageProps): Promise<Metadata> {
  const context = await getCountryIndustryContext(params.slug, params.industrySlug);
  if (!context) {
    return { title: "Country Industry Not Found | 100Xfounder" };
  }

  const canonical = `${getSiteBaseUrl()}/countries/${params.slug}/industries/${params.industrySlug}`;
  return {
    title: `${context.industry} Startups in ${context.country} | 100Xfounder`,
    description: `Explore ${context.industry} startups in ${context.country} with founder, funding, and hiring data.`,
    alternates: { canonical },
  };
}

export default async function CountryIndustryPage({ params }: CountryIndustryPageProps) {
  const context = await getCountryIndustryContext(params.slug, params.industrySlug);
  if (!context) {
    notFound();
  }

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/countries/${params.slug}/industries/${params.industrySlug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.industry} startups in ${context.country}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Countries", item: `${baseUrl}/countries` },
          { "@type": "ListItem", position: 3, name: context.country, item: `${baseUrl}/countries/${params.slug}` },
          { "@type": "ListItem", position: 4, name: context.industry, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Geo + Industry Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.industry} Startups in {context.country}
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            {context.companies.length} companies indexed with founder profiles, funding rounds, and hiring signals.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-zinc-400">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Founder</th>
                  <th className="px-4 py-3">Funding</th>
                  <th className="px-4 py-3">Last Round</th>
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
                      {item.lastRound ? `${item.lastRound.round} ${item.lastRound.amount}` : "Undisclosed"}
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
