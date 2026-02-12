import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";

const triggerSchema = z.object({
  action: z.enum(["news_scraper", "sync_newsletter", "enrich_data"]),
});

function getWebhookUrl(action: "news_scraper" | "sync_newsletter" | "enrich_data"): string | null {
  if (action === "news_scraper") {
    return (
      process.env.N8N_NEWS_SCRAPER_WEBHOOK_URL ??
      process.env.N8N_TRIGGER_NEWS_SCRAPER_WEBHOOK_URL ??
      null
    );
  }

  if (action === "sync_newsletter") {
    return (
      process.env.N8N_NEWSLETTER_SYNC_WEBHOOK_URL ??
      process.env.N8N_NEWSLETTER_WEBHOOK_URL ??
      null
    );
  }

  return (
    process.env.N8N_ENRICH_DATA_WEBHOOK_URL ??
    process.env.N8N_COMPANY_CONTENT_WEBHOOK_URL ??
    null
  );
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = triggerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid trigger payload." },
      { status: 400 },
    );
  }

  const webhookUrl = getWebhookUrl(parsed.data.action);
  if (!webhookUrl) {
    return NextResponse.json(
      {
        success: false,
        error: `Webhook URL is not configured for action: ${parsed.data.action}`,
      },
      { status: 400 },
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const secret = process.env.N8N_SYNC_SECRET ?? process.env.N8N_SECRET_KEY;
  if (secret) {
    headers["x-secret-key"] = secret;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: parsed.data.action,
        triggeredBy: access.session.email,
        triggeredAt: new Date().toISOString(),
      }),
      cache: "no-store",
    });

    const rawText = await response.text();
    const logMessage = response.ok
      ? `✅ Success (${response.status}): ${rawText || "Workflow accepted."}`
      : `❌ Failed (${response.status}): ${rawText || "No response body."}`;

    return NextResponse.json(
      {
        success: response.ok,
        statusCode: response.status,
        log: logMessage,
      },
      { status: response.ok ? 200 : 502 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to call automation webhook.",
      },
      { status: 500 },
    );
  }
}
