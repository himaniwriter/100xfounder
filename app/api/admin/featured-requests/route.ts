import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  featuredPlanFromDbValue,
  featuredStatusFromDbValue,
} from "@/lib/featured/config";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { ensureFeaturedFounderSchema } from "@/lib/db-bootstrap";

const statusQuerySchema = z
  .enum(["new", "in_review", "approved", "rejected", "published"])
  .optional();

function statusFilterToDbValue(value: string) {
  if (value === "new") return "NEW";
  if (value === "in_review") return "IN_REVIEW";
  if (value === "approved") return "APPROVED";
  if (value === "rejected") return "REJECTED";
  return "PUBLISHED";
}

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

  const statusParam = request.nextUrl.searchParams.get("status") ?? undefined;
  const parsedStatus = statusQuerySchema.safeParse(statusParam);
  if (!parsedStatus.success) {
    return NextResponse.json(
      { success: false, error: "Invalid status query parameter." },
      { status: 400 },
    );
  }

  try {
    await ensureFeaturedFounderSchema();

    const rows = await prisma.featuredFounderRequest.findMany({
      where: parsedStatus.data
        ? {
            status: statusFilterToDbValue(parsedStatus.data),
          }
        : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    });

    const requests = rows.map((row) => ({
      id: row.id,
      founderName: row.founderName,
      workEmail: row.workEmail,
      companyName: row.companyName,
      websiteUrl: row.websiteUrl,
      linkedinUrl: row.linkedinUrl,
      country: row.country,
      industry: row.industry,
      stage: row.stage,
      productSummary: row.productSummary,
      fundingInfo: row.fundingInfo,
      plan: featuredPlanFromDbValue(row.plan),
      priceInr: row.priceInr,
      priceUsd: row.priceUsd,
      source: row.source,
      externalSubmissionId: row.externalSubmissionId,
      status: featuredStatusFromDbValue(row.status),
      reviewNotes: row.reviewNotes,
      publishedFounderEntryId: row.publishedFounderEntryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to load featured requests."),
      },
      { status: 500 },
    );
  }
}
