"use client";

import { motion } from "framer-motion";
import { Command, Search, Sparkles } from "lucide-react";
import { Geist, Geist_Mono } from "next/font/google";
import { HeroSection } from "@/components/hero-section";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const founders = [
  {
    name: "Anika Rao",
    role: "Founder & CEO, CausalAI",
    avatar: "AR",
    badges: ["YC W24", "Ex-Stripe"],
  },
  {
    name: "Mateo Lin",
    role: "Founder, Helix Cloud",
    avatar: "ML",
    badges: ["Seed", "Ex-Notion"],
  },
  {
    name: "Nora Patel",
    role: "Co-Founder, Arc Ledger",
    avatar: "NP",
    badges: ["Series A", "MIT"],
  },
  {
    name: "Ibrahim Khan",
    role: "Founder, Vector Forge",
    avatar: "IK",
    badges: ["YC S23", "Ex-Scale"],
  },
  {
    name: "Leah Cho",
    role: "Founder, Orbit Labs",
    avatar: "LC",
    badges: ["Pre-Seed", "Stanford"],
  },
  {
    name: "Samir Das",
    role: "Founder, Prism Infra",
    avatar: "SD",
    badges: ["Series B", "Ex-Plaid"],
  },
];

const directoryRows = [
  { company: "CausalAI", founder: "Anika Rao", totalRaised: "$42.5M", year: "2023", region: "SF" },
  { company: "Helix Cloud", founder: "Mateo Lin", totalRaised: "$19.0M", year: "2022", region: "NYC" },
  { company: "Arc Ledger", founder: "Nora Patel", totalRaised: "$11.2M", year: "2024", region: "LDN" },
  { company: "Vector Forge", founder: "Ibrahim Khan", totalRaised: "$31.8M", year: "2021", region: "BER" },
  { company: "Orbit Labs", founder: "Leah Cho", totalRaised: "$8.7M", year: "2025", region: "SEA" },
];

export default function HomePage() {
  return (
    <main
      className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[#030303] text-white font-sans antialiased`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-15rem] h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[180px]" />
        <div className="absolute right-[-8rem] top-[20rem] h-[24rem] w-[24rem] rounded-full bg-violet-600/20 blur-[160px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030303]/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 shadow-[0_0_24px_rgba(139,92,246,0.35)]">
              <Sparkles className="h-4 w-4 text-violet-300" />
            </div>
            <span className="text-sm font-medium tracking-wide text-zinc-100">FounderBase</span>
          </div>

          <div className="hidden w-full max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400 lg:flex">
            <Search className="h-4 w-4" />
            <span className="flex-1">Search founders, companies, rounds...</span>
            <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300">
              <Command className="h-3 w-3" />K
            </span>
          </div>

          <nav className="flex items-center gap-5 text-sm text-zinc-400">
            {[
              "Directory",
              "Signals",
              "Benchmarks",
              "Pricing",
            ].map((item) => (
              <a
                key={item}
                href="#"
                className="transition-colors hover:text-white"
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <HeroSection />

        <section className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg text-zinc-100">Founder Cards</h2>
            <p className="text-sm text-zinc-500">Live profile snapshots</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {founders.map((founder, idx) => (
              <motion.article
                key={founder.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: idx * 0.06, duration: 0.35, ease: "easeOut" }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 text-sm font-medium text-zinc-200">
                    {founder.avatar}
                  </div>
                  <div>
                    <h3 className="text-base text-white">{founder.name}</h3>
                    <p className="text-sm text-gray-400">{founder.role}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {founder.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-16 overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
        >
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <h2 className="text-sm uppercase tracking-[0.18em] text-zinc-300">The Directory</h2>
            <div className="font-mono text-xs text-zinc-500">stream://founderbase/live</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/5 text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Company</th>
                  <th className="px-5 py-3 font-medium">Founder</th>
                  <th className="px-5 py-3 font-medium">Total Raised</th>
                  <th className="px-5 py-3 font-medium">Founded Year</th>
                  <th className="px-5 py-3 font-medium">Region</th>
                </tr>
              </thead>
              <tbody>
                {directoryRows.map((row) => (
                  <tr key={row.company} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                    <td className="px-5 py-3 text-zinc-200">{row.company}</td>
                    <td className="px-5 py-3 text-zinc-400">{row.founder}</td>
                    <td className="px-5 py-3 font-mono text-zinc-300">{row.totalRaised}</td>
                    <td className="px-5 py-3 font-mono text-zinc-300">{row.year}</td>
                    <td className="px-5 py-3 font-mono text-zinc-500">{row.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
