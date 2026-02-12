"use client";

import { useState } from "react";
import { Bell, Check, X } from "lucide-react";

type CompanyFollowActionsProps = {
  companyName: string;
  companyTopic: string;
};

export function CompanyFollowActions({
  companyName,
  companyTopic,
}: CompanyFollowActionsProps) {
  const [following, setFollowing] = useState(false);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topic: companyTopic }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error ?? "Subscription failed.");
        return;
      }
      setSubscribed(true);
      setEmail("");
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFollowing((value) => !value)}
          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-white/20 hover:text-white"
        >
          {following ? "Following" : "Follow"}
        </button>
        <button
          type="button"
          aria-label={`Get weekly updates on ${companyName}`}
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_0_35px_rgba(99,102,241,0.25)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Get weekly updates on {companyName}?
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Subscribe for funding, hiring, and growth signal alerts.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {subscribed ? (
              <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                <Check className="h-4 w-4" />
                Subscription confirmed.
              </p>
            ) : (
              <form onSubmit={onSubscribe} className="mt-5 space-y-3">
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-[#6366f1]/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-[#6366f1] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
                >
                  {loading ? "Saving..." : "Subscribe"}
                </button>
              </form>
            )}

            {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
