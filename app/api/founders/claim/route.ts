import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

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
    select: { id: true, slug: true },
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

  return NextResponse.json({ success: true, claim }, { status: 201 });
}
