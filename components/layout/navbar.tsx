import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavbarAuthActions } from "@/components/layout/navbar-auth-actions";
import { CommandPaletteTrigger } from "@/components/system/command-palette-trigger";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";

const primaryNavLinks = [
  { label: "Home", href: "/" },
  { label: "Signals", href: "/signals" },
  { label: "Blog", href: "/blog" },
  { label: "Startup", href: "/startups" },
  { label: "Pricing", href: "/pricing" },
];

const megaMenuSections = [
  {
    title: "Directory",
    links: [
      {
        label: "Founder Directory",
        href: "/founders",
        description: "Search founders, companies, and funding snapshots.",
      },
      {
        label: "Startups",
        href: "/startups",
        description: "Programmatic startup lists for high-intent categories.",
      },
      {
        label: "Startups by Industry",
        href: "/startups/industry",
        description: "Path-based SEO pages for AI, FinTech, SaaS, and more.",
      },
      {
        label: "Startups by Location",
        href: "/startups/location",
        description: "City and country startup clusters with funding context.",
      },
      {
        label: "Signals Feed",
        href: "/signals",
        description: "Track recent funding and hiring movement.",
      },
    ],
  },
  {
    title: "Market Hubs",
    links: [
      {
        label: "Countries",
        href: "/countries",
        description: "Tier 1, Tier 2, and Tier 3 market coverage.",
      },
      {
        label: "Industries",
        href: "/industries",
        description: "Index pages mapped to vertical SEO demand.",
      },
      {
        label: "Stages",
        href: "/stages",
        description: "Explore startups from seed to public.",
      },
      {
        label: "Funding Round Startups",
        href: "/startups/funding-round",
        description: "Seed to Series E startup cohorts.",
      },
      {
        label: "Investor-backed Startups",
        href: "/startups/investor",
        description: "Startup pages grouped by investor support.",
      },
    ],
  },
  {
    title: "Main Queries",
    links: [
      {
        label: "Top AI Startups",
        href: "/startups/industry/artificial-intelligence",
        description: "High-intent startup list for AI search demand.",
      },
      {
        label: "Top FinTech Startups",
        href: "/startups/industry/fintech",
        description: "Dedicated FinTech startup cluster page.",
      },
      {
        label: "Startups in New York",
        href: "/startups/location/new-york",
        description: "Geo-specific startup list for NYC intent.",
      },
      {
        label: "Series A Startups",
        href: "/startups/funding-round/series-a",
        description: "Funding-stage startup cohort by Series A.",
      },
      {
        label: "Y Combinator Startups",
        href: "/startups/investor/y-combinator",
        description: "Investor-backed startup list for YC queries.",
      },
      {
        label: "Startup Jobs in New York",
        href: "/startups/jobs",
        description: "Role and location-led startup jobs pages.",
      },
      {
        label: "Software Engineer Salary & Equity",
        href: "/startups/salary-equity",
        description: "Compensation benchmark pages for startup hiring.",
      },
    ],
  },
  {
    title: "Popular Paths",
    links: [
      {
        label: "News Topics",
        href: "/topics",
        description: "Clustered newsroom hubs by high-intent startup themes.",
      },
      {
        label: "Funding Round News",
        href: "/funding-rounds",
        description: "Follow stage-based funding coverage and momentum.",
      },
      {
        label: "Trending Founders",
        href: "/founders?tab=trending",
        description: "Recently active profiles with fresh company signals.",
      },
      {
        label: "Search",
        href: "/search",
        description: "Query founders, companies, and blog posts.",
      },
      {
        label: "Interview Questionnaire",
        href: "/interview-questionnaire",
        description: "Structured Q&A intake for approved founder features.",
      },
      {
        label: "Guest Post Marketplace",
        href: "/guest-post-marketplace",
        description: "Sponsored startup story packages and order flow.",
      },
    ],
  },
];

export function Navbar() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-14 items-center lg:h-16">
          {/* Logo */}
          <Link
            href="/"
            className="relative z-20 shrink-0"
            aria-label="100Xfounder Home"
          >
            <Image
              src="/images/brand/100xfounder-logo.png"
              alt="100Xfounder"
              width={2000}
              height={1000}
              priority
              className="h-auto w-[140px] max-h-[350px] object-contain sm:w-[160px] lg:w-[170px]"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 items-center gap-1 md:flex">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex h-full items-center px-3 text-[14px] font-medium text-zinc-400 transition-colors duration-150 hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            {/* Explore mega menu */}
            <div className="group relative flex h-full items-center">
              <button
                type="button"
                className="inline-flex h-full items-center gap-1 px-3 text-[14px] font-medium text-zinc-400 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                aria-haspopup="true"
              >
                Explore
                <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
              </button>

              <div className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+0.25rem)] z-50 w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2 rounded-[14px] border border-white/8 bg-[#0a0a0f]/95 p-6 opacity-0 shadow-elevated backdrop-blur-xl transition-all duration-200 before:absolute before:-top-2 before:left-0 before:h-2 before:w-full group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {megaMenuSections.map((section) => (
                    <div key={section.title} className="flex flex-col">
                      <h3 className="mb-3 text-overline font-semibold uppercase text-zinc-500">
                        {section.title}
                      </h3>

                      <div className="space-y-1">
                        {section.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            prefetch={false}
                            className="group/link block rounded-lg p-2.5 transition-colors duration-150 hover:bg-white/[0.03]"
                          >
                            <p className="text-sm font-medium text-zinc-200 transition-colors group-hover/link:text-white">{link.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-zinc-500 transition-colors group-hover/link:text-zinc-400">{link.description}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right actions */}
          <div className="relative z-20 ml-auto flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/get-featured"
              className="hidden items-center rounded-button border border-indigo-400/30 bg-indigo-500/10 px-3 py-1.5 text-[13px] font-medium text-indigo-200 transition-all duration-150 hover:border-indigo-400/50 hover:bg-indigo-500/15 sm:inline-flex"
            >
              Get Featured
            </Link>
            <NavbarAuthActions />
            <CommandPaletteTrigger />
            <MobileNavDrawer />
          </div>
        </div>
      </div>
    </header>
  );
}
