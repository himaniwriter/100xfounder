"use client";

import { useState } from "react";
import useSWR from "swr";

type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  votesCount: number;
  launchedAt: string;
  isPublished: boolean;
  websiteUrl: string | null;
  contactsCheckedAt: string | null;
};

type Contact = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  step: number;
  nextSendAt: string | null;
  lastSentAt: string | null;
  product: { name: string; slug: string };
};

type Spotlight = {
  id: string;
  slug: string;
  founderName: string;
  role: string | null;
  status: string;
  storyOrigin: string;
  consentInstagram: boolean;
  createdAt: string;
  product: { name: string; slug: string };
};

type InstagramItem = {
  id: string;
  kind: string;
  title: string;
  caption: string;
  slideCount: number;
  status: string;
  createdAt: string;
};

type ApiResponse = {
  success: true;
  config: {
    productHunt: boolean;
    outreachEnabled: boolean;
    smtp: boolean;
    imap: boolean;
    postalAddress: boolean;
    dailyLimit: number;
    autoPublish: boolean;
  };
  stats: { sentLast24h: number; byStatus: Record<string, number> };
  products: Product[];
  contacts: Contact[];
  spotlights: Spotlight[];
  instagram: InstagramItem[];
};

const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load");
  }
  return result;
};

const card = "rounded-xl border border-white/10 bg-white/[0.02] p-5";
const button =
  "rounded-md border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10 disabled:opacity-50";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs ${
        ok ? "border-emerald-400/30 text-emerald-200" : "border-amber-400/30 text-amber-200"
      }`}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}

export function LaunchOutreachPanel() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/launch-outreach", fetcher);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function act(key: string, body: Record<string, unknown>) {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/launch-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Action failed");
      if (result.results) {
        setMessage(
          (result.results as Array<{ stage: string; ok: boolean; result?: unknown; error?: string }>)
            .map((stage) => `${stage.ok ? "✓" : "✗"} ${stage.stage}: ${stage.ok ? JSON.stringify(stage.result) : stage.error}`)
            .join("\n"),
        );
      }
      await mutate();
    } catch (actionError) {
      setMessage(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  if (isLoading) return <p className="text-zinc-400">Loading…</p>;
  if (error || !data) return <p className="text-red-300">{error?.message || "Failed to load"}</p>;

  const pendingSpotlights = data.spotlights.filter((spotlight) => spotlight.status === "submitted");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-white">Launch Outreach</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Daily routine: import Product Hunt launches → find contacts → email founders → publish spotlights → Instagram.
        </p>
      </header>

      <section className={card}>
        <div className="flex flex-wrap gap-2">
          <StatusChip ok={data.config.productHunt} label="Product Hunt token" />
          <StatusChip ok={data.config.smtp} label="SMTP" />
          <StatusChip ok={data.config.imap} label="IMAP (reply detection)" />
          <StatusChip ok={data.config.postalAddress} label="Postal address" />
          <StatusChip ok={data.config.outreachEnabled} label="Outreach sending enabled" />
          <StatusChip ok={data.config.autoPublish} label="Auto-publish spotlights" />
        </div>
        <p className="mt-3 text-sm text-zinc-400">
          Sent in last 24h: {data.stats.sentLast24h} / {data.config.dailyLimit} daily limit ·{" "}
          {Object.entries(data.stats.byStatus)
            .map(([status, count]) => `${status}: ${count}`)
            .join(" · ") || "no contacts yet"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={button} disabled={busy !== null} onClick={() => act("run", { action: "run" })}>
            {busy === "run" ? "Running…" : "Run full daily routine now"}
          </button>
          {(["import", "contacts", "replies", "send", "digest"] as const).map((stage) => (
            <button
              key={stage}
              className={button}
              disabled={busy !== null}
              onClick={() => act(`run-${stage}`, { action: "run", stages: [stage] })}
            >
              {busy === `run-${stage}` ? "Running…" : `Run ${stage}`}
            </button>
          ))}
        </div>
        {message ? <pre className="mt-4 whitespace-pre-wrap text-xs text-zinc-300">{message}</pre> : null}
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold text-white">Instagram queue</h2>
        <p className="mt-1 text-sm text-zinc-400">Download the slides, copy the caption, post, then mark as posted.</p>
        <div className="mt-4 space-y-5">
          {data.instagram.length === 0 ? <p className="text-sm text-zinc-500">Nothing queued yet.</p> : null}
          {data.instagram.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-white">
                  {item.title} <span className="text-xs text-zinc-500">({item.status})</span>
                </p>
                <div className="flex gap-2">
                  <button className={button} onClick={() => navigator.clipboard.writeText(item.caption)}>
                    Copy caption
                  </button>
                  <button
                    className={button}
                    disabled={busy !== null}
                    onClick={() => act(`ig-${item.id}`, { action: "mark_instagram", id: item.id, status: "posted" })}
                  >
                    Mark posted
                  </button>
                  <button
                    className={button}
                    disabled={busy !== null}
                    onClick={() => act(`ig-${item.id}`, { action: "mark_instagram", id: item.id, status: "skipped" })}
                  >
                    Skip
                  </button>
                </div>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {Array.from({ length: item.slideCount }, (_, slide) => {
                  const src = `/api/instagram/slide?item=${item.id}&slide=${slide}`;
                  return (
                    <a key={slide} href={src} download={`${item.id}-${slide + 1}.png`} title="Download slide">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Slide ${slide + 1}`} className="h-40 w-32 rounded border border-white/10 object-cover" loading="lazy" />
                    </a>
                  );
                })}
              </div>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-xs text-zinc-300">
                {item.caption}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold text-white">Spotlights awaiting review ({pendingSpotlights.length})</h2>
        <div className="mt-4 space-y-4">
          {pendingSpotlights.map((spotlight) => (
            <div key={spotlight.id} className="rounded-lg border border-white/10 p-4">
              <p className="font-medium text-white">
                {spotlight.founderName}
                {spotlight.role ? `, ${spotlight.role}` : ""}: {spotlight.product.name}
              </p>
              <p className="mt-2 text-sm text-zinc-300">{spotlight.storyOrigin}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Instagram consent: {spotlight.consentInstagram ? "yes" : "no"} · submitted {formatDate(spotlight.createdAt)}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className={button}
                  disabled={busy !== null}
                  onClick={() => act(`sp-${spotlight.id}`, { action: "publish_spotlight", id: spotlight.id })}
                >
                  Publish
                </button>
                <button
                  className={button}
                  disabled={busy !== null}
                  onClick={() => act(`sp-${spotlight.id}`, { action: "reject_spotlight", id: spotlight.id })}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
          {pendingSpotlights.length === 0 ? <p className="text-sm text-zinc-500">No submissions waiting.</p> : null}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold text-white">Outreach contacts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Emails sent</th>
                <th className="py-2 pr-4">Next send</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data.contacts.map((contact) => (
                <tr key={contact.id} className="border-t border-white/5">
                  <td className="py-2 pr-4">{contact.product.name}</td>
                  <td className="py-2 pr-4">{contact.email}</td>
                  <td className="py-2 pr-4">{contact.status}</td>
                  <td className="py-2 pr-4">{contact.step}</td>
                  <td className="py-2 pr-4">{formatDate(contact.nextSendAt)}</td>
                  <td className="py-2">
                    {["queued", "contacted"].includes(contact.status) ? (
                      <button
                        className={button}
                        disabled={busy !== null}
                        onClick={() => act(`c-${contact.id}`, { action: "pause_contact", id: contact.id })}
                      >
                        Stop
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold text-white">Imported launches</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-zinc-500">
              <tr>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Votes</th>
                <th className="py-2 pr-4">Launched</th>
                <th className="py-2 pr-4">Contact search</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {data.products.map((product) => (
                <tr key={product.id} className="border-t border-white/5">
                  <td className="py-2 pr-4">
                    <a href={`/launches/${product.slug}`} target="_blank" rel="noreferrer" className="text-white hover:underline">
                      {product.name}
                    </a>
                    <div className="text-xs text-zinc-500">{product.tagline}</div>
                  </td>
                  <td className="py-2 pr-4">{product.votesCount}</td>
                  <td className="py-2 pr-4">{formatDate(product.launchedAt)}</td>
                  <td className="py-2 pr-4">{product.contactsCheckedAt ? "done" : product.websiteUrl ? "pending" : "no website"}</td>
                  <td className="py-2">
                    <button
                      className={button}
                      disabled={busy !== null}
                      onClick={() =>
                        act(`p-${product.id}`, {
                          action: "set_product_published",
                          id: product.id,
                          published: !product.isPublished,
                        })
                      }
                    >
                      {product.isPublished ? "Hide" : "Show"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
