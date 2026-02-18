import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import { countryTierLabel } from "@/lib/founders/country-tier";
import { getCountryCoverage, getFounderDirectory } from "@/lib/founders/store";

type CountryPageProps = {
  params: {
    slug: string;
  };
};

async function getCountryContext(slug: string) {
  const coverage = await getCountryCoverage();
  const target = coverage.find((item) => item.countrySlug === slug);

  if (!target) {
    return null;
  }

  const founders = await getFounderDirectory({
    country: [target.country],
    perCountryLimit: 500,
    limit: 500,
  });

  const byCompany = new Map<string, (typeof founders)[number]>();
  founders.forEach((item) => {
    if (!byCompany.has(item.companySlug)) {
      byCompany.set(item.companySlug, item);
    }
  });

  return {
    country: target,
    founders,
    companies: Array.from(byCompany.values()).slice(0, 500),
  };
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const context = await getCountryContext(params.slug);
  if (!context) {
    return {
      title: "Country Not Found | 100Xfounder",
    };
  }

  const { country } = context;
  const canonical = `${getSiteBaseUrl()}/countries/${country.countrySlug}`;

  return {
    title: `Top 500 Startups in ${country.country} | ${countryTierLabel(country.tier)} | 100Xfounder`,
    description:
      `Research top funded startups in ${country.country} with founder details, funding rounds, last round updates, and hiring roles.`,
    alternates: {
      canonical,
    },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const context = await getCountryContext(params.slug);
  if (!context) {
    notFound();
  }

  const { country, companies } = context;
  const baseUrl = getSiteBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/countries/${country.countrySlug}#webpage`,
        url: `${baseUrl}/countries/${country.countrySlug}`,
        name: `Top startups in ${country.country}`,
        description: `Top startup companies in ${country.country} with funding and hiring coverage.`,
      },
      {
        "@type": "ItemList",
        name: `Top companies in ${country.country}`,
        numberOfItems: companies.length,
        itemListElement: companies.slice(0, 100).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.companyName,
          url: `${baseUrl}/company/${item.companySlug}`,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
            {countryTierLabel(country.tier)} ecosystem
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Top 500 Companies in {country.country}
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Single-source market intelligence for founders and operators in {country.country}: company profiles,
            founder links, funding totals, last round updates, full round history, and hiring signals.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {country.companyCount} companies indexed
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {country.fundedCompanies} with funding data
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {country.hiringCompanies} hiring companies
            </span>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-xl font-semibold text-white">Company Directory</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Ordered by funding and growth signals, capped at 500 companies for this country.
          </p>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-black/25">
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
                {companies.map((item) => (
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
                      {item.lastRound
                        ? `${item.lastRound.round} ${item.lastRound.amount}`
                        : "Undisclosed"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {item.isHiring
                        ? item.hiringRoles && item.hiringRoles.length > 0
                          ? item.hiringRoles.slice(0, 2).join(", ")
                          : "Yes"
                        : "No"}
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
