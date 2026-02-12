import "server-only";

import { cache } from "react";

export type CompanyContentExpansion = {
  prompt: string;
  generatedAt: string;
  source: "n8n" | "fallback";
  problem: string;
  solution: string;
  whyGrowing: string;
  culture: string;
  aboutMarkdown: string;
  whyItMatters: string;
};

type ExpansionInput = {
  name: string;
  oneLiner: string;
  industry: string;
  stage: string;
  location: string;
  tags: string[];
};

type ExpansionPayload = {
  problem: string;
  solution: string;
  whyGrowing: string;
  culture: string;
};

const TREND_MAP: Array<{ test: RegExp; trend: string }> = [
  {
    test: /fintech|payments|lending|banking/i,
    trend:
      "real-time payments, embedded finance rails, and tighter compliance automation",
  },
  {
    test: /ai|ml|genai|automation/i,
    trend:
      "enterprise AI adoption, workflow automation demand, and model-in-production tooling",
  },
  {
    test: /saas|software|b2b/i,
    trend:
      "digital transformation budgets moving toward vertical SaaS and automation-led growth",
  },
  {
    test: /health|med|biotech/i,
    trend:
      "digitized healthcare workflows, preventive analytics, and patient-first digital journeys",
  },
  {
    test: /commerce|retail|marketplace|supply chain/i,
    trend:
      "supply chain digitization, inventory intelligence, and omnichannel customer expectations",
  },
];

function toSentence(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function pickIndustryTrend(industry: string): string {
  const match = TREND_MAP.find((item) => item.test.test(industry));
  return (
    match?.trend ??
    "shifting customer expectations, faster digital adoption, and demand for measurable ROI"
  );
}

function buildPrompt(input: ExpansionInput): string {
  return [
    `I have a startup named **${input.name}**. Their one-liner is **${input.oneLiner}**.`,
    "",
    "Please generate a structured profile description for them:",
    "1. **The Problem:** What specific pain point are they solving? (Infer this from the industry).",
    "2. **The Solution:** Expand on their one-liner. How does it work?",
    "3. **Why it's growing:** (e.g., 'With the rise of [Industry Trend], [Name] is positioned to capture...')",
    "4. **Culture:** (Generic but positive: 'A fast-paced team focused on [Industry] innovation.')",
    "",
    "Return valid JSON only with keys: problem, solution, why_growing, culture.",
    `Context: industry=${input.industry}; stage=${input.stage}; location=${input.location}; tags=${input.tags.join(", ")}`,
  ].join("\n");
}

function fallbackExpansion(input: ExpansionInput, prompt: string): CompanyContentExpansion {
  const industryLabel = input.industry || "technology";
  const trend = pickIndustryTrend(industryLabel);

  const problem = toSentence(
    `${input.name} addresses a core ${industryLabel.toLowerCase()} pain point: fragmented operations, slow decision cycles, and poor visibility across teams. Organizations in this market often rely on disconnected tools, which creates delays, revenue leakage, and inconsistent customer outcomes.`,
  );

  const solution = toSentence(
    `${input.oneLiner} In practice, ${input.name} centralizes critical workflows, automates repetitive coordination, and gives operators a real-time system of record. This reduces manual overhead and improves execution quality at scale.`,
  );

  const whyGrowing = toSentence(
    `With the rise of ${trend}, ${input.name} is positioned to capture sustained demand. Buyers now prioritize speed, reliability, and clear ROI, and the company aligns directly with those purchasing criteria.`,
  );

  const culture = toSentence(
    `The team operates in a fast-paced environment focused on ${industryLabel.toLowerCase()} innovation, product velocity, and customer-centric execution. Their culture emphasizes ownership, experimentation, and measurable outcomes.`,
  );

  const aboutMarkdown = [
    `**The Problem**\n${problem}`,
    `**The Solution**\n${solution}`,
    `**Why it's growing**\n${whyGrowing}`,
    `**Culture**\n${culture}`,
  ].join("\n\n");

  return {
    prompt,
    generatedAt: new Date().toISOString(),
    source: "fallback",
    problem,
    solution,
    whyGrowing,
    culture,
    aboutMarkdown,
    whyItMatters: `${input.name} matters now because ${whyGrowing.charAt(0).toLowerCase()}${whyGrowing.slice(1)}`,
  };
}

function getString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeWebhookPayload(payload: unknown): ExpansionPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const source = payload as Record<string, unknown>;
  const nested =
    (source.data && typeof source.data === "object" ? source.data : null) ??
    (source.result && typeof source.result === "object" ? source.result : null);
  const candidate = (nested ?? source) as Record<string, unknown>;

  const problem = getString(candidate.problem);
  const solution = getString(candidate.solution);
  const whyGrowing = getString(candidate.whyGrowing ?? candidate.why_growing);
  const culture = getString(candidate.culture);

  if (!problem || !solution || !whyGrowing || !culture) {
    return null;
  }

  return { problem, solution, whyGrowing, culture };
}

async function fetchN8NExpansion(
  prompt: string,
  input: ExpansionInput,
): Promise<ExpansionPayload | null> {
  const webhookUrl = process.env.N8N_COMPANY_CONTENT_WEBHOOK_URL;
  if (!webhookUrl) {
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.N8N_SECRET_KEY) {
    headers["x-secret-key"] = process.env.N8N_SECRET_KEY;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "company_profile_expansion",
      prompt,
      company: input,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json().catch(() => null)) as unknown;
  return normalizeWebhookPayload(data);
}

function toExpansion(
  payload: ExpansionPayload,
  prompt: string,
  source: "n8n" | "fallback",
  name: string,
): CompanyContentExpansion {
  const aboutMarkdown = [
    `**The Problem**\n${payload.problem}`,
    `**The Solution**\n${payload.solution}`,
    `**Why it's growing**\n${payload.whyGrowing}`,
    `**Culture**\n${payload.culture}`,
  ].join("\n\n");

  return {
    prompt,
    generatedAt: new Date().toISOString(),
    source,
    problem: payload.problem,
    solution: payload.solution,
    whyGrowing: payload.whyGrowing,
    culture: payload.culture,
    aboutMarkdown,
    whyItMatters: `${name} matters now because ${payload.whyGrowing.charAt(0).toLowerCase()}${payload.whyGrowing.slice(1)}`,
  };
}

const buildExpansionCached = cache(async (input: ExpansionInput): Promise<CompanyContentExpansion> => {
  const prompt = buildPrompt(input);

  const n8nPayload = await fetchN8NExpansion(prompt, input).catch(() => null);
  if (n8nPayload) {
    return toExpansion(n8nPayload, prompt, "n8n", input.name);
  }

  return fallbackExpansion(input, prompt);
});

export async function buildCompanyContentExpansion(
  input: ExpansionInput,
): Promise<CompanyContentExpansion> {
  return buildExpansionCached({
    name: input.name.trim(),
    oneLiner: input.oneLiner.trim(),
    industry: input.industry.trim(),
    stage: input.stage.trim(),
    location: input.location.trim(),
    tags: input.tags.map((item) => item.trim()).filter(Boolean),
  });
}
