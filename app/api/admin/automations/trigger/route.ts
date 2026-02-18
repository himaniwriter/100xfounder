import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { readGlobalSiteSettings } from "@/lib/site-settings";

const automationActionSchema = z.enum([
  "news_scraper",
  "sync_newsletter",
  "enrich_data",
  "founders_sync",
]);
type AutomationAction = z.infer<typeof automationActionSchema>;

const triggerSchema = z.object({
  action: automationActionSchema,
});

async function getWebhookUrl(action: AutomationAction): Promise<string | null> {
  const settings = await readGlobalSiteSettings();
  const n8nPrimaryWebhookUrl = settings.n8nPrimaryWebhookUrl.trim();
  const n8nBaseWebhookUrl = settings.n8nBaseWebhookUrl.trim();
  const envNews =
    process.env.N8N_NEWS_SCRAPER_WEBHOOK_URL ||
    process.env.N8N_TRIGGER_NEWS_SCRAPER_WEBHOOK_URL ||
    "";
  const envNewsletter =
    process.env.N8N_NEWSLETTER_SYNC_WEBHOOK_URL ||
    process.env.N8N_NEWSLETTER_WEBHOOK_URL ||
    "";
  const envEnrich =
    process.env.N8N_ENRICH_DATA_WEBHOOK_URL ||
    process.env.N8N_COMPANY_CONTENT_WEBHOOK_URL ||
    "";
  const envFoundersSync =
    process.env.N8N_FOUNDERS_SYNC_WEBHOOK_URL ||
    process.env.N8N_TRIGGER_FOUNDERS_SYNC_WEBHOOK_URL ||
    "";

  if (action === "news_scraper") {
    return (
      settings.n8nNewsScraperWebhookUrl.trim() ||
      n8nPrimaryWebhookUrl ||
      n8nBaseWebhookUrl ||
      envNews ||
      null
    );
  }

  if (action === "sync_newsletter") {
    return (
      settings.n8nNewsletterWebhookUrl.trim() ||
      n8nPrimaryWebhookUrl ||
      n8nBaseWebhookUrl ||
      envNewsletter ||
      null
    );
  }

  if (action === "founders_sync") {
    return (
      settings.n8nFoundersSyncWebhookUrl.trim() ||
      n8nPrimaryWebhookUrl ||
      n8nBaseWebhookUrl ||
      envFoundersSync ||
      null
    );
  }

  return (
    settings.n8nEnrichDataWebhookUrl.trim() ||
    n8nPrimaryWebhookUrl ||
    n8nBaseWebhookUrl ||
    envEnrich ||
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

  const settings = await readGlobalSiteSettings();
  const webhookUrl = await getWebhookUrl(parsed.data.action);
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

  const secret =
    settings.n8nSecretKey.trim() ||
    process.env.N8N_SYNC_SECRET ||
    process.env.N8N_SECRET_KEY ||
    "";
  if (secret) {
    headers["x-secret-key"] = secret;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: parsed.data.action,
        source: "100xfounder-admin",
        schemaVersion: "2026-02-18",
        triggeredBy: access.session.email,
        triggeredByRole: access.session.role,
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
