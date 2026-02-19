import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FEATURED_PLAN_BY_KEY,
  featuredPlanToDbValue,
  featuredStatusFromDbValue,
} from "@/lib/featured/config";
import { normalizeWebhookFeaturedPayload } from "@/lib/featured/schema";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import {
  getConfiguredN8nSecret,
  isAuthorizedN8nWebhook,
} from "@/lib/security/webhooks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const configuredSecret = await getConfiguredN8nSecret();
  if (!configuredSecret) {
    return NextResponse.json(
      { success: false, error: "N8N webhook secret is not configured." },
      { status: 500 },
    );
  }

  const authorized = await isAuthorizedN8nWebhook(request.headers);
  if (!authorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  const json = await request.json().catch(() => null);
  const normalized = normalizeWebhookFeaturedPayload(json);
  if (!normalized.success) {
    return NextResponse.json(
      { success: false, error: normalized.error },
      { status: 400 },
    );
  }

  const data = normalized.data;
  const planDetails = FEATURED_PLAN_BY_KEY[data.plan];

  try {
    const payload = {
      founderName: data.founder_name,
      workEmail: data.work_email,
      companyName: data.company_name,
      websiteUrl: data.website_url ?? null,
      linkedinUrl: data.linkedin_url ?? null,
      country: data.country ?? null,
      industry: data.industry ?? null,
      stage: data.stage ?? null,
      productSummary: data.product_summary,
      fundingInfo: data.funding_info ?? null,
      plan: featuredPlanToDbValue(data.plan),
      priceInr: planDetails.priceInr,
      priceUsd: planDetails.priceUsd,
      source: "n8n_embed",
    };

    const record =
      data.external_submission_id && data.external_submission_id.length > 0
        ? await prisma.featuredFounderRequest.upsert({
            where: { externalSubmissionId: data.external_submission_id },
            create: {
              ...payload,
              externalSubmissionId: data.external_submission_id,
            },
            update: {
              ...payload,
            },
            select: {
              id: true,
              status: true,
            },
          })
        : await prisma.featuredFounderRequest.create({
            data: {
              ...payload,
            },
            select: {
              id: true,
              status: true,
            },
          });

    return NextResponse.json(
      {
        success: true,
        requestId: record.id,
        status: featuredStatusFromDbValue(record.status),
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to process featured webhook."),
      },
      { status: 500 },
    );
  }
}
