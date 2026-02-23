import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { readAdminBlogPosts } from "@/lib/admin/blog-content-store";
import { readGlobalSiteSettings } from "@/lib/site-settings";

type HookKey =
  | "publish"
  | "news_scraper"
  | "newsletter_distribution"
  | "data_enrichment"
  | "founders_sync"
  | "interview_intake"
  | "guest_post_orders"
  | "instagram_sync";

type HookConfig = {
  key: HookKey;
  label: string;
  url: string;
  required: boolean;
};

type HookStatus = {
  key: HookKey;
  label: string;
  required: boolean;
  configured: boolean;
  maskedUrl: string;
  confirmed: boolean;
  statusCode?: number;
  responseSnippet?: string;
  error?: string;
};

const confirmSchema = z.object({
  action: z.literal("confirm_hooks"),
});

function maskUrl(value: string): string {
  if (!value.trim()) {
    return "Not configured";
  }

  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return value;
  }
}

function parsePositiveNumber(value: string): number | null {
  const num = Number(value.trim());
  if (!Number.isFinite(num) || num <= 0) {
    return null;
  }
  return Math.round(num);
}

async function loadHookConfigs(): Promise<{
  secret: string;
  hooks: HookConfig[];
}> {
  const settings = await readGlobalSiteSettings();

  const hooks: HookConfig[] = [
    {
      key: "publish",
      label: "Publish Trigger",
      url:
        settings.n8nPrimaryWebhookUrl.trim() ||
        process.env.N8N_PUBLISH_WEBHOOK_URL ||
        "",
      required: true,
    },
    {
      key: "news_scraper",
      label: "News Scraper",
      url:
        settings.n8nNewsScraperWebhookUrl.trim() ||
        process.env.N8N_NEWS_SCRAPER_WEBHOOK_URL ||
        "",
      required: true,
    },
    {
      key: "newsletter_distribution",
      label: "Distribution/Newsletter",
      url:
        settings.n8nNewsletterWebhookUrl.trim() ||
        process.env.N8N_NEWSLETTER_SYNC_WEBHOOK_URL ||
        "",
      required: true,
    },
    {
      key: "data_enrichment",
      label: "Data Enrichment",
      url:
        settings.n8nEnrichDataWebhookUrl.trim() ||
        process.env.N8N_ENRICH_DATA_WEBHOOK_URL ||
        "",
      required: false,
    },
    {
      key: "founders_sync",
      label: "Founders Sync",
      url:
        settings.n8nFoundersSyncWebhookUrl.trim() ||
        process.env.N8N_FOUNDERS_SYNC_WEBHOOK_URL ||
        "",
      required: false,
    },
    {
      key: "interview_intake",
      label: "Interview Intake",
      url: process.env.N8N_INTERVIEW_WEBHOOK_URL || "",
      required: true,
    },
    {
      key: "guest_post_orders",
      label: "Guest Post Orders",
      url: process.env.N8N_GUEST_POST_WEBHOOK_URL || "",
      required: false,
    },
    {
      key: "instagram_sync",
      label: "Instagram Sync",
      url: process.env.N8N_INSTAGRAM_SYNC_WEBHOOK_URL || "",
      required: false,
    },
  ];

  const secret = settings.n8nSecretKey.trim() || process.env.N8N_SYNC_SECRET || "";

  return { secret, hooks };
}

