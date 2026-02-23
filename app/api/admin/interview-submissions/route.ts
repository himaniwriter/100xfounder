import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";

const statusSchema = z
  .enum(["new", "in_review", "approved", "rejected", "published"])
  .optional();

export async function GET(request: NextRequest) {
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

  const parsedStatus = statusSchema.safeParse(request.nextUrl.searchParams.get("status") ?? undefined);
  if (!parsedStatus.success) {
    return NextResponse.json(
      { success: false, error: "Invalid status query parameter." },
      { status: 400 },
    );
  }

  try {
    await ensureOutreachFunnelSchema();

    const rows = await prisma.interviewQuestionnaireSubmission.findMany({
      where: parsedStatus.data ? { status: parsedStatus.data } : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 500,
      include: {
        featuredRequest: {
          select: {
            id: true,
            founderName: true,
            companyName: true,
            status: true,
            publishedFounderEntryId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      submissions: rows.map((row) => ({
        id: row.id,
        featuredRequestId: row.featuredRequestId,
        founderName: row.founderName,
        workEmail: row.workEmail,
        companyName: row.companyName,
        responsesJson: row.responsesJson,
        assetLinksJson: row.assetLinksJson,
        externalSubmissionId: row.externalSubmissionId,
        status: row.status,
        source: row.source,
        reviewNotes: row.reviewNotes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        featuredRequest: row.featuredRequest,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to load interview submissions."),
      },
      { status: 500 },
    );
  }
}
