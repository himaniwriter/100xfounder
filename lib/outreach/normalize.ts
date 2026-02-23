import { INTERVIEW_QUESTIONS } from "@/lib/outreach/constants";

function pickString(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function pickArray(payload: Record<string, unknown>, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }
  }
  return undefined;
}

export function normalizeInterviewPayload(input: unknown) {
  const payload = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  let responses: Record<string, string> = {};

  if (payload.responses && typeof payload.responses === "object" && !Array.isArray(payload.responses)) {
    responses = Object.fromEntries(
      Object.entries(payload.responses as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([key, value]) => [key, String(value).trim()]),
    );
  } else if (Array.isArray(payload.answers)) {
    responses = Object.fromEntries(
      payload.answers
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const asRecord = item as Record<string, unknown>;
          const key = pickString(asRecord, ["key", "id", "field", "question_key"]);
          const value = pickString(asRecord, ["value", "answer", "response"]);
          return [key || "", value || ""] as const;
        })
        .filter(([key, value]) => Boolean(key) && Boolean(value)),
    );
  } else {
    responses = Object.fromEntries(
      INTERVIEW_QUESTIONS.map((question) => {
        const value = pickString(payload, [question.key, `q_${question.key}`]) || "";
        return [question.key, value];
      }),
    );
  }

  return {
    featured_request_id: pickString(payload, ["featured_request_id", "featuredRequestId", "request_id"]),
    founder_name: pickString(payload, ["founder_name", "founderName", "name"]),
    work_email: pickString(payload, ["work_email", "workEmail", "email"]),
    company_name: pickString(payload, ["company_name", "companyName"]),
    responses,
    asset_links: pickArray(payload, ["asset_links", "assets", "media_links", "proof_links"]),
    source: pickString(payload, ["source"]) || "n8n_embed",
    external_submission_id: pickString(payload, [
      "external_submission_id",
      "externalSubmissionId",
      "submission_id",
      "submissionId",
    ]),
  };
}

export function normalizeGuestPostPayload(input: unknown) {
  const payload = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  return {
    name: pickString(payload, ["name", "author_name", "founder_name"]),
    work_email: pickString(payload, ["work_email", "workEmail", "email"]),
    company_name: pickString(payload, ["company_name", "companyName"]),
    website_url: pickString(payload, ["website_url", "website", "company_website"]),
    target_url: pickString(payload, ["target_url", "targetUrl"]),
    topic: pickString(payload, ["topic", "title", "subject"]),
    brief: pickString(payload, ["brief", "content_brief", "description"]),
    budget_inr:
      typeof payload.budget_inr === "number"
        ? payload.budget_inr
        : typeof payload.budgetInr === "number"
          ? payload.budgetInr
          : undefined,
    package_key: pickString(payload, ["package_key", "packageKey", "plan"]),
    source: pickString(payload, ["source"]) || "n8n_embed",
    external_submission_id: pickString(payload, [
      "external_submission_id",
      "externalSubmissionId",
      "submission_id",
      "submissionId",
    ]),
  };
}

export function normalizeInstagramSyncPayload(input: unknown): { items: unknown[] } {
  const payload = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const items = Array.isArray(payload.items)
    ? payload.items
    : Array.isArray(payload.posts)
      ? payload.posts
      : [];

  return { items };
}
