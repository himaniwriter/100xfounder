import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { postToN8N } from "@/lib/n8n";

const claimSchema = z.object({
  slug: z.string().min(2),
  message: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Please login first." },
      { status: 401 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = claimSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid claim payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const founderEntry = await prisma.founderDirectoryEntry.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true, slug: true, founderName: true, companyName: true },
  });

  if (!founderEntry) {
    return NextResponse.json(
      { success: false, error: "Founder profile not found." },
      { status: 404 },
    );
  }

  const claim = await prisma.claimRequest.upsert({
    where: {
      userId_founderEntryId: {
        userId: session.userId,
        founderEntryId: founderEntry.id,
      },
    },
    create: {
      userId: session.userId,
      founderEntryId: founderEntry.id,
      message: parsed.data.message ?? null,
    },
    update: {
      message: parsed.data.message ?? null,
      status: "PENDING",
      reviewedAt: null,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  try {
    await postToN8N(
      process.env.N8N_CLAIM_PROFILE_WEBHOOK_URL,
      {
        claimId: claim.id,
        userId: session.userId,
        founderEntryId: founderEntry.id,
        founderSlug: founderEntry.slug,
        founderName: founderEntry.founderName,
        companyName: founderEntry.companyName,
        message: parsed.data.message ?? null,
      },
      { secret: process.env.N8N_SYNC_SECRET },
    );
  } catch {
    // Claim flow should not fail if webhook dispatch fails.
  }

  return NextResponse.json({ success: true, claim }, { status: 201 });
}
