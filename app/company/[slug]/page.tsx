import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { GatedValue } from "@/components/ui/gated-value";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getFounderDirectory, toCompanySlug } from "@/lib/founders/store";

type CompanyPageProps = {
  params: { slug: string };
};

async function getCompanyContext(slug: string) {
  const all = await getFounderDirectory();
  const matches = all.filter((item) => item.companySlug === slug);
  if (matches.length === 0) {
    return null;
  }

  const primary = matches[0];
  const similar = all
    .filter(
      (item) =>
        item.companySlug !== slug &&
        item.industry === primary.industry,
    )
    .slice(0, 6);

  return { all, primary, matches, similar };
}

export async function generateMetadata({ params }: CompanyPageProps): Promise<Metadata> {
  const context = await getCompanyContext(params.slug);

  if (!context) {
    return {
      title: "Company Not Found | 100Xfounder",
    };
  }

  const { primary } = context;

  return {
    title: `${primary.companyName} - Founder, Funding & Signals | 100Xfounder`,
    description: `View ${primary.companyName}'s profile on 100Xfounder. Track their growth signals, tech stack, and founder ${primary.founderName}. Unlock verified contact details.`,
  };
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const context = await getCompanyContext(params.slug);
  if (!context) notFound();

  const { primary, matches, similar } = context;
  const session = await getSessionFromCookies();
  const unlocked = Boolean(session);

  const compareTargets = similar.slice(0, 2);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: primary.companyName,
    url: primary.websiteUrl ?? undefined,
    founder: {
      "@type": "Person",
      name: primary.founderName,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: primary.headquarters ?? "Unknown",
      addressCountry: "IN",
    },
    sameAs: [primary.linkedinUrl, primary.twitterUrl].filter(Boolean),
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-4 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">Home</Link>
          <span className="px-2">&gt;</span>
          <Link href="/founders" className="hover:text-zinc-300">Directory</Link>
          <span className="px-2">&gt;</span>
          <Link href={`/founders?industry=${encodeURIComponent(primary.industry)}`} className="hover:text-zinc-300">
            {primary.industry}
          </Link>
          <span className="px-2">&gt;</span>
          <span className="text-zinc-300">{primary.companyName}</span>
        </nav>

        <header className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {primary.companyName}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">{primary.productSummary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">{primary.industry}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">{primary.headquarters ?? "India"}</span>
            <span className="rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-300">{primary.stage}</span>
            {primary.foundedYear ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">Founded {primary.foundedYear}</span>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-zinc-400">
            Founded by{" "}
            <Link href={`/founder/${primary.slug}`} className="text-indigo-300 hover:text-indigo-200">
              {primary.founderName}
            </Link>
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-400">Growth Signals</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Website</dt>
                <dd>
                  {primary.websiteUrl ? (
                    <a href={primary.websiteUrl} target="_blank" rel="nofollow noreferrer" className="text-indigo-300 hover:text-indigo-200">
                      {primary.websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-zinc-300">Not available</span>
                  )}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Headquarters</dt>
                <dd className="text-zinc-300">{primary.headquarters ?? "Not available"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Employee Count</dt>
                <dd className="text-zinc-300">{primary.employeeCount ?? "Not available"}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Tech Stack</dt>
                <dd className="text-zinc-300 text-right">{primary.techStack.join(", ")}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-400">Pro Signals (Members)</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Direct Email</dt>
                <dd>
                  <GatedValue
                    unlocked={unlocked}
                    blurredPreview="r****@company.com"
                    actualValue={null}
                    ctaLabel="Unlock Contact Info"
                  />
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Phone</dt>
                <dd>
                  <GatedValue
                    unlocked={unlocked}
                    blurredPreview="+91 98*******"
                    actualValue={null}
                    ctaLabel="Unlock Contact Info"
                  />
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Growth Rate</dt>
                <dd>
                  <GatedValue
                    unlocked={unlocked}
                    blurredPreview="📈 Top 5%"
                    actualValue="📈 Top 5%"
                    ctaLabel="Upgrade to View"
                  />
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-zinc-500">Investor Deck</dt>
                <dd>
                  <GatedValue
                    unlocked={unlocked}
                    blurredPreview="🔒 Restricted Access"
                    actualValue="Restricted access. Contact admin."
                    ctaLabel="Upgrade to View"
                  />
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 className="text-lg font-medium text-white">About {primary.companyName}</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            {primary.companyName} is featured in the 100Xfounder directory as part of our continuously updated company intelligence index.
            This profile tracks founder context, sector footprint, and growth signals relevant for investors, operators, and sales teams researching {primary.industry.toLowerCase()} opportunities.
          </p>

          <h3 className="mt-5 text-sm font-medium text-zinc-200">Recent News</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
            {primary.recentNews.slice(0, 3).map((news) => (
              <li key={news}>{news}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-medium text-white">More {primary.industry} Companies{primary.headquarters ? ` in ${primary.headquarters}` : ""}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <Link
                key={item.id}
                href={`/company/${item.companySlug}`}
                className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20"
              >
                <p className="text-sm font-medium text-white">{item.companyName}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.founderName}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <h2 className="text-lg font-medium text-white">Compare</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {compareTargets.map((item) => (
              <Link
                key={item.id}
                href={`/compare/${primary.companySlug}-vs-${item.companySlug}`}
                className="rounded-md border border-[#6366f1]/30 bg-[#6366f1]/10 px-3 py-1.5 text-xs text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
              >
                {primary.companyName} vs {item.companyName}
              </Link>
            ))}
          </div>
        </section>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <Footer />
    </main>
  );
}
