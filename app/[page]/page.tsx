import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getSiteBaseUrl } from "@/lib/sitemap";

type StaticPageContent = {
  title: string;
  description: string;
  sectionTitle: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
};

const pageContent: Record<string, StaticPageContent> = {
  startups: {
    title: "Startup Explorer",
    description: "Browse high-signal startups built by ambitious founders.",
    sectionTitle: "What You Can Explore",
    bullets: [
      "Discover startups by stage, industry, and headquarters location.",
      "Track recently funded companies and market momentum.",
      "Jump from startup pages to founder profiles and company details.",
    ],
    ctaLabel: "Open Startup Categories",
    ctaHref: "/startups",
  },
  jobs: {
    title: "Startup Jobs",
    description:
      "Explore startup hiring opportunities across India and US founders, with a focus on high-growth teams.",
    sectionTitle: "How We Curate Startup Jobs",
    bullets: [
      "Roles are mapped to high-growth startup profiles in the directory.",
      "Priority is given to teams with fresh funding and active hiring demand.",
      "Coverage includes engineering, GTM, product, and leadership roles.",
    ],
    ctaLabel: "Browse Founder Directory",
    ctaHref: "/founders",
  },
  "salary-equity": {
    title: "Salary & Equity Guide",
    description:
      "Understand startup compensation benchmarks, equity ranges, and negotiation-ready compensation signals.",
    sectionTitle: "Compensation Insights",
    bullets: [
      "Compare salary bands by role, stage, and geography.",
      "Understand equity dilution across Seed to Series D scenarios.",
      "Use compensation benchmarks during hiring and offer negotiations.",
    ],
    ctaLabel: "View Stage-Based Startups",
    ctaHref: "/startups/early-stage-startups",
  },
  "negotiation-coaching": {
    title: "Negotiation Coaching",
    description:
      "Get tactical startup negotiation coaching for offers, equity discussions, and founder-level compensation decisions.",
    sectionTitle: "Coaching Focus Areas",
    bullets: [
      "Role compensation alignment for operators and startup leaders.",
      "Equity packaging for early-stage, growth-stage, and late-stage offers.",
      "Structured scripts for founder-intro, investor, and partner conversations.",
    ],
    ctaLabel: "Explore Growth-Stage Startups",
    ctaHref: "/startups/growth-stage-startups",
  },
  "fulfillment-policy": {
    title: "Fulfillment Policy",
    description:
      "Read 100Xfounder fulfillment and service delivery policy for subscriptions, data access, and support.",
    sectionTitle: "Policy Coverage",
    bullets: [
      "How directory access and feature availability are delivered.",
      "Expected processing timelines for profile updates and support requests.",
      "Guidelines for service interruptions, refunds, and account resolution.",
    ],
    ctaLabel: "Contact Support",
    ctaHref: "/contact",
  },
  "add-startup-or-job": {
    title: "Add Startup or Job",
    description:
      "Submit your startup profile or hiring role to be listed on the 100Xfounder intelligence platform.",
    sectionTitle: "Submission Requirements",
    bullets: [
      "Provide a verifiable website, company one-liner, and founder details.",
      "Include stage and location data to improve directory discoverability.",
      "Job listings should include role title, scope, and application link.",
    ],
    ctaLabel: "Go To Founder Directory",
    ctaHref: "/founders",
  },
  signals: {
    title: "Signals",
    description: "Track momentum, funding events, and operator insights.",
    sectionTitle: "Signal Streams",
    bullets: [
      "Latest funding rounds from high-velocity startup ecosystems.",
      "Hiring momentum and category-level movement across sectors.",
      "News-aligned signals to support investor and sales research workflows.",
    ],
    ctaLabel: "Open Signals Feed",
    ctaHref: "/signals",
  },
  pricing: {
    title: "Pricing",
    description: "Choose a plan that matches your scouting and research workflow.",
    sectionTitle: "What Plans Unlock",
    bullets: [
      "Expanded company intelligence and deeper founder context.",
      "Advanced filters for stage, geography, and industry segments.",
      "Faster workflows for investor, sales, and strategic scouting teams.",
    ],
    ctaLabel: "View Pricing",
    ctaHref: "/pricing",
  },
  join: {
    title: "Join 100Xfounder",
    description: "Request access to join the premium founder directory.",
    sectionTitle: "Why Join",
    bullets: [
      "Get immediate access to searchable founder and startup intelligence.",
      "Use market pulse and funding signals for faster decision making.",
      "Connect with verified profiles across India and US ecosystems.",
    ],
    ctaLabel: "Join Now",
    ctaHref: "/join",
  },
  about: {
    title: "About 100Xfounder",
    description: "The premium index for discovering verified startup founders.",
    sectionTitle: "Platform Mission",
    bullets: [
      "Build the most discoverable directory of startup operators and founders.",
      "Combine structured data, funding context, and actionable search filters.",
      "Help users move from guessing to confident founder outreach.",
    ],
    ctaLabel: "Explore Directory",
    ctaHref: "/founders",
  },
  careers: {
    title: "Careers",
    description: "Help us build the most trusted founder intelligence platform.",
    sectionTitle: "Open Opportunities",
    bullets: [
      "Work on product, data, and growth systems for startup intelligence.",
      "Build dark-mode-first experiences for high-volume directories.",
      "Collaborate with our in-house research and editorial teams.",
    ],
    ctaLabel: "Contact Hiring Team",
    ctaHref: "/contact",
  },
  contact: {
    title: "Contact",
    description: "Reach the 100Xfounder team for partnerships and support.",
    sectionTitle: "How We Can Help",
    bullets: [
      "Partnership requests for data providers and ecosystem platforms.",
      "Support for listing corrections and profile claims.",
      "Commercial inquiries for API and enterprise workflows.",
    ],
    ctaLabel: "Open Help Center",
    ctaHref: "/help",
  },
  blog: {
    title: "Blog",
    description: "Insights and analysis on founders, startups, and venture trends.",
    sectionTitle: "What We Publish",
    bullets: [
      "Funding breakdowns and category-specific market analysis.",
      "Founder playbooks and strategic lessons from fast-scaling teams.",
      "US and India ecosystem trend reports for operators and investors.",
    ],
    ctaLabel: "Read Blog",
    ctaHref: "/blog",
  },
  help: {
    title: "Help Center",
    description: "Get support articles and product guidance.",
    sectionTitle: "Support Topics",
    bullets: [
      "Account access, profile claim, and dashboard troubleshooting.",
      "Filtering, export, and discovery workflows in the directory.",
      "Data-source updates and webhook integration support.",
    ],
    ctaLabel: "Contact Support",
    ctaHref: "/contact",
  },
  changelog: {
    title: "Changelog",
    description: "Product improvements and releases from the 100Xfounder team.",
    sectionTitle: "Recent Product Work",
    bullets: [
      "Directory navigation improvements and page-level SEO updates.",
      "Signal feed enhancements and funding intelligence UI updates.",
      "Data quality fixes for profiles, logos, and category pages.",
    ],
    ctaLabel: "Visit Home",
    ctaHref: "/",
  },
  privacy: {
    title: "Privacy",
    description: "How 100Xfounder handles and protects your data.",
    sectionTitle: "Privacy Principles",
    bullets: [
      "Clear disclosure on collection, processing, and data retention.",
      "Controls for account holders to request corrections and removals.",
      "Security-first storage and access policy across platform systems.",
    ],
    ctaLabel: "Read Terms",
    ctaHref: "/terms",
  },
  terms: {
    title: "Terms",
    description: "Rules and terms for using the 100Xfounder platform.",
    sectionTitle: "Key Terms",
    bullets: [
      "Usage rights and acceptable behavior on the platform.",
      "Service limitations, warranties, and legal responsibilities.",
      "Subscription and billing obligations for premium plans.",
    ],
    ctaLabel: "Read Privacy Policy",
    ctaHref: "/privacy",
  },
  cookies: {
    title: "Cookies",
    description: "Cookie and tracking preferences for the platform.",
    sectionTitle: "Cookie Categories",
    bullets: [
      "Essential cookies for authentication and product functionality.",
      "Analytics cookies for understanding discovery behavior.",
      "Preference cookies for saving theme and dashboard settings.",
    ],
    ctaLabel: "Open Privacy Policy",
    ctaHref: "/privacy",
  },
};

