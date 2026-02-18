import { NextResponse } from "next/server";
import { z } from "zod";
import { postToN8N } from "@/lib/n8n";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";
import { isWorkEmail } from "@/lib/pricing/waitlist";
import { getConfiguredN8nSecret } from "@/lib/security/webhooks";
import { readGlobalSiteSettings } from "@/lib/site-settings";
import { recordSiteEvent } from "@/lib/analytics/site-events";
import { ensureGrowthWaveSchema } from "@/lib/db-bootstrap";

const waitlistSchema = z.object({
  name: z.string().trim().min(2).max(120),
  work_email: z.string().trim().email().max(180),
  intent: z.string().trim().min(2).max(120),
  utm_source: z.union([z.string().trim().max(120), z.null()]).optional(),
  utm_medium: z.union([z.string().trim().max(120), z.null()]).optional(),
  utm_campaign: z.union([z.string().trim().max(160), z.null()]).optional(),
});

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

  const json = await request.json().catch(() => null);
  const parsed = waitlistSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid waitlist payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (!isWorkEmail(parsed.data.work_email)) {
    return NextResponse.json(
      {
        success: false,
        error: "Please use a valid work email (not a free personal domain).",
      },
      { status: 400 },
    );
  }

  try {
    await ensureGrowthWaveSchema();

    const row = await prisma.pricingWaitlistRequest.create({
      data: {
        name: parsed.data.name,
        workEmail: parsed.data.work_email,
        intent: parsed.data.intent,
        utmSource: parsed.data.utm_source?.trim() || null,
        utmMedium: parsed.data.utm_medium?.trim() || null,
        utmCampaign: parsed.data.utm_campaign?.trim() || null,
        source: "pricing_page",
        status: "new",
      },
      select: {
        id: true,
        status: true,
      },
    });

    await recordSiteEvent({
      event_name: "pricing_waitlist_submit",
      path: "/pricing",
      payload: {
        intent: parsed.data.intent,
        utm_source: parsed.data.utm_source ?? null,
        utm_medium: parsed.data.utm_medium ?? null,
        utm_campaign: parsed.data.utm_campaign ?? null,
      },
    });

    const siteSettings = await readGlobalSiteSettings();
    const webhookUrl =
      process.env.N8N_PRICING_WAITLIST_WEBHOOK_URL ||
      siteSettings.n8nPrimaryWebhookUrl ||
      siteSettings.n8nBaseWebhookUrl ||
      "";

    if (webhookUrl) {
      const secret = await getConfiguredN8nSecret();
      postToN8N(
        webhookUrl,
        {
          request_id: row.id,
          name: parsed.data.name,
          work_email: parsed.data.work_email,
          intent: parsed.data.intent,
          source: "pricing_page",
          utm_source: parsed.data.utm_source ?? null,
          utm_medium: parsed.data.utm_medium ?? null,
          utm_campaign: parsed.data.utm_campaign ?? null,
        },
        { secret: secret || undefined },
      ).catch((error) => {
        console.error("Pricing waitlist n8n dispatch failed:", error);
      });
    }

    return NextResponse.json(
      {
        success: true,
        requestId: row.id,
        status: row.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to submit waitlist request."),
      },
      { status: 500 },
    );
  }
}
