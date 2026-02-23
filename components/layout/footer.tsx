import Link from "next/link";
import {
  buildWhatsAppRedirectPath,
  getInstagramProfileUrl,
} from "@/lib/marketing/outreach";

const footerColumns = [
  {
    title: "General",
    links: [
      { label: "About", href: "/about" },
      { label: "Newsroom", href: "/blog" },
      { label: "Feature Now", href: "/feature-now" },
      { label: "Get Featured", href: "/get-featured" },
      { label: "Interview Questionnaire", href: "/interview-questionnaire" },
      { label: "Guest Post Marketplace", href: "/guest-post-marketplace" },
      { label: "Guest Post Order", href: "/guest-post-order" },
      { label: "News Topics", href: "/topics" },
      { label: "Funding Round News", href: "/funding-rounds" },
      { label: "Authors", href: "/authors" },
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "Countries", href: "/countries" },
      { label: "Startups", href: "/startups" },
      { label: "Jobs", href: "/jobs" },
      { label: "Salary & Equity", href: "/salary-equity" },
      { label: "Negotiation Coaching", href: "/negotiation-coaching" },
      { label: "Fulfillment Policy", href: "/fulfillment-policy" },
      { label: "Add Startup or Job", href: "/add-startup-or-job" },
      { label: "Sitemap (HTML)", href: "/sitemap" },
      { label: "Sitemap (XML)", href: "/sitemap.xml" },
    ],
  },
  {
    title: "Industry",
    links: [
      { label: "AI startups", href: "/startups/ai-startups" },
      { label: "Biotech startups", href: "/startups/biotech-startups" },
      { label: "Cybersecurity startups", href: "/startups/cybersecurity-startups" },
      { label: "E-Commerce startups", href: "/startups/e-commerce-startups" },
      { label: "EdTech startups", href: "/startups/edtech-startups" },
      { label: "FinTech startups", href: "/startups/fintech-startups" },
      { label: "Healthcare startups", href: "/startups/healthcare-startups" },
      { label: "Marketplace startups", href: "/startups/marketplace-startups" },
      { label: "SaaS startups", href: "/startups/saas-startups" },
      { label: "Sustainability startups", href: "/startups/sustainability-startups" },
    ],
  },
  {
    title: "Stage",
    links: [
      { label: "Early-stage startups", href: "/startups/early-stage-startups" },
      { label: "Growth-stage startups", href: "/startups/growth-stage-startups" },
      { label: "Mature startups", href: "/startups/mature-startups" },
      { label: "Under 50 employees", href: "/startups/under-50-employees" },
      { label: "Under 100 employees", href: "/startups/under-100-employees" },
      { label: "Under 500 employees", href: "/startups/under-500-employees" },
      { label: "Founded in 2021", href: "/startups/founded-in-2021" },
      { label: "Founded in 2020", href: "/startups/founded-in-2020" },
    ],
  },
  {
    title: "HQ location",
    links: [
      { label: "United States Startups", href: "/startups/united-states-startups" },
      { label: "Remote Startups", href: "/startups/remote-startups" },
      { label: "Startups in New York", href: "/startups/startups-in-new-york" },
      { label: "Startups in Chicago", href: "/startups/startups-in-chicago" },
      { label: "Startups in Boston", href: "/startups/startups-in-boston" },
      { label: "Startups in San Francisco", href: "/startups/startups-in-san-francisco" },
      { label: "Startups in Los Angeles", href: "/startups/startups-in-los-angeles" },
      { label: "Startups in Seattle", href: "/startups/startups-in-seattle" },
      { label: "Startups in Austin", href: "/startups/startups-in-austin" },
      { label: "Startups in Miami", href: "/startups/startups-in-miami" },
      { label: "Startups in Washington DC", href: "/startups/startups-in-washington-dc" },
      { label: "Startups in Dallas", href: "/startups/startups-in-dallas" },
      { label: "Startups in Philadelphia", href: "/startups/startups-in-philadelphia" },
      { label: "Startups in San Diego", href: "/startups/startups-in-san-diego" },
      { label: "Startups in Houston", href: "/startups/startups-in-houston" },
      { label: "Startups in Atlanta", href: "/startups/startups-in-atlanta" },
      { label: "Startups in Denver", href: "/startups/startups-in-denver" },
      { label: "Startups in India", href: "/startups/startups-in-india" },
      { label: "Startups in London", href: "/startups/startups-in-london" },
      { label: "Startups in Canada", href: "/startups/startups-in-canada" },
    ],
  },
];

