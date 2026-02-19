import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postToN8N } from "@/lib/n8n";
import { getConfiguredN8nSecret } from "@/lib/security/webhooks";
import { recordSiteEvent } from "@/lib/analytics/site-events";
import {
  ensureGrowthWaveSchema,
} from "@/lib/db-bootstrap";
import {
  FEATURED_PLAN_BY_KEY,
  featuredPlanToDbValue,
  featuredStatusFromDbValue,
} from "@/lib/featured/config";
import { featuredCanonicalPayloadSchema } from "@/lib/featured/schema";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }
  return { message: String(error) };
}

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

  const json = await request.json().catch(() => null);
  const parsed = featuredCanonicalPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid featured application payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const planDetails = FEATURED_PLAN_BY_KEY[parsed.data.plan];

  try {
    await ensureGrowthWaveSchema();

    const created = await prisma.featuredFounderRequest.create({
      data: {
        founderName: parsed.data.founder_name,
        workEmail: parsed.data.work_email,
        companyName: parsed.data.company_name,
        websiteUrl: parsed.data.website_url ?? null,
        linkedinUrl: parsed.data.linkedin_url ?? null,
        country: parsed.data.country ?? null,
        industry: parsed.data.industry ?? null,
        stage: parsed.data.stage ?? null,
        productSummary: parsed.data.product_summary,
        fundingInfo: parsed.data.funding_info ?? null,
        plan: featuredPlanToDbValue(parsed.data.plan),
        priceInr: planDetails.priceInr,
        priceUsd: planDetails.priceUsd,
        source: "site_form",
        externalSubmissionId: parsed.data.external_submission_id ?? null,
      },
      select: {
        id: true,
        status: true,
      },
    });

    await recordSiteEvent({
      event_name: "featured_form_submit",
      path: "/get-featured",
      payload: {
        plan: parsed.data.plan,
        source: "site_form",
        utm_source: parsed.data.utm_source ?? null,
        utm_medium: parsed.data.utm_medium ?? null,
        utm_campaign: parsed.data.utm_campaign ?? null,
      },
    });

    const webhookUrl =
      process.env.N8N_FEATURED_APPLY_WEBHOOK_URL ||
      process.env.N8N_FEATURED_WEBHOOK_URL ||
      "";
    if (webhookUrl) {
      const secret = await getConfiguredN8nSecret();
      postToN8N(
        webhookUrl,
        {
          ...parsed.data,
          request_id: created.id,
          source: "site_form",
          price_inr: planDetails.priceInr,
          price_usd: planDetails.priceUsd,
          utm_source: parsed.data.utm_source ?? null,
          utm_medium: parsed.data.utm_medium ?? null,
          utm_campaign: parsed.data.utm_campaign ?? null,
        },
        { secret: secret || undefined },
      ).catch((error) => {
        console.error("Featured apply n8n dispatch failed:", error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        requestId: created.id,
        status: featuredStatusFromDbValue(created.status),
        message: "Application received. We will review and contact you shortly.",
      },
      { status: 201 },
    );
  } catch (error) {
    const debugKey = request.headers.get("x-debug-key")?.trim();
    const allowDebug =
      Boolean(debugKey) &&
      Boolean(process.env.AUTH_SECRET) &&
      debugKey === process.env.AUTH_SECRET;

    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to submit application."),
        ...(allowDebug ? { debug: serializeError(error) } : {}),
      },
      { status: 500 },
    );
  }
}
