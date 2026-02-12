import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/prisma";

const createFounderSchema = z.object({
  founderName: z.string().min(2),
  companyName: z.string().min(2),
  industry: z.string().min(2),
  stage: z.string().min(2),
  productSummary: z.string().min(8),
  websiteUrl: z.string().url().optional(),
  headquarters: z.string().min(2).optional(),
  fundingInfo: z.string().min(2).optional(),
  foundedYear: z.number().int().min(1900).max(2100).optional(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function inferDomain(companyName: string): string {
  const root = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(ltd|limited|pvt|private|corp|corporation|company|co)\b/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");
  return root || "company";
}

function toContactEmail(
  companyName: string,
  websiteUrl: string | null,
  claimedEmail: string | null,
): string {
  if (claimedEmail) {
    return claimedEmail;
  }

  if (websiteUrl) {
    try {
      const host = new URL(websiteUrl).hostname.replace(/^www\./, "");
      return `contact@${host}`;
    } catch {
      const host = websiteUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      if (host) {
        return `contact@${host}`;
      }
    }
  }

  return `contact@${inferDomain(companyName)}.com`;
}

async function buildUniqueSlug(baseValue: string): Promise<string> {
  const base = slugify(baseValue) || "founder-record";
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

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const founders = await prisma.founderDirectoryEntry.findMany({
      orderBy: [{ verified: "desc" }, { updatedAt: "desc" }],
      include: {
        claimedByUser: {
          select: {
            email: true,
          },
        },
      },
      take: 500,
    });

    const rows = founders.map((item) => ({
      id: item.id,
      slug: item.slug,
      founderName: item.founderName,
      companyName: item.companyName,
      industry: item.industry,
      stage: item.stage,
      productSummary: item.productSummary,
      websiteUrl: item.websiteUrl,
      fundingInfo: item.fundingInfo,
      foundedYear: item.foundedYear,
      status: item.verified ? "VERIFIED" : "PENDING",
      tier: item.claimedByUserId ? "PRO" : "FREE",
      email: toContactEmail(
        item.companyName,
        item.websiteUrl,
        item.claimedByUser?.email ?? null,
      ),
      verified: item.verified,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({ success: true, founders: rows });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load founders.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = createFounderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid founder payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const slug = await buildUniqueSlug(
      `${parsed.data.founderName}-${parsed.data.companyName}`,
    );

    const founder = await prisma.founderDirectoryEntry.create({
      data: {
        slug,
        founderName: parsed.data.founderName,
        companyName: parsed.data.companyName,
        industry: parsed.data.industry,
        stage: parsed.data.stage,
        productSummary: parsed.data.productSummary,
        fundingInfo: parsed.data.fundingInfo ?? null,
        websiteUrl: parsed.data.websiteUrl ?? null,
        headquarters: parsed.data.headquarters ?? null,
        foundedYear: parsed.data.foundedYear ?? null,
        techStack: [],
        recentNews: [],
        verified: false,
      },
      select: {
        id: true,
        slug: true,
        founderName: true,
        companyName: true,
      },
    });

    return NextResponse.json({ success: true, founder }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create founder record.",
      },
      { status: 500 },
    );
  }
}
