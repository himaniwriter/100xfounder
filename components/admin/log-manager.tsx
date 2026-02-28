"use client";

import { useMemo, useState, type FormEvent } from "react";
import useSWR from "swr";

type LogScope = "404" | "all";

type AdminLogsResponse = {
  success: true;
  scope: LogScope;
  summary: {
    total: number;
    last24h: number;
    uniquePaths: number;
    eventsByType: Array<{
      eventName: string;
      count: number;
    }>;
  };
  logs: Array<{
    id: string;
    event_name: string;
    path: string;
    referrer: string | null;
    session_id: string | null;
    payload: unknown;
    created_at: string;
  }>;
};

type RedirectRule = {
  id: string;
  source_path: string;
  target_url: string;
  is_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type AdminRedirectsResponse = {
  success: true;
  redirects: RedirectRule[];
};

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load data");
  }
  return result as T;
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LogManager() {
  const [scope, setScope] = useState<LogScope>("404");
  const [pathInput, setPathInput] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [redirectRuleId, setRedirectRuleId] = useState<string | null>(null);
  const [redirectSourcePath, setRedirectSourcePath] = useState("");
  const [redirectTargetUrl, setRedirectTargetUrl] = useState("");
  const [redirectNote, setRedirectNote] = useState("");
  const [redirectIsActive, setRedirectIsActive] = useState(true);
  const [isSavingRedirect, setIsSavingRedirect] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", "200");
    if (pathFilter) {
      params.set("path", pathFilter);
    }
    return params.toString();
  }, [scope, pathFilter]);

  const redirectQuery = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (pathFilter) {
      params.set("path", pathFilter);
    }
    return params.toString();
  }, [pathFilter]);

  const { data, error, isLoading, mutate, isValidating } = useSWR<AdminLogsResponse>(
    `/api/admin/logs?${query}`,
    fetcher,
  );

  const {
    data: redirectData,
    error: redirectError,
    mutate: mutateRedirects,
    isValidating: isRedirectsValidating,
  } = useSWR<AdminRedirectsResponse>(`/api/admin/redirects?${redirectQuery}`, fetcher);

  const resetRedirectForm = () => {
    setRedirectRuleId(null);
    setRedirectSourcePath("");
    setRedirectTargetUrl("");
    setRedirectNote("");
    setRedirectIsActive(true);
  };

  const prefillRedirectForm = (path: string) => {
    const existing = redirectData?.redirects.find((item) => item.source_path === path);
    if (existing) {
      setRedirectRuleId(existing.id);
      setRedirectSourcePath(existing.source_path);
      setRedirectTargetUrl(existing.target_url);
      setRedirectNote(existing.note ?? "");
      setRedirectIsActive(existing.is_active);
      return;
    }

    setRedirectRuleId(null);
    setRedirectSourcePath(path);
    setRedirectTargetUrl("");
    setRedirectNote("");
    setRedirectIsActive(true);
  };

  const clearLogs = async () => {
    const confirmed = window.confirm(
      scope === "404"
        ? "Clear all 404 logs for the selected filter?"
        : "Clear all logs for the selected filter?",
    );
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/logs?${query}`, { method: "DELETE" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.success) {
      alert(result?.error ?? "Failed to clear logs.");
      return;
    }

    await mutate();
  };

  const saveRedirectRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!redirectSourcePath.trim() || !redirectTargetUrl.trim()) {
      alert("Source path and target URL are required.");
      return;
    }

    setIsSavingRedirect(true);
    const response = await fetch("/api/admin/redirects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_path: redirectSourcePath.trim(),
        target_url: redirectTargetUrl.trim(),
        note: redirectNote.trim() || null,
        is_active: redirectIsActive,
      }),
    });

    const result = await response.json().catch(() => null);
    setIsSavingRedirect(false);

    if (!response.ok || !result?.success) {
      alert(result?.error ?? "Failed to save redirect rule.");
      return;
    }

    await Promise.all([mutate(), mutateRedirects()]);
    if (result.rule) {
      setRedirectRuleId(result.rule.id);
    }
  };

  const toggleRedirectRule = async (rule: RedirectRule) => {
    const response = await fetch(`/api/admin/redirects/${rule.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: !rule.is_active,
      }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      alert(result?.error ?? "Failed to update redirect rule.");
      return;
    }

    await mutateRedirects();
  };

  const deleteRedirectRule = async (rule: RedirectRule) => {
    const confirmed = window.confirm(`Delete redirect for ${rule.source_path}?`);
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/redirects/${rule.id}`, {
      method: "DELETE",
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.success) {
      alert(result?.error ?? "Failed to delete redirect rule.");
      return;
    }

    await mutateRedirects();
    if (redirectRuleId === rule.id) {
      resetRedirectForm();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Log Manager</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Monitor 404 events and operational logs captured from live traffic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void Promise.all([mutate(), mutateRedirects()]);
            }}
            className="glass-ghost-btn glass-ghost-btn-compact"
          >
            {isValidating || isRedirectsValidating ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={clearLogs}
            className="glass-ghost-btn glass-ghost-btn-compact border-red-400/30 bg-red-500/10 text-red-200 hover:border-red-300/40 hover:bg-red-500/20"
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-white/15 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Scope</p>
          <div className="mt-2 inline-flex rounded-md border border-white/15 bg-white/[0.03] p-1">
            {(["404", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={
                  scope === value
                    ? "rounded-md bg-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200"
                    : "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
                }
              >
                {value === "404" ? "404 Only" : "All Events"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Path Filter</p>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setPathFilter(pathInput.trim());
            }}
          >
            <input
              value={pathInput}
              onChange={(event) => setPathInput(event.target.value)}
              placeholder="/blog"
              className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
            />
            <button type="submit" className="glass-ghost-btn glass-ghost-btn-compact px-3">
              Apply
            </button>
          </form>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total Logs</p>
          <p className="mt-2 text-2xl font-semibold text-white">{data?.summary.total ?? 0}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Last 24h</p>
          <p className="mt-2 text-2xl font-semibold text-white">{data?.summary.last24h ?? 0}</p>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-zinc-400">Loading logs...</p> : null}
      {error ? <p className="text-sm text-red-300">{(error as Error).message}</p> : null}
      {redirectError ? <p className="text-sm text-red-300">{(redirectError as Error).message}</p> : null}

      {data ? (
        <>
          <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">Event Mix</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.summary.eventsByType.map((event) => (
                <span
                  key={event.eventName}
                  className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-zinc-300"
                >
                  {event.eventName}: {event.count}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
                Redirect Rules For Broken URLs
              </h2>
              <button
                type="button"
                onClick={resetRedirectForm}
                className="glass-ghost-btn glass-ghost-btn-compact"
              >
                New Rule
              </button>
            </div>

            <form className="mt-3 grid gap-3 md:grid-cols-2" onSubmit={saveRedirectRule}>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-500">Source Path</span>
                <input
                  value={redirectSourcePath}
                  onChange={(event) => setRedirectSourcePath(event.target.value)}
                  placeholder="/blog/old-slug"
                  className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs uppercase tracking-wide text-zinc-500">Target URL</span>
                <input
                  value={redirectTargetUrl}
                  onChange={(event) => setRedirectTargetUrl(event.target.value)}
                  placeholder="/blog/new-slug or https://example.com/path"
                  className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
                  required
                />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="text-xs uppercase tracking-wide text-zinc-500">Admin Note</span>
                <input
                  value={redirectNote}
                  onChange={(event) => setRedirectNote(event.target.value)}
                  placeholder="Reason for redirect (optional)"
                  className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/50"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-300 md:col-span-2">
                <input
                  type="checkbox"
                  checked={redirectIsActive}
                  onChange={(event) => setRedirectIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-black/20 text-indigo-400"
                />
                Redirect active
              </label>
              <div className="md:col-span-2 flex items-center gap-2">
                <button type="submit" className="glass-cta-btn">
                  {isSavingRedirect ? "Saving..." : redirectRuleId ? "Update Redirect" : "Save Redirect"}
                </button>
                {redirectRuleId ? (
                  <span className="text-xs text-zinc-500">Editing existing rule</span>
                ) : null}
              </div>
            </form>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Source</th>
                    <th className="px-2 py-2">Target</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Updated</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(redirectData?.redirects ?? []).length > 0 ? (
                    (redirectData?.redirects ?? []).map((rule) => (
                      <tr key={rule.id} className="border-b border-white/10 align-top last:border-0">
                        <td className="max-w-[220px] px-2 py-2 font-mono text-xs text-zinc-200">
                          {rule.source_path}
                        </td>
                        <td className="max-w-[320px] px-2 py-2 text-zinc-300">{rule.target_url}</td>
                        <td className="px-2 py-2">
                          <span
                            className={
                              rule.is_active
                                ? "rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                                : "rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-1 text-xs text-zinc-300"
                            }
                          >
                            {rule.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-zinc-500">
                          {formatDate(rule.updated_at)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRedirectRuleId(rule.id);
                                setRedirectSourcePath(rule.source_path);
                                setRedirectTargetUrl(rule.target_url);
                                setRedirectNote(rule.note ?? "");
                                setRedirectIsActive(rule.is_active);
                              }}
                              className="glass-ghost-btn glass-ghost-btn-compact"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void toggleRedirectRule(rule);
                              }}
                              className="glass-ghost-btn glass-ghost-btn-compact"
                            >
                              {rule.is_active ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                void deleteRedirectRule(rule);
                              }}
                              className="glass-ghost-btn glass-ghost-btn-compact border-red-400/30 bg-red-500/10 text-red-200 hover:border-red-300/40 hover:bg-red-500/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-2 py-4 text-zinc-400" colSpan={5}>
                        No redirect rules configured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-white/15 bg-white/[0.03] p-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400">
              Recent Logs
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-zinc-500">
                  <tr>
                    <th className="px-2 py-2">Time</th>
                    <th className="px-2 py-2">Event</th>
                    <th className="px-2 py-2">Path</th>
                    <th className="px-2 py-2">Referrer</th>
                    <th className="px-2 py-2">Session</th>
                    <th className="px-2 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.length > 0 ? (
                    data.logs.map((row) => (
                      <tr key={row.id} className="border-b border-white/10 align-top last:border-0">
                        <td className="whitespace-nowrap px-2 py-2 text-zinc-300">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 text-zinc-200">{row.event_name}</td>
                        <td className="max-w-[260px] px-2 py-2 text-zinc-100">{row.path}</td>
                        <td className="max-w-[260px] px-2 py-2 text-zinc-400">
                          {row.referrer || "—"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 font-mono text-xs text-zinc-500">
                          {row.session_id || "—"}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2">
                          {row.event_name === "page_not_found" ? (
                            <button
                              type="button"
                              onClick={() => prefillRedirectForm(row.path)}
                              className="glass-ghost-btn glass-ghost-btn-compact"
                            >
                              Add Redirect
                            </button>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-2 py-4 text-zinc-400" colSpan={6}>
                        No logs found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
