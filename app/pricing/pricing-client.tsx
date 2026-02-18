"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { trackSiteEvent } from "@/lib/client-tracking";
import { isWorkEmail } from "@/lib/pricing/waitlist";

const intents = ["Investment Deal Flow", "Sales Leads", "Hiring"];

export function PricingClient() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState(intents[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isWorkEmail(email)) {
      setError("Please use a valid work email (not a free personal domain).");
      return;
    }

    setLoading(true);
    const response = await fetch("/api/pricing/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        work_email: email.trim(),
        intent,
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok || !result.success) {
      setError(result.error ?? "Failed to submit waitlist request.");
      return;
    }

    trackSiteEvent({
      event_name: "pricing_waitlist_submit",
      path: "/pricing",
      payload: {
        intent,
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
      },
    });
    setSuccess(true);
    setName("");
    setEmail("");
    setIntent(intents[0]);
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur-[40px]"
      >
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Access the top 1% of Indian Founders.
        </h1>
        <p className="mt-4 max-w-xl text-zinc-300">
          Built for investors, sales teams, and operators who need verified contact intelligence and real-time startup signals.
        </p>

        <ul className="mt-8 space-y-3">
          <li className="text-base text-zinc-200">✓ Verified Emails</li>
          <li className="text-base text-zinc-200">✓ Monthly Data Refresh</li>
          <li className="text-base text-zinc-200">✓ API Access</li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.46, delay: 0.08, ease: "easeOut" }}
        className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 backdrop-blur-[40px]"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Membership is currently invite-only.
        </h2>
        <p className="mt-3 text-sm text-zinc-300">
          Join the waitlist to secure the &quot;Founding Member&quot; rate ($49/mo vs $99/mo).
        </p>
        <Link
          href="/get-featured"
          onClick={() =>
            trackSiteEvent({
              event_name: "cta_click",
              path: "/pricing",
              payload: {
                cta_label: "Founder? Apply to Get Featured",
                cta_target: "/get-featured",
                section: "pricing_waitlist",
              },
            })
          }
          className="mt-4 inline-flex items-center rounded-md border border-indigo-400/45 bg-indigo-500/15 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/25"
        >
          Founder? Apply to Get Featured
        </Link>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
              Name
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#6366f1]/60 focus:outline-none"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
              Work Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#6366f1]/60 focus:outline-none"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
              I am looking for...
            </label>
            <select
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-100 focus:border-[#6366f1]/60 focus:outline-none"
            >
              {intents.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="glass-cta-btn w-full justify-center disabled:opacity-70">
            {loading ? "Submitting..." : "Secure My Spot"}
          </button>
        </form>

        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
        {success ? (
          <p className="mt-3 text-xs text-emerald-300">
            You are on the list! We will email you a secure payment link within 24 hours.
          </p>
        ) : null}
      </motion.div>
    </section>
  );
}
