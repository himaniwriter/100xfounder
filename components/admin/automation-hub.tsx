"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

type AutomationAction = "news_scraper" | "sync_newsletter" | "enrich_data";

const cards: Array<{
  title: string;
  description: string;
  action: AutomationAction;
  button: string;
}> = [
  {
    title: "Trigger News Scraper",
    description: "Run the latest startup/funding ingestion pipeline in N8N.",
    action: "news_scraper",
    button: "Run Scraper",
  },
  {
    title: "Sync Newsletter Subscribers",
    description: "Push Supabase leads into your email platform workflow.",
    action: "sync_newsletter",
    button: "Sync Subscribers",
  },
  {
    title: "Enrich Missing Data",
    description: "Start AI + enrichment workflow for incomplete founder/company profiles.",
    action: "enrich_data",
    button: "Enrich Records",
  },
];

export function AutomationHub() {
  const [running, setRunning] = useState<AutomationAction | null>(null);
  const [logLines, setLogLines] = useState<string[]>([
    "Automation console ready. Trigger a workflow to see response logs.",
  ]);

  async function trigger(action: AutomationAction) {
    setRunning(action);
    setLogLines((current) => [
      `⏳ Triggering ${action} at ${new Date().toLocaleTimeString()}...`,
      ...current,
    ]);

    const response = await fetch("/api/admin/automations/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const result = await response.json();
    setRunning(null);

    if (!response.ok || !result.success) {
      const line = `❌ ${result.error ?? result.log ?? "Automation trigger failed."}`;
      setLogLines((current) => [line, ...current]);
      return;
    }

    setLogLines((current) => [result.log ?? "✅ Workflow completed.", ...current]);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Automation Hub</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Trigger n8n workflows manually and inspect the latest execution response.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const isRunning = running === card.action;
          return (
            <div
              key={card.action}
              className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md"
            >
              <h2 className="text-base font-medium text-white">{card.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">{card.description}</p>

              <button
                type="button"
                onClick={() => trigger(card.action)}
                disabled={Boolean(running)}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-[#6366f1] px-3 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
              >
                {isRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                {isRunning ? "Running..." : card.button}
              </button>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/15 bg-black/40 p-4 font-mono text-xs backdrop-blur-md">
        <p className="mb-3 text-zinc-400">Status Logs</p>
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {logLines.map((line, index) => (
            <p key={`${line}-${index}`} className="text-zinc-300">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
