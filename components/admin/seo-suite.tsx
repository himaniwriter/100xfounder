"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

type SiteSettings = {
  headCode: string;
  bodyCode: string;
  defaultMetaTitle: string;
  defaultOgImageUrl: string;
  twitterHandle: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  headCode: "",
  bodyCode: "",
  defaultMetaTitle: "",
  defaultOgImageUrl: "",
  twitterHandle: "",
};

const fetcher = async (url: string): Promise<SiteSettings> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load settings");
  }
  return result.settings as SiteSettings;
};

export function SeoSuite() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/settings", fetcher);
  const [form, setForm] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        setStatus({
          type: "error",
          message: `Failed to save configuration: ${result.error ?? "Unknown error."}`,
        });
        return;
      }

      setStatus({ type: "success", message: "Configuration saved successfully." });
      await mutate();
    } catch (saveError) {
      setStatus({
        type: "error",
        message:
          saveError instanceof Error
            ? `Failed to save configuration: ${saveError.message}`
            : "Failed to save configuration.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Marketing & SEO Suite</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage global scripts, tracking pixels, and metadata defaults.
        </p>
      </div>

      <form
        onSubmit={onSave}
        className="space-y-4 rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md"
      >
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading settings...</p>
        ) : error ? (
          <p className="text-sm text-red-300">{(error as Error).message}</p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
                  Default Meta Title
                </label>
                <input
                  value={form.defaultMetaTitle}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, defaultMetaTitle: event.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
                  Default OG Image URL
                </label>
                <input
                  value={form.defaultOgImageUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, defaultOgImageUrl: event.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
                Twitter Handle
              </label>
              <input
                value={form.twitterHandle}
                onChange={(event) =>
                  setForm((current) => ({ ...current, twitterHandle: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
                Head Code
              </label>
              <textarea
                value={form.headCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, headCode: event.target.value }))
                }
                rows={8}
                placeholder="Paste Search Console verification, GTM, custom script, or CSS."
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wide text-zinc-400">
                Body Code
              </label>
              <textarea
                value={form.bodyCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bodyCode: event.target.value }))
                }
                rows={6}
                placeholder="Paste noscript tags or body-end tracking scripts."
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving || isLoading}
          className="inline-flex h-10 items-center rounded-md bg-[#6366f1] px-4 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </form>

      {status ? (
        <p
          className={
            status.type === "success"
              ? "rounded-md border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
              : "rounded-md border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-200"
          }
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}
