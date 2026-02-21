import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/blog/blog-card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getCompanyNewsContext } from "@/lib/news/hubs";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

type CompanyNewsPageProps = {
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: CompanyNewsPageProps): Promise<Metadata> {
  const context = await getCompanyNewsContext(params.slug, 80);
  if (!context) {
    return { title: "Company News Not Found | 100Xfounder" };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/companies/${context.company.companySlug}/news`;
  return {
    title: `${context.company.companyName} News | 100Xfounder`,
    description: `Latest newsroom coverage mentioning ${context.company.companyName}, including funding, product, and leadership updates.`,
    alternates: { canonical },
  };
}

export default async function CompanyNewsPage({ params }: CompanyNewsPageProps) {
  const context = await getCompanyNewsContext(params.slug, 120);
  if (!context) {
    notFound();
  }

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/companies/${context.company.companySlug}/news`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.company.companyName} startup news`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Company", item: `${baseUrl}/company/${context.company.companySlug}` },
          { "@type": "ListItem", position: 3, name: "News", item: pageUrl },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Company News Hub</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {context.company.companyName} News
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Newsroom coverage tied to {context.company.companyName} and related founders.
            Use this feed with company profile data for full context.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/company/${context.company.companySlug}`}
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              View Company Profile
            </Link>
            {context.companyFounders.slice(0, 2).map((founder) => (
              <Link
                key={founder.id}
                href={`/founders/${founder.slug}`}
                className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
              >
                {founder.founderName}
              </Link>
            ))}
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-3">
            {context.items.length > 0 ? (
              context.items.map((post, index) => (
                <BlogCard key={post.slug} post={post} variant={index === 0 ? "hero" : "feed"} />
              ))
            ) : (
              <div className="rounded-xl border border-white/15 bg-white/[0.03] p-6 text-sm text-zinc-400">
                No company-specific stories found yet.
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Related Companies</p>
              <div className="mt-3 space-y-2">
                {context.relatedCompanies.length > 0 ? (
                  context.relatedCompanies.map((company) => (
                    <Link
                      key={company.id}
                      href={`/companies/${company.companySlug}/news`}
                      className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/30"
                    >
                      <p className="text-sm font-medium text-white">{company.companyName}</p>
                      <p className="mt-1 text-xs text-zinc-500">{company.industry}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No related companies available yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Related Topics</p>
              <div className="mt-3 space-y-2">
                {context.relatedTopics.map((topic) => (
                  <Link
                    key={topic.slug}
                    href={`/topics/${topic.slug}`}
                    className="block rounded-lg border border-white/10 bg-black/30 p-3 transition-colors hover:border-white/30"
                  >
                    <p className="text-sm font-medium text-white">{topic.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{topic.count} stories</p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
