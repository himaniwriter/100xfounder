import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import { guestPostOrderSchema } from "@/lib/outreach/validation";
import { postToN8N } from "@/lib/n8n";
import { getConfiguredN8nSecret } from "@/lib/security/webhooks";
import { recordSiteEvent } from "@/lib/analytics/site-events";

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

  const body = await request.json().catch(() => null);
  const parsed = guestPostOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid guest post order payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  await ensureOutreachFunnelSchema();

  const payload = parsed.data;

  try {
    const created = await prisma.guestPostOrder.create({
      data: {
        name: payload.name,
        workEmail: payload.work_email,
        companyName: payload.company_name,
        websiteUrl: payload.website_url || null,
        targetUrl: payload.target_url || null,
        topic: payload.topic,
        brief: payload.brief,
        budgetInr: payload.budget_inr,
        packageKey: payload.package_key || null,
        source: payload.source || "site_form",
        externalSubmissionId: payload.external_submission_id || null,
        status: "new",
      },
      select: {
        id: true,
        status: true,
      },
    });

    setTimeout(() => {
      void recordSiteEvent({
        event_name: "guest_post_order_submit",
        path: "/guest-post-order",
        payload: {
          action: "guest_post_order_submit",
          request_id: created.id,
          package_key: payload.package_key || null,
          source: payload.source || "site_form",
        },
      });

      const webhookUrl = process.env.N8N_GUEST_POST_WEBHOOK_URL?.trim() || "";
      if (!webhookUrl) {
        return;
      }

      void (async () => {
        const secret = await getConfiguredN8nSecret();
        await postToN8N(
          webhookUrl,
          {
            ...payload,
            request_id: created.id,
            status: created.status,
          },
          {
            secret: secret || undefined,
            timeoutMs: 8000,
          },
        );
      })().catch((error) => {
        console.error("Guest post order n8n dispatch failed:", error);
      });
    }, 0);

    return NextResponse.json(
      {
        success: true,
        requestId: created.id,
        status: created.status,
        message: "Order received. Our editorial team will contact you with next steps.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save guest post order."),
      },
      { status: 500 },
    );
  }
}
