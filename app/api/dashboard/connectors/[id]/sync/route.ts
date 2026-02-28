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

    const linkedinUrl =
      typeof record.linkedinUrl === "string" ? record.linkedinUrl : undefined;

    records.push({
      founderName,
      companyName,
      productSummary,
      industry: typeof record.industry === "string" ? record.industry : undefined,
      stage: typeof record.stage === "string" ? record.stage : undefined,
      fundingInfo:
        typeof record.fundingInfo === "string" ? record.fundingInfo : undefined,
      websiteUrl:
        typeof record.websiteUrl === "string" ? record.websiteUrl : undefined,
      employeeCount:
        typeof record.employeeCount === "string" ? record.employeeCount : undefined,
      techStack: Array.isArray(record.techStack)
        ? record.techStack.filter((item): item is string => typeof item === "string")
        : undefined,
      recentNews: Array.isArray(record.recentNews)
        ? record.recentNews.filter((item): item is string => typeof item === "string")
        : undefined,
      linkedinUrl,
      twitterUrl:
        typeof record.twitterUrl === "string" ? record.twitterUrl : undefined,
      headquarters:
        typeof record.headquarters === "string" ? record.headquarters : undefined,
      sourceUrl: typeof record.sourceUrl === "string" ? record.sourceUrl : undefined,
      ycProfileUrl:
        typeof record.ycProfileUrl === "string" ? record.ycProfileUrl : undefined,
      avatarUrl:
        typeof record.avatarUrl === "string"
          ? record.avatarUrl
          : undefined,
      verified:
        typeof record.verified === "boolean" ? record.verified : undefined,
      foundedYear:
        typeof record.foundedYear === "number" ? record.foundedYear : undefined,
      country:
        typeof record.country === "string" ? record.country : undefined,
      countryTier:
        record.countryTier === "TIER_1" ||
        record.countryTier === "TIER_2" ||
        record.countryTier === "TIER_3"
          ? record.countryTier
          : undefined,
      fundingTotalDisplay:
        typeof record.fundingTotalDisplay === "string"
          ? record.fundingTotalDisplay
          : undefined,
      fundingTotalUsd:
        typeof record.fundingTotalUsd === "number" ? record.fundingTotalUsd : undefined,
      lastRound:
        record.lastRound && typeof record.lastRound === "object"
          ? (record.lastRound as FounderSyncInput["lastRound"])
          : undefined,
      allRounds: Array.isArray(record.allRounds)
        ? (record.allRounds as FounderSyncInput["allRounds"])
        : undefined,
      isHiring:
        typeof record.isHiring === "boolean" ? record.isHiring : undefined,
      hiringRoles: Array.isArray(record.hiringRoles)
        ? record.hiringRoles.filter((item): item is string => typeof item === "string")
        : undefined,
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
