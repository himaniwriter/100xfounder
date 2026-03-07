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
  { label: "AI startups", href: "/startups/ai-startups" },
  { label: "FinTech startups", href: "/startups/fintech-startups" },
  { label: "SaaS startups", href: "/startups/saas-startups" },
  { label: "Healthcare startups", href: "/startups/healthcare-startups" },
  { label: "Early-stage startups", href: "/startups/early-stage-startups" },
  { label: "Growth-stage startups", href: "/startups/growth-stage-startups" },
  { label: "United States startups", href: "/startups/united-states-startups" },
  { label: "Remote Startups", href: "/startups/remote-startups" },
  { label: "Startups in New York", href: "/startups/startups-in-new-york" },
  { label: "Startups in San Francisco", href: "/startups/startups-in-san-francisco" },
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
    <footer className="border-t border-white/8 bg-[#050505]">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Social links */}
        <div className="mb-12 flex flex-col gap-4 rounded-[14px] border border-white/8 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">Follow @100x.founder</h3>
            <p className="mt-1.5 max-w-lg text-sm text-zinc-500">
              Daily founder signals, funding clips, and ecosystem snapshots.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="glass-ghost-btn glass-ghost-btn-compact border-pink-400/20 text-pink-200 hover:border-pink-400/35 hover:bg-pink-500/8"
            >
              Instagram
            </a>
            <a
              href={whatsappHref}
              className="glass-ghost-btn glass-ghost-btn-compact border-emerald-400/20 text-emerald-200 hover:border-emerald-400/35 hover:bg-emerald-500/8"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Top searches */}
        <div className="mb-12">
          <h3 className="text-overline uppercase text-zinc-500">Top Searches</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {highIntentKeywords.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-500 transition-colors duration-150 hover:border-white/16 hover:text-zinc-300"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column links */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-overline font-semibold uppercase text-zinc-400">{column.title}</h3>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 border-t border-white/6 pt-6 text-[13px] text-zinc-600">
          © 2026 100Xfounder. The #1 Source for Indian & US Startup Intelligence.
        </div>
      </div>
    </footer>
  );
}
