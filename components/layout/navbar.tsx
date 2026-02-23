import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { NavbarAuthActions } from "@/components/layout/navbar-auth-actions";
import { CommandPaletteTrigger } from "@/components/system/command-palette-trigger";

const primaryNavLinks = [
  { label: "Home", href: "/" },
  { label: "Signals", href: "/signals" },
  { label: "Blog", href: "/blog" },
  { label: "Pricing", href: "/pricing" },
];

const mobileNavLinks = [
  { label: "Home", href: "/" },
  { label: "Directory", href: "/founders" },
  { label: "Countries", href: "/countries" },
  { label: "Industries", href: "/industries" },
  { label: "Stages", href: "/stages" },
  { label: "Startups", href: "/startups" },
  { label: "Signals", href: "/signals" },
  { label: "Blog", href: "/blog" },
  { label: "Topics", href: "/topics" },
  { label: "Pricing", href: "/pricing" },
  { label: "Search", href: "/search" },
  { label: "Get Featured", href: "/get-featured" },
  { label: "Interview Q&A", href: "/interview-questionnaire" },
  { label: "Guest Posts", href: "/guest-post-marketplace" },
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
        label: "Hiring Now",
        href: "/founders?tab=hiring",
        description: "Companies actively hiring right now.",
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
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tighter text-white sm:text-xl">
            100Xfounder
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {primaryNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}

            <div className="group relative">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                aria-haspopup="true"
              >
                Explore
                <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
              </button>

              <div className="pointer-events-none invisible absolute left-1/2 top-[calc(100%+14px)] z-50 w-[min(860px,calc(100vw-2rem))] max-h-[75vh] -translate-x-1/2 translate-y-2 overflow-y-auto rounded-2xl border border-white/15 bg-[#08080f]/95 p-5 opacity-0 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <p className="mb-4 text-xs uppercase tracking-[0.18em] text-zinc-500">Discovery Menu</p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {megaMenuSections.map((section) => (
                    <div key={section.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
                        {section.title}
                      </h3>

                      <div className="mt-3 space-y-2">
                        {section.links.map((link) => (
                          <Link
                            key={link.label}
                            href={link.href}
                            className="block rounded-lg border border-transparent p-2 transition-colors hover:border-white/15 hover:bg-white/[0.04]"
                          >
                            <p className="text-sm font-medium text-white">{link.label}</p>
                            <p className="mt-0.5 text-xs text-zinc-400">{link.description}</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/get-featured"
              className="inline-flex h-9 items-center rounded-md border border-indigo-400/45 bg-indigo-500/15 px-2.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/25 sm:px-3 sm:text-sm"
            >
              Get Featured
            </Link>
            <NavbarAuthActions />
            <CommandPaletteTrigger />
          </div>
        </div>

        <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-3 md:hidden">
          {mobileNavLinks.map((link) => (
            <Link
              key={`mobile-${link.label}`}
              href={link.href}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
