"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

type SubmissionRow = {
  id: string;
  featuredRequestId: string | null;
  founderName: string;
  workEmail: string;
  companyName: string;
  responsesJson: Record<string, string>;
  assetLinksJson: string[] | null;
  externalSubmissionId: string | null;
  status: "new" | "in_review" | "approved" | "rejected" | "published";
  source: string;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  featuredRequest?: {
    id: string;
    founderName: string;
    companyName: string;
    status: string;
    publishedFounderEntryId: string | null;
  } | null;
};

type ApiResponse = {
  success: true;
  submissions: SubmissionRow[];
};

const tabs: Array<{ key: "all" | SubmissionRow["status"]; label: string }> = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_review", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "published", label: "Published" },
];

const fetcher = async (url: string): Promise<ApiResponse> => {
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error ?? "Failed to load interview submissions");
  }
  return result;
};

function actionLabel(action: "move_to_in_review" | "approve" | "reject" | "publish") {
  if (action === "move_to_in_review") return "Move to In Review";
  if (action === "approve") return "Approve";
  if (action === "reject") return "Reject";
  return "Publish";
}

function actionsForStatus(status: SubmissionRow["status"]) {
  if (status === "new") return ["move_to_in_review", "approve", "reject"] as const;
  if (status === "in_review") return ["approve", "reject"] as const;
  if (status === "approved") return ["publish", "reject"] as const;
  if (status === "rejected") return ["move_to_in_review"] as const;
  return [] as const;
}

export function InterviewSubmissionsPanel() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["key"]>("new");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const query = activeTab === "all" ? "" : `?status=${activeTab}`;
  const { data, error, isLoading, mutate } = useSWR(`/api/admin/interview-submissions${query}`, fetcher);

  const rows = useMemo(() => data?.submissions ?? [], [data]);

  async function patchRow(
    id: string,
    action: "move_to_in_review" | "approve" | "reject" | "publish",
  ) {
    setSavingId(id);
    setStatusMessage(null);

    const response = await fetch(`/api/admin/interview-submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        reviewNotes: notesById[id] ?? undefined,
      }),
    });

    const result = await response.json();
    setSavingId(null);

    if (!response.ok || !result.success) {
      setStatusMessage(result.error ?? "Failed to update submission.");
      return;
    }

    setStatusMessage(`Updated: ${actionLabel(action)}`);
    await mutate();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Interview Submissions</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review founder interview questionnaire responses before newsroom publish.
        </p>
      </div>

      <div className="inline-flex rounded-md border border-white/15 bg-white/[0.03] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={
              activeTab === tab.key
                ? "rounded-md bg-indigo-500/20 px-3 py-1.5 text-sm text-indigo-200"
                : "rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? <p className="text-sm text-zinc-400">Loading submissions...</p> : null}
        {error ? <p className="text-sm text-red-300">{(error as Error).message}</p> : null}
        {!isLoading && !error && rows.length === 0 ? (
          <p className="text-sm text-zinc-500">No submissions found.</p>
        ) : null}

        {rows.map((row) => (
          <article
            key={row.id}
            className="rounded-xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-medium text-white">
                  {row.founderName} - {row.companyName}
                </h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {row.workEmail} • Status: {row.status} • Source: {row.source}
                </p>
                {row.featuredRequest ? (
                  <p className="mt-1 text-xs text-zinc-500">
                    Linked featured request: {row.featuredRequest.id} ({row.featuredRequest.status})
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-zinc-500">Created {new Date(row.createdAt).toLocaleString()}</p>
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Response Preview</p>
              <div className="mt-2 space-y-2">
                {Object.entries(row.responsesJson || {})
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <p key={key} className="text-xs text-zinc-300">
                      <span className="font-medium text-zinc-200">{key.replace(/_/g, " ")}:</span>{" "}
                      {String(value).slice(0, 200)}
                    </p>
                  ))}
              </div>
            </div>

            {Array.isArray(row.assetLinksJson) && row.assetLinksJson.length > 0 ? (
              <p className="mt-2 text-xs text-zinc-400">Assets: {row.assetLinksJson.join(" | ")}</p>
            ) : null}

            <textarea
              rows={2}
              value={notesById[row.id] ?? row.reviewNotes ?? ""}
              onChange={(event) =>
                setNotesById((current) => ({
                  ...current,
                  [row.id]: event.target.value,
                }))
              }
              placeholder="Review notes..."
              className="mt-3 w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs text-zinc-100"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {actionsForStatus(row.status).map((action) => (
                <button
                  key={`${row.id}-${action}`}
                  type="button"
                  onClick={() => patchRow(row.id, action)}
                  disabled={savingId === row.id}
                  className="rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-white/30 disabled:opacity-70"
                >
                  {savingId === row.id ? "Saving..." : actionLabel(action)}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {statusMessage ? (
        <p className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
