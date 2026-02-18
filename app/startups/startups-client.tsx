"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const cityCards = [
  {
    city: "Delhi",
    description: "AI, fintech, and enterprise distribution momentum.",
    image: "/images/cities/delhi.svg",
    href: "/founders?location=Delhi",
  },
  {
    city: "Bangalore",
    description: "SaaS operators, deep tech founders, and GTM leaders.",
    image: "/images/cities/bangalore.svg",
    href: "/founders?location=Bangalore",
  },
  {
    city: "Mumbai",
    description: "Consumer scale, commerce, and financial infrastructure.",
    image: "/images/cities/mumbai.svg",
    href: "/founders?location=Mumbai",
  },
  {
    city: "San Francisco",
    description: "Frontier AI, data infra, and global enterprise builders.",
    image: "/images/covers/ai-grid.svg",
    href: "/founders?location=San+Francisco",
  },
  {
    city: "New York",
    description: "Fintech, vertical SaaS, and revenue-tech momentum.",
    image: "/images/covers/funding-wire.svg",
    href: "/founders?location=New+York",
  },
  {
    city: "Austin",
    description: "Developer tooling, cloud infra, and AI operator ecosystems.",
    image: "/images/covers/startup-brief.svg",
    href: "/founders?location=Austin",
  },
];

const collections = [
  {
    title: "🦄 Soonicorns (Valuation >$500M)",
    description: "High-velocity startups approaching unicorn territory.",
    href: "/founders?stage=Series+B,Series+C,Series+D",
  },
  {
    title: "🤖 Generative AI India",
    description: "Companies building foundational and applied GenAI products.",
    href: "/founders?industry=AI",
  },
  {
    title: "💼 B2B SaaS Leaders",
    description: "Operator-grade SaaS teams serving enterprise workflows.",
    href: "/founders?industry=SaaS",
  },
  {
    title: "🇺🇸 US AI Infrastructure",
    description: "Model, tooling, and inference leaders powering the US AI stack.",
    href: "/founders?industry=AI+Infrastructure",
  },
  {
    title: "🏦 US Fintech Challengers",
    description: "Finance automation and spend-control companies growing in US markets.",
    href: "/founders?location=New+York",
  },
];

const usFundingHubs = [
  {
    city: "San Francisco",
    companiesTracked: "14,500+",
    fundingSignal: "$111.7B (2025)",
    href: "/startups/startups-in-san-francisco",
    sourceUrl: "https://growthlist.co/san-francisco-startups/",
  },
  {
    city: "New York",
    companiesTracked: "10,000+",
    fundingSignal: "High-volume Seed to Series C",
    href: "/startups/startups-in-new-york",
    sourceUrl: "https://growthlist.co/new-york-startups/",
  },
  {
    city: "Austin",
    companiesTracked: "550+",
    fundingSignal: "$6.56B (2025)",
    href: "/startups/startups-in-austin",
    sourceUrl: "https://growthlist.co/austin-startups/",
  },
  {
    city: "Seattle",
    companiesTracked: "300+",
    fundingSignal: "$3.2B (2024)",
    href: "/startups/startups-in-seattle",
    sourceUrl: "https://growthlist.co/seattle-startups/",
  },
  {
    city: "Boston",
    companiesTracked: "420+",
    fundingSignal: "Biotech & AI leadership",
    href: "/startups/startups-in-boston",
    sourceUrl: "https://growthlist.co/boston-startups/",
  },
  {
    city: "Chicago",
    companiesTracked: "300+",
    fundingSignal: "Healthcare + Fintech momentum",
    href: "/startups/startups-in-chicago",
    sourceUrl: "https://growthlist.co/chicago-startups/",
  },
  {
    city: "Miami",
    companiesTracked: "380+",
    fundingSignal: "Energy + Ops SaaS growth",
    href: "/startups/startups-in-miami",
    sourceUrl: "https://growthlist.co/miami-startups/",
  },
  {
    city: "Washington DC",
    companiesTracked: "180+",
    fundingSignal: "Climate + Deep Tech rounds",
    href: "/startups/startups-in-washington-dc",
    sourceUrl: "https://growthlist.co/washington-dc-startups/",
  },
  {
    city: "Dallas",
    companiesTracked: "200+",
    fundingSignal: "Fintech + B2B software expansion",
    href: "/startups/startups-in-dallas",
    sourceUrl: "https://growthlist.co/dallas-startups/",
  },
  {
    city: "Philadelphia",
    companiesTracked: "250+",
    fundingSignal: "Commerce + HealthTech rounds",
    href: "/startups/startups-in-philadelphia",
    sourceUrl: "https://growthlist.co/philadelphia-startups/",
  },
];