const highIntentKeywords = [
  { label: "Startup newsroom", href: "/blog" },
  { label: "Startup news topics", href: "/topics" },
  { label: "Funding round news", href: "/funding-rounds" },
  { label: "India startup news", href: "/countries/india/news" },
  { label: "US startup news", href: "/countries/united-states/news" },
  { label: "Top startups by country", href: "/countries" },
  { label: "Tier 1 startup countries", href: "/countries/tier/tier_1" },
  { label: "Tier 2 startup countries", href: "/countries/tier/tier_2" },
  { label: "Tier 3 startup countries", href: "/countries/tier/tier_3" },
  { label: "AI startups", href: "/startups/ai-startups" },
  { label: "Biotech startups", href: "/startups/biotech-startups" },
  { label: "Cybersecurity startups", href: "/startups/cybersecurity-startups" },
  { label: "E-Commerce startups", href: "/startups/e-commerce-startups" },
  { label: "EdTech startups", href: "/startups/edtech-startups" },
  { label: "FinTech startups", href: "/startups/fintech-startups" },
  { label: "Healthcare startups", href: "/startups/healthcare-startups" },
  { label: "Marketplace startups", href: "/startups/marketplace-startups" },
  { label: "SaaS startups", href: "/startups/saas-startups" },
  { label: "Sustainability startups", href: "/startups/sustainability-startups" },
  { label: "Early-stage startups", href: "/startups/early-stage-startups" },
  { label: "Growth-stage startups", href: "/startups/growth-stage-startups" },
  { label: "Mature startups", href: "/startups/mature-startups" },
  { label: "Under 50 employees", href: "/startups/under-50-employees" },
  { label: "Under 100 employees", href: "/startups/under-100-employees" },
  { label: "Under 500 employees", href: "/startups/under-500-employees" },
  { label: "Founded in 2021", href: "/startups/founded-in-2021" },
  { label: "Founded in 2020", href: "/startups/founded-in-2020" },
  { label: "United States startups", href: "/startups/united-states-startups" },
  { label: "Remote Startups", href: "/startups/remote-startups" },
  { label: "Startups in New York", href: "/startups/startups-in-new-york" },
  { label: "Startups in Chicago", href: "/startups/startups-in-chicago" },
  { label: "Startups in Boston", href: "/startups/startups-in-boston" },
  { label: "Startups in San Francisco", href: "/startups/startups-in-san-francisco" },
  { label: "Startups in Los Angeles", href: "/startups/startups-in-los-angeles" },
  { label: "Startups in Seattle", href: "/startups/startups-in-seattle" },
  { label: "Startups in Austin", href: "/startups/startups-in-austin" },
  { label: "Startups in Miami", href: "/startups/startups-in-miami" },
  { label: "Startups in Washington DC", href: "/startups/startups-in-washington-dc" },
  { label: "Startups in Dallas", href: "/startups/startups-in-dallas" },
  { label: "Startups in Philadelphia", href: "/startups/startups-in-philadelphia" },
  { label: "Startups in San Diego", href: "/startups/startups-in-san-diego" },
  { label: "Startups in Houston", href: "/startups/startups-in-houston" },
  { label: "Startups in Atlanta", href: "/startups/startups-in-atlanta" },
  { label: "Startups in Denver", href: "/startups/startups-in-denver" },
  { label: "Startups in India", href: "/startups/startups-in-india" },
  { label: "Startups in London", href: "/startups/startups-in-london" },
  { label: "Startups in Canada", href: "/startups/startups-in-canada" },
];

export function Footer() {
  const instagramUrl = getInstagramProfileUrl();
  const whatsappHref = buildWhatsAppRedirectPath({
    context: "footer",
    source: "footer",
  });

  return (
    <footer className="border-t border-white/10 bg-black/95">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Instagram: @100x.founder</h3>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                Follow daily founder signals, funding clips, and ecosystem snapshots.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-pink-400/35 bg-pink-500/10 px-4 text-sm font-medium text-pink-200 transition-colors hover:bg-pink-500/20"
              >
                Open Instagram
              </a>
              <a
                href={whatsappHref}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20"
              >
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>

        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
          <h3 className="text-base font-semibold text-white">Directory Navigation</h3>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Explore startup intelligence by industry, stage, and headquarters to discover
            the highest-signal companies faster.
          </p>
        </div>

        <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
          <h3 className="text-base font-semibold text-white">Top Searches</h3>
          <p className="mt-2 text-sm text-zinc-400">
            High-intent startup and funding queries users search for across Google.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {highIntentKeywords.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-medium text-white">{column.title}</h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-zinc-500">
          © 2026 100Xfounder. The #1 Source for Indian & US Startup Intelligence.
        </div>
      </div>
    </footer>
  );
}