type ContentKey = keyof typeof pageContent;
const INDEXABLE_CATCHALL_SLUGS = new Set<ContentKey>([
  "about",
  "contact",
  "privacy",
  "terms",
  "cookies",
  "fulfillment-policy",
]);

function isContentKey(value: string): value is ContentKey {
  return value in pageContent;
}

export async function generateMetadata({
  params,
}: {
  params: { page: string };
}): Promise<Metadata> {
  if (!isContentKey(params.page)) {
    return {
      title: "Page Not Found | 100Xfounder",
    };
  }

  const content = pageContent[params.page];
  const baseUrl = getSiteBaseUrl();
  const shouldIndex = INDEXABLE_CATCHALL_SLUGS.has(params.page);

  return {
    title: `${content.title} | 100Xfounder`,
    description: content.description,
    alternates: {
      canonical: `${baseUrl}/${params.page}`,
    },
    robots: shouldIndex
      ? {
        index: true,
        follow: true,
      }
      : {
        index: false,
        follow: true,
      },
  };
}

export default function MarketingPage({
  params,
}: {
  params: { page: string };
}) {
  if (!isContentKey(params.page)) {
    notFound();
  }

  const content = pageContent[params.page];

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
          {content.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">{content.description}</p>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-white/15 bg-white/[0.03] p-6 text-left backdrop-blur-[40px]">
          <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-zinc-300">
            {content.sectionTitle}
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-300">
            {content.bullets.map((bullet) => (
              <li key={bullet} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href={content.ctaHref}
            className="inline-flex items-center rounded-lg border border-[#6366f1]/30 bg-[#6366f1]/10 px-4 py-2 text-sm text-indigo-300 transition-colors hover:bg-[#6366f1]/20"
          >
            {content.ctaLabel}
          </Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}
