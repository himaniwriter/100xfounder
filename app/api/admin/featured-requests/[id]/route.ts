import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  featuredStatusFromDbValue,
  featuredStatusToDbValue,
} from "@/lib/featured/config";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";

const featuredStatusSchema = z.enum([
  "new",
  "in_review",
  "approved",
  "rejected",
  "published",
]);

const patchRequestSchema = z.object({
  action: z
    .enum(["move_to_in_review", "approve", "reject", "publish"])
    .optional(),
  status: featuredStatusSchema.optional(),
  reviewNotes: z
    .union([z.string().max(2000), z.literal(""), z.null()])
    .optional(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function mapActionToStatus(action: "move_to_in_review" | "approve" | "reject" | "publish") {
  if (action === "move_to_in_review") return "in_review" as const;
  if (action === "approve") return "approved" as const;
  if (action === "reject") return "rejected" as const;
  return "published" as const;
}

function canTransition(
  current: "new" | "in_review" | "approved" | "rejected" | "published",
  target: "new" | "in_review" | "approved" | "rejected" | "published",
): boolean {
  if (current === target) {
    return true;
  }

  const allowed: Record<
    "new" | "in_review" | "approved" | "rejected" | "published",
    Array<"new" | "in_review" | "approved" | "rejected" | "published">
  > = {
    new: ["in_review", "approved", "rejected"],
    in_review: ["approved", "rejected"],
    approved: ["published", "rejected", "in_review"],
    rejected: ["in_review"],
    published: ["in_review"],
  };

  return allowed[current].includes(target);
}

async function buildUniqueFounderSlug(baseValue: string): Promise<string> {
  const base = slugify(baseValue) || "featured-founder";
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? base : `${base}-${suffix}`;
    const existing = await prisma.founderDirectoryEntry.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
  }
}

async function upsertFounderDirectoryEntryForRequest(requestId: string): Promise<string> {
  const request = await prisma.featuredFounderRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Featured request not found.");
  }

  if (request.publishedFounderEntryId) {
    const existing = await prisma.founderDirectoryEntry.findUnique({
      where: { id: request.publishedFounderEntryId },
      select: { id: true },
    });
    if (existing) {
      await prisma.founderDirectoryEntry.update({
        where: { id: existing.id },
        data: {
          founderName: request.founderName,
          companyName: request.companyName,
          industry: request.industry ?? "General",
          stage: request.stage ?? "Featured",
          productSummary: request.productSummary,
          fundingInfo: request.fundingInfo,
          websiteUrl: request.websiteUrl,
          linkedinUrl: request.linkedinUrl,
          headquarters: request.country ?? null,
          verified: true,
        },
      });
      return existing.id;
    }
  }

  const identityMatch = await prisma.founderDirectoryEntry.findFirst({
    where: {
      founderName: request.founderName,
      companyName: request.companyName,
    },
    select: { id: true },
  });

  if (identityMatch) {
    await prisma.founderDirectoryEntry.update({
      where: { id: identityMatch.id },
      data: {
        industry: request.industry ?? "General",
        stage: request.stage ?? "Featured",
        productSummary: request.productSummary,
        fundingInfo: request.fundingInfo,
        websiteUrl: request.websiteUrl,
        linkedinUrl: request.linkedinUrl,
        headquarters: request.country ?? null,
        verified: true,
      },
    });
    return identityMatch.id;
  }

  const slug = await buildUniqueFounderSlug(
    `${request.founderName}-${request.companyName}`,
  );
  const created = await prisma.founderDirectoryEntry.create({
    data: {
      slug,
      founderName: request.founderName,
      companyName: request.companyName,
      industry: request.industry ?? "General",
      stage: request.stage ?? "Featured",
      productSummary: request.productSummary,
      fundingInfo: request.fundingInfo ?? null,
      websiteUrl: request.websiteUrl ?? null,
      linkedinUrl: request.linkedinUrl ?? null,
      headquarters: request.country ?? null,
      sourceUrl: "https://100xfounder.com/get-featured",
      techStack: [],
      recentNews: [],
      verified: true,
    },
    select: {
      id: true,
    },
  });

  return created.id;
}

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
  const parsed = patchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid featured request patch payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.featuredFounderRequest.findUnique({
      where: { id: context.params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Featured request not found." },
        { status: 404 },
      );
    }

    const currentStatus = featuredStatusFromDbValue(existing.status);
    const requestedStatus =
      parsed.data.action ? mapActionToStatus(parsed.data.action) : parsed.data.status;
    const nextStatus = requestedStatus ?? currentStatus;

    if (!canTransition(currentStatus, nextStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status transition: ${currentStatus} -> ${nextStatus}.`,
        },
        { status: 400 },
      );
    }

    let publishedFounderEntryId = existing.publishedFounderEntryId ?? null;
    if (nextStatus === "published") {
      publishedFounderEntryId = await upsertFounderDirectoryEntryForRequest(existing.id);
    }

    const updated = await prisma.featuredFounderRequest.update({
      where: { id: existing.id },
      data: {
        status: featuredStatusToDbValue(nextStatus),
        reviewNotes:
          typeof parsed.data.reviewNotes === "string"
            ? parsed.data.reviewNotes.trim() || null
            : parsed.data.reviewNotes === null
              ? null
              : undefined,
        publishedFounderEntryId,
      },
    });

    return NextResponse.json({
      success: true,
      request: {
        id: updated.id,
        status: featuredStatusFromDbValue(updated.status),
        reviewNotes: updated.reviewNotes,
        publishedFounderEntryId: updated.publishedFounderEntryId,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to update featured request."),
      },
      { status: 500 },
    );
  }
}
