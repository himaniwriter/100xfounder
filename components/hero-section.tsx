"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";

export function HeroSection() {
  const mouseX = useMotionValue(-999);
  const mouseY = useMotionValue(-999);

  const glow = useMotionTemplate`radial-gradient(460px circle at ${mouseX}px ${mouseY}px, rgba(124, 58, 237, 0.25), transparent 65%)`;

  return (
    <section
      className="relative mt-14 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-20 md:px-12"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        mouseX.set(event.clientX - rect.left);
        mouseY.set(event.clientY - rect.top);
      }}
      onMouseLeave={() => {
        mouseX.set(-999);
        mouseY.set(-999);
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <p className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-wide text-zinc-300">
          Founder intelligence, rebuilt for speed
        </p>

        <h1 className="text-4xl font-medium leading-tight text-transparent bg-gradient-to-r from-white to-gray-500 bg-clip-text md:text-6xl">
          The Signal in the Noise.
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-zinc-400 md:text-lg">
          Verified data on the world&apos;s most ambitious builders.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button className="rounded-lg border border-white/10 bg-white/10 px-5 py-2.5 text-sm text-zinc-100 transition-colors hover:bg-white/20">
            Open Directory
          </button>
          <button className="rounded-lg border border-white/10 bg-transparent px-5 py-2.5 text-sm text-zinc-300 transition-colors hover:text-white">
            Explore Signals
          </button>
        </div>
      </motion.div>
    </section>
  );
}
