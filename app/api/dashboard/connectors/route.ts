import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";

const connectorSchema = z.object({
  name: z.string().min(2),
  provider: z.string().min(2),
  endpoint: z.string().url(),
  authHeader: z.string().min(1).optional(),
  authValue: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

async function requireAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  if (session.role !== "ADMIN") {
    return { error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }) };
  }

  return { session };
}

export async function GET(request: NextRequest) {
  const access = await requireAdmin(request);

  if ("error" in access) {
    return access.error;
  }

  const connectors = await prisma.aggregatorConnection.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      provider: true,
      endpoint: true,
      authHeader: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, connectors });
}

export async function POST(request: NextRequest) {
  const access = await requireAdmin(request);

  if ("error" in access) {
    return access.error;
  }

  const json = await request.json().catch(() => null);
  const parsed = connectorSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid connector payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const connector = await prisma.aggregatorConnection.create({
    data: {
      ...parsed.data,
      authHeader: parsed.data.authHeader ?? null,
      authValue: parsed.data.authValue ?? null,
      isActive: parsed.data.isActive ?? true,
      createdById: access.session.userId,
    },
    select: {
      id: true,
      name: true,
      provider: true,
      endpoint: true,
      authHeader: true,
      isActive: true,
      lastSyncAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ success: true, connector }, { status: 201 });
}
