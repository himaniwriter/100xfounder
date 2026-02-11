import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth/session";
import { upsertFounderDirectoryFromN8N } from "@/lib/founders/store";
import type { FounderSyncInput } from "@/lib/founders/types";

function normalizeRecords(payload: unknown): FounderSyncInput[] {
  const raw = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { founders?: unknown[] }).founders)
      ? (payload as { founders: unknown[] }).founders
      : [];

  const records: FounderSyncInput[] = [];

  for (const row of raw) {
    if (!row || typeof row !== "object") {
      continue;
    }

    const record = row as Record<string, unknown>;
    const founderName = String(
      record.founderName ?? record.founder ?? record.person ?? "",
    ).trim();
    const companyName = String(
      record.companyName ?? record.company ?? record.organization ?? "",
    ).trim();
    const productSummary = String(
      record.productSummary ?? record.summary ?? record.description ?? "",
    ).trim();

    if (!founderName || !companyName || !productSummary) {
      continue;
    }

    records.push({
      founderName,
      companyName,
      productSummary,
      industry: typeof record.industry === "string" ? record.industry : undefined,
      stage: typeof record.stage === "string" ? record.stage : undefined,
      fundingInfo:
        typeof record.fundingInfo === "string" ? record.fundingInfo : undefined,
      headquarters:
        typeof record.headquarters === "string" ? record.headquarters : undefined,
      sourceUrl: typeof record.sourceUrl === "string" ? record.sourceUrl : undefined,
      ycProfileUrl:
        typeof record.ycProfileUrl === "string" ? record.ycProfileUrl : undefined,
      avatarUrl: typeof record.avatarUrl === "string" ? record.avatarUrl : undefined,
      verified:
        typeof record.verified === "boolean" ? record.verified : undefined,
      foundedYear:
        typeof record.foundedYear === "number" ? record.foundedYear : undefined,
    });
  }

  return records;
}

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

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const access = await requireAdmin(request);

  if ("error" in access) {
    return access.error;
  }

  const connector = await prisma.aggregatorConnection.findUnique({
    where: { id: context.params.id },
  });

  if (!connector || !connector.isActive) {
    return NextResponse.json(
      { success: false, error: "Connector not found or inactive" },
      { status: 404 },
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (connector.authHeader && connector.authValue) {
    headers[connector.authHeader] = connector.authValue;
  }

  try {
    const response = await fetch(connector.endpoint, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          error: `Aggregator request failed (${response.status})`,
          details,
        },
        { status: 502 },
      );
    }

    const payload = await response.json();
    const records = normalizeRecords(payload);

    if (records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No usable founder records in aggregator response.",
        },
        { status: 400 },
      );
    }

    const result = await upsertFounderDirectoryFromN8N(records);

    await prisma.aggregatorConnection.update({
      where: { id: connector.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 500 },
    );
  }
}
