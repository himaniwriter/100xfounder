"use client";

import { useState } from "react";
import useSWR from "swr";

type AnalyticsResponse = {
  success: true;
  metrics: {
    getFeaturedStarts: number;
    getFeaturedSubmits: number;
    pricingWaitlistSubmits: number;
    searchSubmits: number;
  };
  topLandingPages: Array<{
    path: string;
    starts: number;
    conversions: number;
    conversionRate: number;
  }>;
  dailySeries: Array<{
    date: string;
    getFeaturedSubmits: number;
    pricingWaitlistSubmits: number;
    searchSubmits: number;
  }>;
};

const fetcher = async (url: string): Promise<AnalyticsResponse> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load conversion analytics");
  }
  return result;
};

export function AnalyticsDashboard() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const { data, error, isLoading } = useSWR<AnalyticsResponse>(
    `/api/admin/analytics/conversions?range=${range}`,
    fetcher,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Conversion Analytics</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Get Featured, pricing waitlist, and search conversion performance.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-white/15 bg-white/[0.03] p-1">
          {(["7d", "30d"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={
                range === value
                  ? "rounded-md bg-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200"
                  : "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
              }
            >
              {value.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-zinc-400">Loading analytics...</p> : null}
      {error ? <p className="text-sm text-red-300">{(error as Error).message}</p> : null}

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Get Featured Starts</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.metrics.getFeaturedStarts}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Get Featured Submits</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.metrics.getFeaturedSubmits}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Pricing Waitlist</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.metrics.pricingWaitlistSubmits}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Search Submits</p>
              <p className="mt-2 text-2xl font-semibold text-white">{data.metrics.searchSubmits}</p>
            </div>
          </div>

          <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
              Top Landing Pages by Conversion Rate
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Path</th>
                    <th className="px-2 py-2">Starts</th>
                    <th className="px-2 py-2">Conversions</th>
                    <th className="px-2 py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topLandingPages.map((row) => (
                    <tr key={row.path} className="border-b border-white/10 last:border-0">
                      <td className="px-2 py-2 text-zinc-200">{row.path}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.starts}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.conversions}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Daily Series</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Featured Submits</th>
                    <th className="px-2 py-2">Waitlist Submits</th>
                    <th className="px-2 py-2">Search Submits</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailySeries.map((row) => (
                    <tr key={row.date} className="border-b border-white/10 last:border-0">
                      <td className="px-2 py-2 text-zinc-200">{row.date}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.getFeaturedSubmits}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.pricingWaitlistSubmits}</td>
                      <td className="px-2 py-2 text-zinc-300">{row.searchSubmits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
