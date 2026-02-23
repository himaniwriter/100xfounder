"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { INTERVIEW_QUESTIONS } from "@/lib/outreach/constants";

type FormState = {
  founder_name: string;
  work_email: string;
  company_name: string;
  featured_request_id: string;
  responses: Record<string, string>;
  asset_links: string;
};

function createInitialResponses(): Record<string, string> {
  return Object.fromEntries(INTERVIEW_QUESTIONS.map((question) => [question.key, ""]));
}

export function InterviewQuestionnaireForm() {
  const searchParams = useSearchParams();
  const defaultRequestId = useMemo(
    () => searchParams.get("request_id") || searchParams.get("featured_request_id") || "",
    [searchParams],
  );

  const [form, setForm] = useState<FormState>({
    founder_name: "",
    work_email: "",
    company_name: "",
    featured_request_id: defaultRequestId,
    responses: createInitialResponses(),
    asset_links: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      founder_name: form.founder_name,
      work_email: form.work_email,
      company_name: form.company_name,
      featured_request_id: form.featured_request_id || undefined,
      responses: form.responses,
      asset_links: form.asset_links
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      source: "site_form",
    };

    const response = await fetch("/api/interview-questionnaire/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok || !result.success) {
      setError(result.error ?? "Failed to submit questionnaire.");
      return;
    }

    setSuccess("Received, editorial review in progress.");
    setForm((current) => ({
      founder_name: "",
      work_email: current.work_email,
      company_name: "",
      featured_request_id: current.featured_request_id,
      responses: createInitialResponses(),
      asset_links: "",
    }));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          required
          value={form.founder_name}
          onChange={(event) =>
            setForm((current) => ({ ...current, founder_name: event.target.value }))
          }
          placeholder="Founder / CEO Name"
          className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
        />
        <input
          required
          type="email"
          value={form.work_email}
          onChange={(event) =>
            setForm((current) => ({ ...current, work_email: event.target.value }))
          }
          placeholder="Work Email"
          className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
        />
        <input
          required
          value={form.company_name}
          onChange={(event) =>
            setForm((current) => ({ ...current, company_name: event.target.value }))
          }
          placeholder="Company Name"
          className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
        />
        <input
          value={form.featured_request_id}
          onChange={(event) =>
            setForm((current) => ({ ...current, featured_request_id: event.target.value }))
          }
          placeholder="Featured Request ID (optional)"
          className="h-11 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-zinc-100"
        />
      </div>

      <div className="grid gap-3">
        {INTERVIEW_QUESTIONS.map((question) => (
          <label key={question.key} className="grid gap-1.5">
            <span className="text-sm font-medium text-zinc-200">{question.label}</span>
            <textarea
              required
              rows={4}
              value={form.responses[question.key]}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  responses: {
                    ...current.responses,
                    [question.key]: event.target.value,
                  },
                }))
              }
              placeholder={question.placeholder}
              className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        ))}
      </div>

      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-zinc-200">Proof Links / Media Assets (optional)</span>
        <textarea
          rows={4}
          value={form.asset_links}
          onChange={(event) =>
            setForm((current) => ({ ...current, asset_links: event.target.value }))
          }
          placeholder="Add one URL per line: LinkedIn profile, website proof, images, press links"
          className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-100"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-md bg-indigo-500 px-5 text-sm font-medium text-white transition-colors hover:bg-indigo-400 disabled:opacity-70"
      >
        {loading ? "Submitting..." : "Submit Questionnaire"}
      </button>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
    </form>
  );
}
