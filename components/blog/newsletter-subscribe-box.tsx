"use client";

import { useState } from "react";

type NewsletterSubscribeBoxProps = {
  topic?: string;
};

export function NewsletterSubscribeBox({
  topic = "startup-intelligence",
}: NewsletterSubscribeBoxProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error ?? "Subscription failed.");
        setLoading(false);
        return;
      }

      setMessage("Subscribed. Check your inbox for confirmation.");
      setEmail("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="sticky top-24 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md">
      <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
        Subscribe to Newsletter
      </h3>
      <p className="mt-2 text-sm text-zinc-400">
        Weekly funding signals, founder analysis, and high-value market updates.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#6366f1]/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
        >
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {message ? <p className="mt-3 text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
    </aside>
  );
}
