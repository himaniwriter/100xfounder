import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/prisma";

const updateFounderSchema = z.object({
  founderName: z.string().min(2).optional(),
  companyName: z.string().min(2).optional(),
  industry: z.string().min(2).optional(),
  stage: z.string().min(2).optional(),
  productSummary: z.string().min(8).optional(),
  websiteUrl: z.string().url().nullable().optional(),
  fundingInfo: z.string().nullable().optional(),
  headquarters: z.string().nullable().optional(),
  foundedYear: z.number().int().min(1900).max(2100).nullable().optional(),
  verified: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateFounderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid founder update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const founder = await prisma.founderDirectoryEntry.update({
      where: { id: context.params.id },
      data: {
        ...parsed.data,
      },
      select: {
        id: true,
        founderName: true,
        companyName: true,
        verified: true,
      },
    });

    return NextResponse.json({ success: true, founder });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update founder.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    await prisma.founderDirectoryEntry.delete({
      where: { id: context.params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete founder.",
      },
      { status: 500 },
    );
  }
}