type StartupsClientProps = {
  cityStats?: Record<string, number>;
  collectionStats?: {
    soonicorns: number;
    genaiIndia: number;
    b2bSaas: number;
    usAiInfrastructure: number;
    usFintech: number;
  };
  updatedAt?: string;
};

export function StartupsClient({
  cityStats = {},
  collectionStats,
  updatedAt,
}: StartupsClientProps) {
  const collectionCountByTitle: Record<string, number | undefined> = {
    "🦄 Soonicorns (Valuation >$500M)": collectionStats?.soonicorns,
    "🤖 Generative AI India": collectionStats?.genaiIndia,
    "💼 B2B SaaS Leaders": collectionStats?.b2bSaas,
    "🇺🇸 US AI Infrastructure": collectionStats?.usAiInfrastructure,
    "🏦 US Fintech Challengers": collectionStats?.usFintech,
  };

  const updatedLabel = updatedAt ? new Date(updatedAt).toLocaleString() : "Live sync";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-white">Startup Explorer</h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Navigate startup momentum across Indian and US ecosystems by city, collection, and operating signal.
        </p>
        <p className="mt-1 text-xs text-zinc-500">Last updated: {updatedLabel}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}
        className="mt-8"
      >
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-300">
          Trending Ecosystems
        </h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {cityCards.map((card) => (
            <Link
              key={card.city}
              href={card.href}
              className="group relative block h-52 min-w-[260px] overflow-hidden rounded-2xl border border-white/15 bg-black/35 backdrop-blur-[40px] sm:min-w-[320px]"
            >
              <img
                src={card.image}
                alt={card.city}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/15" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-lg font-semibold text-white">{card.city}</p>
                <p className="mt-1 text-sm text-zinc-300">{card.description}</p>
                {cityStats[card.city] ? (
                  <p className="mt-2 text-xs text-zinc-400">
                    {cityStats[card.city]} companies tracked
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.48, delay: 0.11, ease: "easeOut" }}
        className="mt-10"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
            US Funded Startup Hubs
          </h2>
          <a
            href="https://growthlist.co/united-states-startups/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-zinc-400 transition-colors hover:text-white"
          >
            Source: GrowthList
          </a>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {usFundingHubs.map((hub) => (
            <Link
              key={hub.city}
              href={hub.href}
              className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px] transition-all hover:border-white/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.24)]"
            >
              <p className="text-base font-semibold text-white">{hub.city}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
                Funded Companies
              </p>
              <p className="mt-1 text-sm text-zinc-300">{hub.companiesTracked}</p>
              {cityStats[hub.city] ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Data-backed count: {cityStats[hub.city]} companies
                </p>
              ) : null}
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-zinc-500">
                Funding Signal
              </p>
              <p className="mt-1 text-sm text-zinc-300">{hub.fundingSignal}</p>
              <p className="mt-4 text-xs text-indigo-300">Open city directory</p>
              <p className="mt-1 text-[11px] text-zinc-500">Source: {hub.sourceUrl}</p>
            </Link>
          ))}
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14, ease: "easeOut" }}
        className="mt-10"
      >
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-300">
          Curated Collections
        </h2>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.title}
              href={collection.href}
              className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px] transition-all hover:border-white/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              <h3 className="text-lg font-semibold text-white">{collection.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{collection.description}</p>
              {collectionCountByTitle[collection.title] ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {collectionCountByTitle[collection.title]} matched companies
                </p>
              ) : null}
              <span className="mt-4 inline-flex text-sm text-indigo-300">
                Open filtered directory
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
