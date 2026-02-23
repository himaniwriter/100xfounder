import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { isAuthorizedN8nWebhook } from "@/lib/security/webhooks";
import { normalizeInterviewPayload } from "@/lib/outreach/normalize";
import { interviewSubmissionSchema } from "@/lib/outreach/validation";

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

  const authorized = await isAuthorizedN8nWebhook(request.headers);
  if (!authorized) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const normalized = normalizeInterviewPayload(body);
  const parsed = interviewSubmissionSchema.safeParse(normalized);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid interview webhook payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    await ensureOutreachFunnelSchema();

    const record = payload.external_submission_id
      ? await prisma.interviewQuestionnaireSubmission.upsert({
          where: { externalSubmissionId: payload.external_submission_id },
          create: {
            featuredRequestId: payload.featured_request_id || null,
            founderName: payload.founder_name,
            workEmail: payload.work_email,
            companyName: payload.company_name,
            responsesJson: payload.responses as Prisma.JsonObject,
            assetLinksJson: (payload.asset_links ?? undefined) as Prisma.InputJsonValue | undefined,
            externalSubmissionId: payload.external_submission_id,
            source: payload.source || "n8n_embed",
            status: "new",
          },
          update: {
            featuredRequestId: payload.featured_request_id || null,
            founderName: payload.founder_name,
            workEmail: payload.work_email,
            companyName: payload.company_name,
            responsesJson: payload.responses as Prisma.JsonObject,
            assetLinksJson: (payload.asset_links ?? undefined) as Prisma.InputJsonValue | undefined,
            source: payload.source || "n8n_embed",
          },
          select: {
            id: true,
            status: true,
            externalSubmissionId: true,
            updatedAt: true,
          },
        })
      : await prisma.interviewQuestionnaireSubmission.create({
          data: {
            featuredRequestId: payload.featured_request_id || null,
            founderName: payload.founder_name,
            workEmail: payload.work_email,
            companyName: payload.company_name,
            responsesJson: payload.responses as Prisma.JsonObject,
            assetLinksJson: (payload.asset_links ?? undefined) as Prisma.InputJsonValue | undefined,
            source: payload.source || "n8n_embed",
            status: "new",
          },
          select: {
            id: true,
            status: true,
            externalSubmissionId: true,
            updatedAt: true,
          },
        });

    return NextResponse.json(
      {
        success: true,
        requestId: record.id,
        status: record.status,
        externalSubmissionId: record.externalSubmissionId,
        updatedAt: record.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save interview webhook payload."),
      },
      { status: 500 },
    );
  }
}