function buildHookStatuses(configs: HookConfig[]): HookStatus[] {
  return configs.map((item) => ({
    key: item.key,
    label: item.label,
    required: item.required,
    configured: Boolean(item.url.trim()),
    maskedUrl: maskUrl(item.url),
    confirmed: false,
  }));
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const [settings, posts, hookData] = await Promise.all([
      readGlobalSiteSettings(),
      readAdminBlogPosts(),
      loadHookConfigs(),
    ]);

    const editorialReviewSlaHours = parsePositiveNumber(settings.editorialReviewSlaHours);
    const correctionsResponseSlaHours = parsePositiveNumber(
      settings.correctionsResponseSlaHours,
    );
    const publishCadencePerDay = parsePositiveNumber(settings.publishCadencePerDay);

    const correctionAuditItems = posts
      .filter((post) => post.status === "PUBLISHED")
      .map((post) => {
        const correctionUpdates = (post.updates ?? []).filter((update) =>
          `${update.changeType} ${update.note ?? ""}`.toLowerCase().includes("correction"),
        );
        const hasCorrectionNote = Boolean(post.correctionNote?.trim());
        const hasCorrectionUpdate = correctionUpdates.length > 0;
        const latestCorrectionAt =
          correctionUpdates[0]?.createdAt ?? (hasCorrectionNote ? post.updatedAt : undefined);
        return {
          slug: post.slug,
          title: post.title,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt ?? post.publishedAt,
          correctionNote: post.correctionNote ?? "",
          correctionUpdates: correctionUpdates.length,
          latestCorrectionAt,
          hasCorrection: hasCorrectionNote || hasCorrectionUpdate,
        };
      })
      .filter((item) => item.hasCorrection)
      .sort((a, b) => {
        const left = Date.parse(b.latestCorrectionAt ?? b.updatedAt);
        const right = Date.parse(a.latestCorrectionAt ?? a.updatedAt);
        return left - right;
      });

    const correctionAudit = {
      totalCorrectedStories: correctionAuditItems.length,
      stories: correctionAuditItems.slice(0, 40),
    };

    const hooks = buildHookStatuses(hookData.hooks);
    const requiredMissing = hooks
      .filter((hook) => hook.required && !hook.configured)
      .map((hook) => hook.label);
    const secretConfigured = Boolean(hookData.secret.trim());

    const checks = [
      {
        key: "editorial_review_sla",
        label: "Editorial review SLA set",
        passed: editorialReviewSlaHours !== null,
      },
      {
        key: "corrections_sla",
        label: "Corrections response SLA set",
        passed: correctionsResponseSlaHours !== null,
      },
      {
        key: "publish_cadence",
        label: "Publish cadence target set",
        passed: publishCadencePerDay !== null,
      },
      {
        key: "n8n_secret",
        label: "n8n secret configured",
        passed: secretConfigured,
      },
      {
        key: "required_hooks",
        label: "Required n8n hooks configured",
        passed: requiredMissing.length === 0,
      },
    ];

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      editorialSla: {
        editorialReviewSlaHours,
        correctionsResponseSlaHours,
        publishCadencePerDay,
      },
      correctionAudit,
      hooks,
      checks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to build newsroom production checklist.",
      },
      { status: 500 },
    );
  }
}

async function confirmHook(
  hook: HookConfig,
  secret: string,
  adminEmail: string,
): Promise<HookStatus> {
  const status: HookStatus = {
    key: hook.key,
    label: hook.label,
    required: hook.required,
    configured: Boolean(hook.url.trim()),
    maskedUrl: maskUrl(hook.url),
    confirmed: false,
  };

  if (!hook.url.trim()) {
    status.error = "Webhook URL not configured.";
    return status;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (secret.trim()) {
    headers["x-secret-key"] = secret;
  }

  try {
    const response = await fetch(hook.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        action: "newsroom_hook_confirmation",
        hook: hook.key,
        source: "100xfounder-admin-checklist",
        requestedBy: adminEmail,
        requestedAt: new Date().toISOString(),
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const rawText = await response.text();
    status.statusCode = response.status;
    status.confirmed = response.ok;
    status.responseSnippet = rawText.slice(0, 200) || undefined;
    if (!response.ok) {
      status.error = `Webhook returned ${response.status}`;
    }
    return status;
  } catch (error) {
    clearTimeout(timeout);
    status.error = error instanceof Error ? error.message : "Unknown request error.";
    return status;
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid checklist action." },
      { status: 400 },
    );
  }

  try {
    const { secret, hooks } = await loadHookConfigs();
    const statuses = await Promise.all(
      hooks.map((hook) => confirmHook(hook, secret, access.session.email)),
    );

    return NextResponse.json({
      success: true,
      confirmedAt: new Date().toISOString(),
      hooks: statuses,
      passed: statuses.every((item) => !item.required || item.confirmed),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to confirm n8n hooks.",
      },
      { status: 500 },
    );
  }
}
