import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { isAuthorizedN8nWebhook } from "@/lib/security/webhooks";
import { normalizeGuestPostPayload } from "@/lib/outreach/normalize";
import { guestPostOrderSchema } from "@/lib/outreach/validation";

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
  const normalized = normalizeGuestPostPayload(body);
  const parsed = guestPostOrderSchema.safeParse(normalized);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid guest-post webhook payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    await ensureOutreachFunnelSchema();

    const record = payload.external_submission_id
      ? await prisma.guestPostOrder.upsert({
          where: { externalSubmissionId: payload.external_submission_id },
          create: {
            name: payload.name,
            workEmail: payload.work_email,
            companyName: payload.company_name,
            websiteUrl: payload.website_url || null,
            targetUrl: payload.target_url || null,
            topic: payload.topic,
            brief: payload.brief,
            budgetInr: payload.budget_inr,
            packageKey: payload.package_key || null,
            source: payload.source || "n8n_embed",
            externalSubmissionId: payload.external_submission_id,
            status: "new",
          },
          update: {
            name: payload.name,
            workEmail: payload.work_email,
            companyName: payload.company_name,
            websiteUrl: payload.website_url || null,
            targetUrl: payload.target_url || null,
            topic: payload.topic,
            brief: payload.brief,
            budgetInr: payload.budget_inr,
            packageKey: payload.package_key || null,
            source: payload.source || "n8n_embed",
          },
          select: {
            id: true,
            status: true,
            externalSubmissionId: true,
            updatedAt: true,
          },
        })
      : await prisma.guestPostOrder.create({
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
        error: toPublicDatabaseError(error, "Failed to save guest-post webhook payload."),
      },
      { status: 500 },
    );
  }
}
