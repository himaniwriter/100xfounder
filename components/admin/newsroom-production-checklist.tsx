"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

type ChecklistHook = {
  key: string;
  label: string;
  required: boolean;
  configured: boolean;
  maskedUrl: string;
  confirmed: boolean;
  statusCode?: number;
  responseSnippet?: string;
  error?: string;
};

type ChecklistStory = {
  slug: string;
  title: string;
  publishedAt: string;
  updatedAt: string;
  correctionNote: string;
  correctionUpdates: number;
  latestCorrectionAt?: string;
  hasCorrection: boolean;
};

type ChecklistResponse = {
  checkedAt: string;
  editorialSla: {
    editorialReviewSlaHours: number | null;
    correctionsResponseSlaHours: number | null;
    publishCadencePerDay: number | null;
  };
  correctionAudit: {
    totalCorrectedStories: number;
    stories: ChecklistStory[];
  };
  hooks: ChecklistHook[];
  checks: Array<{
    key: string;
    label: string;
    passed: boolean;
  }>;
};

type SettingsPayload = {
  editorialReviewSlaHours?: string;
  correctionsResponseSlaHours?: string;
  publishCadencePerDay?: string;
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Request failed");
  }
  return result;
};

function formatDate(value?: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function NewsroomProductionChecklist() {
  const checklistState = useSWR<{ success: true } & ChecklistResponse>(
    "/api/admin/newsroom/checklist",
    (url: string) => fetcher<{ success: true } & ChecklistResponse>(url),
  );

  const [slaForm, setSlaForm] = useState({
    editorialReviewSlaHours: "24",
    correctionsResponseSlaHours: "48",
    publishCadencePerDay: "8",
  });
  const [savingSla, setSavingSla] = useState(false);
  const [confirmingHooks, setConfirmingHooks] = useState(false);
  const [hookConfirmResult, setHookConfirmResult] = useState<ChecklistHook[] | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const checksSummary = useMemo(() => {
    const checks = checklistState.data?.checks ?? [];
    const passed = checks.filter((item) => item.passed).length;
    return {
      passed,
      total: checks.length,
    };
  }, [checklistState.data]);

  useEffect(() => {
    if (!checklistState.data) {
      return;
    }

    setSlaForm({
      editorialReviewSlaHours:
        checklistState.data.editorialSla.editorialReviewSlaHours?.toString() ?? "24",
      correctionsResponseSlaHours:
        checklistState.data.editorialSla.correctionsResponseSlaHours?.toString() ?? "48",
      publishCadencePerDay:
        checklistState.data.editorialSla.publishCadencePerDay?.toString() ?? "8",
    });
  }, [checklistState.data]);

  async function saveSla() {
    setSavingSla(true);
    setStatusMessage(null);

    const payload: SettingsPayload = {
      editorialReviewSlaHours: slaForm.editorialReviewSlaHours.trim(),
      correctionsResponseSlaHours: slaForm.correctionsResponseSlaHours.trim(),
      publishCadencePerDay: slaForm.publishCadencePerDay.trim(),
    };

    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setSavingSla(false);

    if (!response.ok || !result?.success) {
      setStatusMessage(result?.error ?? "Failed to save editorial SLA fields.");
      return;
    }

    setStatusMessage("Editorial SLA fields updated.");
    await checklistState.mutate();
  }

  async function confirmHooks() {
    setConfirmingHooks(true);
    setStatusMessage(null);
    setHookConfirmResult(null);

    const response = await fetch("/api/admin/newsroom/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_hooks" }),
    });
    const result = await response.json().catch(() => null);
    setConfirmingHooks(false);

    if (!response.ok || !result?.success) {
      setStatusMessage(result?.error ?? "Failed to run n8n hook confirmations.");
      return;
    }

    setHookConfirmResult(result.hooks as ChecklistHook[]);
    setStatusMessage(result.passed ? "All required hooks confirmed." : "One or more required hook confirmations failed.");
    await checklistState.mutate();
  }

  const checklist = checklistState.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Newsroom Production Checklist</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Final pre-deploy gate for editorial SLA, corrections audit, and n8n publish/distribution confirmations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Checklist Status</h2>
          <p className="mt-2 text-sm text-zinc-300">
            {checksSummary.passed}/{checksSummary.total} checks passing
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Last checked: {formatDate(checklist?.checkedAt)}
          </p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Quick Links</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/news-sitemap.xml" className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-300 hover:border-white/30 hover:text-white">
              News Sitemap
            </Link>
            <Link href="/ai-sitemap-news.xml" className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-300 hover:border-white/30 hover:text-white">
              AI News Sitemap
            </Link>
            <Link href="/rss.xml" className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-300 hover:border-white/30 hover:text-white">
              RSS
            </Link>
            <Link href="/atom.xml" className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-300 hover:border-white/30 hover:text-white">
              Atom
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Editorial SLA Fields</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Required for newsroom ops readiness and internal quality benchmarking.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
              Review SLA (hours)
            </label>
            <input
              value={slaForm.editorialReviewSlaHours}
              onChange={(event) =>
                setSlaForm((current) => ({ ...current, editorialReviewSlaHours: event.target.value }))
              }
              className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
              Corrections SLA (hours)
            </label>
            <input
              value={slaForm.correctionsResponseSlaHours}
              onChange={(event) =>
                setSlaForm((current) => ({ ...current, correctionsResponseSlaHours: event.target.value }))
              }
              className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-500">
              Cadence Target (posts/day)
            </label>
            <input
              value={slaForm.publishCadencePerDay}
              onChange={(event) =>
                setSlaForm((current) => ({ ...current, publishCadencePerDay: event.target.value }))
              }
              className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveSla}
            disabled={savingSla}
            className="inline-flex h-10 items-center rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {savingSla ? "Saving..." : "Save SLA Fields"}
          </button>
          <p className="text-xs text-zinc-500">
            Current: review {checklist?.editorialSla.editorialReviewSlaHours ?? "-"}h, corrections{" "}
            {checklist?.editorialSla.correctionsResponseSlaHours ?? "-"}h, cadence{" "}
            {checklist?.editorialSla.publishCadencePerDay ?? "-"} posts/day
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">n8n Hook Confirmations</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Confirms publish and distribution webhooks are configured and reachable.
            </p>
          </div>
          <button
            type="button"
            onClick={confirmHooks}
            disabled={confirmingHooks}
            className="inline-flex h-10 items-center rounded-md border border-white/15 bg-white/[0.03] px-4 text-sm text-zinc-100 hover:border-white/30 disabled:opacity-60"
          >
            {confirmingHooks ? "Confirming..." : "Run Hook Confirmations"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {(hookConfirmResult ?? checklist?.hooks ?? []).map((hook) => (
            <div key={hook.key} className="rounded-lg border border-white/10 bg-black/30 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-white">{hook.label}</p>
                {hook.required ? (
                  <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-200">
                    required
                  </span>
                ) : (
                  <span className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-300">
                    optional
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-500">{hook.maskedUrl}</p>
              <p className="mt-1 text-xs text-zinc-300">
                {hook.confirmed
                  ? `Confirmed (${hook.statusCode ?? 200})`
                  : hook.configured
                    ? hook.error || "Configured but not yet confirmed in this run."
                    : "Not configured"}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">Correction Audit UI</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Published stories with correction notes or correction update logs.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {checklist?.correctionAudit.totalCorrectedStories ?? 0} corrected stories tracked.
        </p>

        <div className="mt-4 space-y-2">
          {checklist?.correctionAudit.stories?.length ? (
            checklist.correctionAudit.stories.map((story) => (
              <div key={story.slug} className="rounded-lg border border-white/10 bg-black/30 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/content/blog/${story.slug}`}
                    className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    {story.title}
                  </Link>
                  <span className="rounded-full border border-white/15 bg-white/[0.03] px-2 py-0.5 text-[11px] text-zinc-300">
                    updates: {story.correctionUpdates}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Latest correction: {formatDate(story.latestCorrectionAt)} • Updated: {formatDate(story.updatedAt)}
                </p>
                {story.correctionNote ? (
                  <p className="mt-2 text-xs text-zinc-300">{story.correctionNote}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">No corrected published stories found yet.</p>
          )}
        </div>
      </section>

      {checklistState.isLoading ? (
        <p className="text-sm text-zinc-400">Loading checklist...</p>
      ) : null}
      {checklistState.error ? (
        <p className="rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {(checklistState.error as Error).message}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
