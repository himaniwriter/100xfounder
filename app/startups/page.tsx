"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

const cityCards = [
  {
    city: "Delhi",
    description: "AI, fintech, and enterprise distribution momentum.",
    image:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=80",
    href: "/founders?location=Delhi",
  },
  {
    city: "Bangalore",
    description: "SaaS operators, deep tech founders, and GTM leaders.",
    image:
      "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=80",
    href: "/founders?location=Bangalore",
  },
  {
    city: "Mumbai",
    description: "Consumer scale, commerce, and financial infrastructure.",
    image:
      "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1400&q=80",
    href: "/founders?location=Mumbai",
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
];

export default function StartupsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white">Startup Explorer</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Navigate startup momentum by ecosystem, collection, and operating signal.
          </p>
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
                className="group relative block h-52 min-w-[320px] overflow-hidden rounded-2xl border border-white/15 bg-black/35 backdrop-blur-[40px]"
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
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

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
                <span className="mt-4 inline-flex text-sm text-indigo-300">Open filtered directory</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
