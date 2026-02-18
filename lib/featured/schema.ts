import { z } from "zod";

export const featuredPlanSchema = z.enum(["starter", "growth", "priority"]);

const optionalUrl = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional();

const optionalText = (max: number) =>
  z
    .union([z.string().max(max), z.literal(""), z.null()])
    .optional();

export const featuredCanonicalPayloadSchema = z.object({
  founder_name: z.string().trim().min(2).max(120),
  work_email: z.string().trim().email().max(180),
  company_name: z.string().trim().min(2).max(160),
  website_url: optionalUrl,
  linkedin_url: optionalUrl,
  country: optionalText(120),
  industry: optionalText(120),
  stage: optionalText(120),
  product_summary: z.string().trim().min(20).max(4000),
  funding_info: optionalText(2000),
  plan: featuredPlanSchema,
  external_submission_id: optionalText(190),
});

const webhookAliasSchema = z.object({
  founder_name: z.string().trim().min(2).max(120).optional(),
  founderName: z.string().trim().min(2).max(120).optional(),
  work_email: z.string().trim().email().max(180).optional(),
  workEmail: z.string().trim().email().max(180).optional(),
  company_name: z.string().trim().min(2).max(160).optional(),
  companyName: z.string().trim().min(2).max(160).optional(),
  website_url: optionalUrl,
  websiteUrl: optionalUrl,
  linkedin_url: optionalUrl,
  linkedinUrl: optionalUrl,
  country: optionalText(120),
  industry: optionalText(120),
  stage: optionalText(120),
  product_summary: z.string().trim().min(20).max(4000).optional(),
  productSummary: z.string().trim().min(20).max(4000).optional(),
  funding_info: optionalText(2000),
  fundingInfo: optionalText(2000),
  plan: featuredPlanSchema.optional(),
  external_submission_id: optionalText(190),
  externalSubmissionId: optionalText(190),
});

export type FeaturedCanonicalPayload = z.infer<typeof featuredCanonicalPayloadSchema>;

function normalizeOptional(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeWebhookFeaturedPayload(
  payload: unknown,
): { success: true; data: FeaturedCanonicalPayload } | { success: false; error: string } {
  const parsed = webhookAliasSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: "Invalid webhook payload." };
  }

  const source = parsed.data;
  const canonical = {
    founder_name: source.founder_name ?? source.founderName ?? "",
    work_email: source.work_email ?? source.workEmail ?? "",
    company_name: source.company_name ?? source.companyName ?? "",
    website_url:
      normalizeOptional(source.website_url) ??
      normalizeOptional(source.websiteUrl),
    linkedin_url:
      normalizeOptional(source.linkedin_url) ??
      normalizeOptional(source.linkedinUrl),
    country: normalizeOptional(source.country),
    industry: normalizeOptional(source.industry),
    stage: normalizeOptional(source.stage),
    product_summary: source.product_summary ?? source.productSummary ?? "",
    funding_info:
      normalizeOptional(source.funding_info) ??
      normalizeOptional(source.fundingInfo),
    plan: source.plan,
    external_submission_id:
      normalizeOptional(source.external_submission_id) ??
      normalizeOptional(source.externalSubmissionId),
  };

  const canonicalParsed = featuredCanonicalPayloadSchema.safeParse(canonical);
  if (!canonicalParsed.success) {
    return { success: false, error: "Invalid webhook payload." };
  }

  return { success: true, data: canonicalParsed.data };
}
