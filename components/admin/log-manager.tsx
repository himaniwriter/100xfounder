"use client";

import { useMemo, useState } from "react";
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

const fetcher = async (url: string): Promise<AdminLogsResponse> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load logs");
  }
  return result;
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

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("scope", scope);
    params.set("limit", "200");
    if (pathFilter) {
      params.set("path", pathFilter);
    }
    return params.toString();
  }, [scope, pathFilter]);

  const { data, error, isLoading, mutate, isValidating } = useSWR<AdminLogsResponse>(
    `/api/admin/logs?${query}`,
    fetcher,
  );

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
            onClick={() => mutate()}
            className="glass-ghost-btn glass-ghost-btn-compact"
          >
            {isValidating ? "Refreshing..." : "Refresh"}
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
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-2 py-4 text-zinc-400" colSpan={5}>
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

