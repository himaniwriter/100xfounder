import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProfileFaqSection } from "@/components/seo/profile-faq-section";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ProfileTabs } from "@/components/founders/profile-tabs";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { GetFeaturedCtaCard } from "@/components/shared/get-featured-cta-card";
import { CompanyLogo } from "@/components/ui/company-logo";
import { FounderAvatar } from "@/components/ui/founder-avatar";
import { countryToSlug } from "@/lib/founders/country-tier";
import { slugifySegment } from "@/lib/founders/hubs";
import {
  getFounderDirectory,
  getFounderDirectoryLastUpdatedAt,
} from "@/lib/founders/store";
import {
  buildFounderFaqs,
  buildFounderProfileSchema,
} from "@/lib/seo/profile-seo";
import { getUserSubmittedExternalRel } from "@/lib/seo/external-links";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

type FounderProfilePageProps = {
  params: {
    slug: string;
  };
};

async function getFounderBySlug(slug: string) {
  const founders = await getFounderDirectory();
  return founders.find((item) => item.slug === slug) ?? null;
}

export async function generateMetadata({ params }: FounderProfilePageProps): Promise<Metadata> {
  const founder = await getFounderBySlug(params.slug);
  if (!founder) {
    return { title: "Founder Not Found | 100Xfounder" };
  }

  const baseUrl = getSiteBaseUrl();

  return {
    title: `${founder.founderName} - Founder Profile, Funding & Hiring | 100Xfounder`,
    description: `Explore founder profile for ${founder.founderName}, including company ${founder.companyName}, funding rounds, hiring roles, and market signals on 100Xfounder.`,
    alternates: {
      canonical: `${baseUrl}/founders/${founder.slug}`,
    },
  };
}

