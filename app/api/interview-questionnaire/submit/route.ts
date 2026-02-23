import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import { interviewSubmissionSchema } from "@/lib/outreach/validation";
import { recordSiteEvent } from "@/lib/analytics/site-events";
import { postToN8N } from "@/lib/n8n";
import { getConfiguredN8nSecret } from "@/lib/security/webhooks";

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
  const parsed = interviewSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid interview submission payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  await ensureOutreachFunnelSchema();

  const payload = parsed.data;

  try {
    const created = await prisma.interviewQuestionnaireSubmission.create({
      data: {
        featuredRequestId: payload.featured_request_id || null,
        founderName: payload.founder_name,
        workEmail: payload.work_email,
        companyName: payload.company_name,
        responsesJson: payload.responses as Prisma.JsonObject,
        assetLinksJson: (payload.asset_links ?? undefined) as Prisma.InputJsonValue | undefined,
        externalSubmissionId: payload.external_submission_id || null,
        status: "new",
        source: payload.source || "site_form",
      },
      select: {
        id: true,
        status: true,
      },
    });

    setTimeout(() => {
      void recordSiteEvent({
        event_name: "interview_questionnaire_submit",
        path: "/interview-questionnaire",
        payload: {
          action: "interview_questionnaire_submit",
          request_id: created.id,
          source: payload.source || "site_form",
        },
      });

      const webhookUrl = process.env.N8N_INTERVIEW_WEBHOOK_URL?.trim() || "";
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
        console.error("Interview questionnaire n8n dispatch failed:", error);
      });
    }, 0);

    return NextResponse.json(
      {
        success: true,
        requestId: created.id,
        status: created.status,
        message: "Received, editorial review in progress.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save interview submission."),
      },
      { status: 500 },
    );
  }
}
