import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import {
  canTransitionStatus,
  mapActionToStatus,
  reviewPatchSchema,
} from "@/lib/outreach/validation";

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

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
  const parsed = reviewPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid patch payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await ensureOutreachFunnelSchema();

    const existing = await prisma.interviewQuestionnaireSubmission.findUnique({
      where: { id: context.params.id },
      select: {
        id: true,
        status: true,
        featuredRequestId: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Submission not found." },
        { status: 404 },
      );
    }

    const requestedStatus = parsed.data.action ? mapActionToStatus(parsed.data.action) : parsed.data.status;
    const nextStatus = requestedStatus ?? (existing.status as "new" | "in_review" | "approved" | "rejected" | "published");

    if (
      !canTransitionStatus(
        existing.status as "new" | "in_review" | "approved" | "rejected" | "published",
        nextStatus,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition: ${existing.status} -> ${nextStatus}.`,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.interviewQuestionnaireSubmission.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        reviewNotes:
          typeof parsed.data.reviewNotes === "string"
            ? parsed.data.reviewNotes.trim() || null
            : parsed.data.reviewNotes === null
              ? null
              : undefined,
      },
      select: {
        id: true,
        status: true,
        reviewNotes: true,
        updatedAt: true,
        featuredRequestId: true,
      },
    });

    if (nextStatus === "published" && updated.featuredRequestId) {
      await prisma.featuredFounderRequest.updateMany({
        where: { id: updated.featuredRequestId },
        data: { status: "PUBLISHED" },
      });
    }

    return NextResponse.json({
      success: true,
      submission: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to update interview submission."),
      },
      { status: 500 },
    );
  }
}
