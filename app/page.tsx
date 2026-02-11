"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { GlassCard } from "@/components/ui/glass-card";

const trendingCompanies = [
  "Stripe",
  "OpenAI",
  "Notion",
  "Figma",
  "Linear",
  "Vercel",
  "Datadog",
  "Anthropic",
];

const featuredFounders = [
  {
    name: "Ava Chen",
    role: "Founder, FluxOS",
    location: "San Francisco",
    tags: ["AI Infra", "Ex-Stripe"],
  },
  {
    name: "Noah Patel",
    role: "Co-Founder, Orbit Health",
    location: "New York",
    tags: ["HealthTech", "YC W24"],
  },
  {
    name: "Mila Romero",
    role: "Founder, Quintic Labs",
    location: "London",
    tags: ["Developer Tools", "Ex-Google"],
  },
];

export default function HomePage() {
  const marqueeItems = [...trendingCompanies, ...trendingCompanies];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#EDEDED]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-16rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.28),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto w-full max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-6xl md:text-7xl"
            >
              The Index of Ambition.
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.08, ease: "easeOut" }}
              className="mx-auto mt-5 max-w-2xl text-lg text-zinc-400"
            >
              Discover the people building the future.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="mx-auto mt-10 max-w-2xl"
            >
              <div className="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 backdrop-blur-md">
                <Search className="h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search founders, startups, and signals..."
                  className="h-full flex-1 bg-transparent text-base text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
                />
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-zinc-400">
                  Cmd + K
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-500">Trending</p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md">
            <motion.div
              className="flex w-max gap-3 px-4 py-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {marqueeItems.map((company, index) => (
                <div
                  key={`${company}-${index}`}
                  className="rounded-lg border border-white/10 bg-black/30 px-5 py-2 text-sm text-zinc-300"
                >
                  {company}
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Featured Founders</h2>
            <span className="text-sm text-zinc-500">Updated daily</span>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featuredFounders.map((founder, index) => (
              <GlassCard key={founder.name} className="p-5">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-zinc-200">
                      {founder.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{founder.name}</h3>
                      <p className="text-sm text-zinc-400">{founder.role}</p>
                      <p className="mt-1 text-xs text-zinc-500">{founder.location}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {founder.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-[#6366f1]/30 bg-[#6366f1]/10 px-2.5 py-1 text-xs text-indigo-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </GlassCard>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
