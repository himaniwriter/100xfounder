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

    const rows = await prisma.guestPostOrder.findMany({
      where: parsedStatus.data ? { status: parsedStatus.data } : undefined,
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    });

    return NextResponse.json({
      success: true,
      orders: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to load guest post orders."),
      },
      { status: 500 },
    );
  }
}
