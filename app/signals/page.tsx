"use client";

import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyLogo } from "@/components/ui/company-logo";

const tickerItems = [
  "OpenAI closes $6.6B strategic round",
  "Anthropic lands $4B infrastructure commitment",
  "Perplexity raises $500M to scale AI search",
  "Zepto raises $200M in Series D momentum",
  "Ramp extends US fintech automation footprint",
];

const fundingFeed = [
  {
    time: "2 hours ago",
    company: "OpenAI",
    domain: "openai.com",
    stage: "Strategic Round",
    amount: "$6.6B",
  },
  {
    time: "4 hours ago",
    company: "Anthropic",
    domain: "anthropic.com",
    stage: "Strategic Round",
    amount: "$4B",
  },
  {
    time: "6 hours ago",
    company: "Perplexity",
    domain: "perplexity.ai",
    stage: "Raised Series C",
    amount: "$500M",
  },
  {
    time: "8 hours ago",
    company: "Zepto",
    domain: "zeptonow.com",
    stage: "Raised Series D",
    amount: "$200M",
  },
  {
    time: "11 hours ago",
    company: "Sarvam AI",
    domain: "sarvam.ai",
    stage: "Raised Series B",
    amount: "$41M",
  },
  {
    time: "1 day ago",
    company: "Ramp",
    domain: "ramp.com",
    stage: "Growth Round",
    amount: "$150M",
  },
];

const hiringHeatmap = [
  { role: "Engineering", level: "High" },
  { role: "Sales", level: "Medium" },
  { role: "Product", level: "High" },
  { role: "Design", level: "Low" },
  { role: "Data", level: "Medium" },
  { role: "Operations", level: "Medium" },
];

function levelClass(level: string) {
  if (level === "High") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (level === "Medium") return "bg-yellow-500/15 text-yellow-200 border-yellow-400/30";
  return "bg-zinc-500/15 text-zinc-300 border-zinc-400/20";
}

export default function SignalsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white">Signals Terminal</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Real-time funding and operating indicators across India and US startup ecosystems.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: "easeOut" }}
          className="mt-7 overflow-hidden rounded-xl border border-white/15 bg-white/[0.03] backdrop-blur-[40px]"
        >
          <div className="ticker-track">
            <span>{tickerItems.join(" • ")}</span>
            <span aria-hidden="true">{tickerItems.join(" • ")}</span>
          </div>
        </motion.div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.1, ease: "easeOut" }}
            className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]"
          >
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
              Funding Feed
            </h2>
            <div className="mt-4 space-y-3">
              {fundingFeed.map((item) => (
                <div
                  key={`${item.company}-${item.time}`}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 sm:grid-cols-[96px_minmax(0,1fr)_84px] sm:items-center sm:gap-3"
                >
                  <p className="text-xs text-zinc-500">{item.time}</p>
                  <div className="flex items-center gap-2">
                    <CompanyLogo
                      companyName={item.company}
                      domain={item.domain}
                      className="h-7 w-7 rounded-md border border-white/15"
                    />
                    <p className="text-sm text-zinc-200">
                      <span className="font-medium text-white">{item.company}</span>{" "}
                      {item.stage}
                    </p>
                  </div>
                  <p className="text-left text-sm font-medium text-emerald-300 sm:text-right">
                    {item.amount}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.16, ease: "easeOut" }}
            className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]"
          >
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
              Hiring Heatmap
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {hiringHeatmap.map((item) => (
                <div
                  key={item.role}
                  className={`rounded-lg border px-3 py-2 text-xs ${levelClass(item.level)}`}
                >
                  <p className="font-medium">{item.role}</p>
                  <p className="mt-1 opacity-90">{item.level}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