export default async function FounderProfilePage({ params }: FounderProfilePageProps) {
  const [founders, lastUpdatedAt] = await Promise.all([
    getFounderDirectory(),
    getFounderDirectoryLastUpdatedAt(),
  ]);
  const founder = founders.find((item) => item.slug === params.slug);

  if (!founder) {
    notFound();
  }

  const similar = founders
    .filter((item) => item.slug !== founder.slug && item.industry === founder.industry)
    .slice(0, 4);
  const baseUrl = getSiteBaseUrl();
  const faqs = buildFounderFaqs(founder);
  const countryLabel = founder.country ?? "India";
  const countrySlug = countryToSlug(countryLabel);
  const industrySlug = slugifySegment(founder.industry);
  const stageSlug = slugifySegment(founder.stage);
  const headquarters = founder.headquarters?.trim() || countryLabel;
  const totalFunding =
    founder.fundingTotalDisplay?.trim() ||
    founder.fundingInfo?.trim() ||
    "Undisclosed";
  const lastRoundLabel = founder.lastRound?.round?.trim() || null;
  const lastRoundAmount = founder.lastRound?.amount?.trim() || null;
  const hiringSummary = founder.isHiring
    ? founder.hiringRoles && founder.hiringRoles.length > 0
      ? founder.hiringRoles.slice(0, 4).join(", ")
      : "Active hiring signal detected"
    : "No active hiring roles mapped right now";
  const schema = buildFounderProfileSchema({
    baseUrl,
    founder,
    faqs,
    pagePath: `/founders/${founder.slug}`,
  });
  const lastUpdatedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(lastUpdatedAt);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur-[40px]">
          <div className="flex items-start gap-4">
            <div className="relative mt-1 h-16 w-16 shrink-0">
              <CompanyLogo
                companyName={founder.companyName}
                imageUrl={founder.avatarUrl}
                websiteUrl={founder.websiteUrl}
                className="h-14 w-14 rounded-xl border border-white/20"
              />
              <FounderAvatar
                name={founder.founderName}
                imageUrl={founder.avatarUrl}
                linkedinUrl={founder.linkedinUrl}
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border border-white/25 bg-black/40 shadow-[0_0_0_2px_rgba(5,5,5,0.9)]"
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                  Verified Profile
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                  {founder.stage}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                  {founder.industry}</span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                  {founder.country ?? "Unknown"}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                  {founder.countryTier ?? "TIER_3"}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {founder.founderName}
              </h1>
              <p className="mt-2 text-lg text-zinc-300">{founder.companyName}</p>
              <p className="mt-1 text-xs text-zinc-500">Last updated: {lastUpdatedOn}</p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-7 text-zinc-300">
            {founder.productSummary}
          </p>

          {founder.fundingInfo ? (
            <p className="mt-4 text-sm leading-7 text-indigo-300">
              {founder.fundingInfo}
            </p>
          ) : null}

          <ProfileTabs founder={founder} similar={similar} />

          <section className="mt-6 rounded-xl border border-white/10 bg-black/25 p-5">
            <h2 className="text-xl font-semibold text-white">
              Founder Intelligence Brief: {founder.founderName}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              This profile is built to help readers move from a founder name to decision-ready context.
              <strong> {founder.founderName}</strong> is mapped to <strong>{founder.companyName}</strong> in the
              <strong> {founder.industry}</strong> category, with current stage context as
              <strong> {founder.stage}</strong>. The primary operating market is <strong>{headquarters}</strong>,
              which connects this profile directly to regional ecosystem pages and related industry hubs.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Funding visibility currently shows <strong>{totalFunding}</strong>
              {lastRoundLabel ? (
                <>
                  {", with the latest mapped round as "}
                  <strong>{lastRoundLabel}</strong>
                  {lastRoundAmount ? ` (${lastRoundAmount})` : ""}.
                </>
              ) : (
                "."
              )}
              {" "}
              This makes it easier to evaluate growth narrative against capital stage rather than reading isolated
              updates without baseline context.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              For deeper research, combine this founder page with the
              <Link href={`/company/${founder.companySlug}`} className="text-indigo-300 hover:text-indigo-200">
                {" company profile"}
              </Link>
              , 
              <Link href={`/companies/${founder.companySlug}/news`} className="text-indigo-300 hover:text-indigo-200">
                {" company news hub"}
              </Link>
              , 
              <Link href={`/countries/${countrySlug}/news`} className="text-indigo-300 hover:text-indigo-200">
                {" country newsroom"}
              </Link>
              {" and "}
              <Link href={`/startups/industry/${industrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                {`${founder.industry} startup list`}
              </Link>
              . This route gives a cleaner picture of execution, market demand, and competitive movement.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
                  Research flow
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                  <li>
                    Validate company baseline on
                    <Link href={`/company/${founder.companySlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {" company intelligence"}
                    </Link>
                    .
                  </li>
                  <li>
                    Compare market peers via
                    <Link href={`/industries/${industrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${founder.industry} industry routes`}
                    </Link>
                    {" and "}
                    <Link href={`/stages/${stageSlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {`${founder.stage} stage pages`}
                    </Link>
                    .
                  </li>
                  <li>
                    Track fresh updates in
                    <Link href="/blog" className="text-indigo-300 hover:text-indigo-200">
                      {" newsroom coverage"}
                    </Link>
                    {" and "}
                    <Link href="/signals" className="text-indigo-300 hover:text-indigo-200">
                      {"signals feed"}
                    </Link>
                    .
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-300">
                  Operating context
                </h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                  <li>
                    Geography:
                    <Link href={`/countries/${countrySlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${countryLabel} directory`}
                    </Link>
                    .
                  </li>
                  <li>
                    Stage signal:
                    <Link href={`/funding-rounds/${stageSlug}`} className="text-indigo-300 hover:text-indigo-200">
                      {` ${founder.stage} funding coverage`}
                    </Link>
                    .
                  </li>
                  <li>Hiring status: {hiringSummary}.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-white/10 bg-black/25 p-4">
            <h2 className="text-base font-semibold text-white">Related Founders</h2>
            <p className="mt-1 text-xs text-zinc-500">
              More founders in {founder.industry}.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {similar.length > 0 ? (
                similar.map((item) => (
                  <Link
                    key={item.id}
                    href={`/founders/${item.slug}`}
                    className="rounded-md border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/25"
                  >
                    <p className="text-sm font-medium text-white">{item.founderName}</p>
                    <p className="mt-1 text-xs text-zinc-400">{item.companyName}</p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-zinc-500">No related founders available yet.</p>
              )}
            </div>
          </section>

          <GetFeaturedCtaCard
            context="founder_profile"
            description="Get your founder profile published with verified funding and hiring context."
          />

          <PillarCrosslinks
            context={{
              country: founder.country,
              industry: founder.industry,
              stage: founder.stage,
              companySlug: founder.companySlug,
              founderSlug: founder.slug,
            }}
            includeGlobal
            maxLinks={10}
            title="Related Pillar Pages"
            description="Access the country, industry, stage, startup taxonomy, and newsroom routes connected to this founder."
            className="mt-6"
          />

          <ProfileFaqSection
            title={`FAQs About ${founder.founderName}`}
            faqs={faqs}
          />

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/founders"
              className="inline-flex items-center rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              Back to Directory
            </Link>
            {founder.ycProfileUrl ? (
              <a
                href={founder.ycProfileUrl}
                target="_blank"
                rel={getUserSubmittedExternalRel()}
                className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
              >
                View on YC Founders
              </a>
            ) : null}
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
            >
              Claim This Profile
            </Link>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <Footer />
    </main>
  );
}
