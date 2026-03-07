#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { PrismaClient } from "@prisma/client";

const DEFAULT_BATCH_SIZE = 200;
const DEFAULT_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_ANTIGRAVITY_PATH = "/api/import/100xfounder";

const AVAILABLE_DATASETS = [
  "founders",
  "posts",
  "authors",
  "featured_requests",
  "interview_submissions",
  "guest_post_orders",
  "instagram_posts",
  "pricing_waitlist_requests",
  "site_events",
  "job_postings",
  "salary_equity_entries",
  "url_redirect_rules",
];

function parseDotenvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const equalsIndex = trimmed.indexOf("=");
  if (equalsIndex <= 0) {
    return null;
  }

  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  value = value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");

  return { key, value };
}

function loadDotenvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseDotenvLine(line);
    if (!parsed) {
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, parsed.key)) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

function loadLocalEnvFiles() {
  const cwd = process.cwd();
  loadDotenvFile(join(cwd, ".env.local"));
  loadDotenvFile(join(cwd, ".env"));
}

function printUsage() {
  console.log(`
Usage:
  node actions/migrate-100x-to-antigravity.mjs [options]

Options:
  --push                      Push exported data to Antigravity API.
  --dry-run                   Export snapshot only (default when --push not set).
  --include-drafts            Include draft posts in posts export.
  --tables=a,b,c              Comma-separated dataset names to migrate.
  --batch-size=NUMBER         Batch size for API push (default: ${DEFAULT_BATCH_SIZE}).
  --retries=NUMBER            Retry attempts per batch (default: ${DEFAULT_RETRIES}).
  --timeout-ms=NUMBER         Request timeout in ms (default: ${DEFAULT_TIMEOUT_MS}).
  --endpoint=URL              Full Antigravity endpoint override.
  --output=PATH               Snapshot file path override.
  --events-limit=NUMBER       Max site events exported (default: 5000).
  --verbose                   Verbose logs.
  --help                      Show this help.

Environment:
  DATABASE_URL                Source 100X Founder database URL (required).
  ANTIGRAVITY_BASE_URL        Antigravity base URL (required when --push and --endpoint not set).
  ANTIGRAVITY_PATH            API path (default: ${DEFAULT_ANTIGRAVITY_PATH}).
  ANTIGRAVITY_API_KEY         API key value (optional).
  ANTIGRAVITY_AUTH_HEADER     API key header name (default: x-api-key).
  ANTIGRAVITY_BEARER_TOKEN    Bearer token alternative (optional).
`);
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv) {
  const options = {
    push: false,
    dryRun: true,
    includeDrafts: false,
    tables: [...AVAILABLE_DATASETS],
    batchSize: DEFAULT_BATCH_SIZE,
    retries: DEFAULT_RETRIES,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    endpoint: "",
    outputPath: "",
    eventsLimit: 5000,
    verbose: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--push") {
      options.push = true;
      options.dryRun = false;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--include-drafts") {
      options.includeDrafts = true;
      continue;
    }

    if (arg === "--verbose") {
      options.verbose = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg.startsWith("--tables=")) {
      const tables = arg
        .slice("--tables=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      options.tables = tables;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      options.batchSize = parseInteger(arg.slice("--batch-size=".length), DEFAULT_BATCH_SIZE);
      continue;
    }

    if (arg.startsWith("--retries=")) {
      options.retries = parseInteger(arg.slice("--retries=".length), DEFAULT_RETRIES);
      continue;
    }

    if (arg.startsWith("--timeout-ms=")) {
      options.timeoutMs = parseInteger(arg.slice("--timeout-ms=".length), DEFAULT_TIMEOUT_MS);
      continue;
    }

    if (arg.startsWith("--events-limit=")) {
      options.eventsLimit = parseInteger(arg.slice("--events-limit=".length), 5000);
      continue;
    }

    if (arg.startsWith("--endpoint=")) {
      options.endpoint = arg.slice("--endpoint=".length).trim();
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length).trim();
      continue;
    }
  }

  return options;
}

function normalizeDatasetSelection(tableArgs) {
  const unknown = tableArgs.filter((table) => !AVAILABLE_DATASETS.includes(table));
  if (unknown.length > 0) {
    throw new Error(
      `Unknown datasets: ${unknown.join(", ")}. Available: ${AVAILABLE_DATASETS.join(", ")}`,
    );
  }

  return Array.from(new Set(tableArgs));
}

function normalizeJsonValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }

  if (typeof value === "object") {
    const output = {};
    for (const [key, nested] of Object.entries(value)) {
      output[key] = normalizeJsonValue(nested);
    }
    return output;
  }

  return value;
}

function chunk(items, size) {
  const out = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveEndpoint(options) {
  if (options.endpoint) {
    return options.endpoint;
  }

  const base = (process.env.ANTIGRAVITY_BASE_URL || "").trim().replace(/\/+$/, "");
  const path = (process.env.ANTIGRAVITY_PATH || DEFAULT_ANTIGRAVITY_PATH).trim();

  if (!base) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchRawTable(prisma, tableName, orderBy, limit = null) {
  const ordering = orderBy ? ` ORDER BY ${orderBy}` : "";
  const limitClause = Number.isFinite(limit) && limit > 0 ? ` LIMIT ${Math.floor(limit)}` : "";

  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM public.${tableName}${ordering}${limitClause}`,
    );
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    const message = String(error?.message || "");
    if (
      message.includes(`relation "public.${tableName}" does not exist`) ||
      message.includes(`relation "${tableName}" does not exist`)
    ) {
      return [];
    }
    throw error;
  }
}

async function exportDatasets(prisma, selected, options) {
  const datasets = {};

  if (selected.includes("founders")) {
    datasets.founders = await prisma.founderDirectoryEntry.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  if (selected.includes("posts")) {
    datasets.posts = await prisma.post.findMany({
      where: options.includeDrafts ? undefined : { status: "PUBLISHED" },
      include: {
        citations: true,
        updates: true,
        authorProfile: true,
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  if (selected.includes("authors")) {
    datasets.authors = await prisma.author.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  if (selected.includes("featured_requests")) {
    datasets.featured_requests = await prisma.featuredFounderRequest.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  if (selected.includes("interview_submissions")) {
    datasets.interview_submissions = await prisma.interviewQuestionnaireSubmission.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  if (selected.includes("guest_post_orders")) {
    datasets.guest_post_orders = await prisma.guestPostOrder.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  if (selected.includes("instagram_posts")) {
    datasets.instagram_posts = await prisma.instagramPost.findMany({
      orderBy: { postedAt: "desc" },
    });
  }

  if (selected.includes("pricing_waitlist_requests")) {
    datasets.pricing_waitlist_requests = await prisma.pricingWaitlistRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  if (selected.includes("site_events")) {
    datasets.site_events = await prisma.siteEvent.findMany({
      take: options.eventsLimit,
      orderBy: { createdAt: "desc" },
    });
  }

  if (selected.includes("job_postings")) {
    datasets.job_postings = await fetchRawTable(
      prisma,
      "job_postings",
      "COALESCE(posted_at, created_at) DESC, updated_at DESC",
    );
  }

  if (selected.includes("salary_equity_entries")) {
    datasets.salary_equity_entries = await fetchRawTable(
      prisma,
      "salary_equity_entries",
      "updated_at DESC, created_at DESC",
    );
  }

  if (selected.includes("url_redirect_rules")) {
    datasets.url_redirect_rules = await fetchRawTable(
      prisma,
      "url_redirect_rules",
      "updated_at DESC, created_at DESC",
    );
  }

  return normalizeJsonValue(datasets);
}

async function pushBatch({ endpoint, headers, timeoutMs, payload, retries }) {
  let attempt = 0;
  while (attempt < retries) {
    attempt += 1;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `HTTP ${response.status} (${response.statusText}) ${body.slice(0, 300)}`,
        );
      }

      return true;
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }

      await sleep(500 * attempt);
    }
  }

  return false;
}

async function pushToAntigravity({ endpoint, apiKey, authHeader, bearerToken, payload, options }) {
  const headers = {
    "content-type": "application/json",
  };

  if (apiKey) {
    headers[authHeader] = apiKey;
  }

  if (bearerToken) {
    headers.authorization = `Bearer ${bearerToken}`;
  }

  const pushSummary = {
    endpoint,
    pushedEntities: 0,
    pushedRecords: 0,
    failedBatches: 0,
    failures: [],
  };

  for (const [entity, records] of Object.entries(payload.data)) {
    if (!Array.isArray(records) || records.length === 0) {
      continue;
    }

    const batches = chunk(records, options.batchSize);
    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      const body = {
        source: payload.source,
        entity,
        exportedAt: payload.exportedAt,
        batch: {
          index: index + 1,
          total: batches.length,
          size: batch.length,
        },
        records: batch,
      };

      try {
        await pushBatch({
          endpoint,
          headers,
          timeoutMs: options.timeoutMs,
          payload: body,
          retries: options.retries,
        });

        pushSummary.pushedRecords += batch.length;
      } catch (error) {
        pushSummary.failedBatches += 1;
        pushSummary.failures.push({
          entity,
          batch: index + 1,
          error: String(error?.message || error),
        });
      }
    }

    pushSummary.pushedEntities += 1;
  }

  return pushSummary;
}

async function main() {
  loadLocalEnvFiles();
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    process.exit(0);
  }

  const selectedDatasets = normalizeDatasetSelection(options.tables);
  const endpoint = resolveEndpoint(options);
  const apiKey = (process.env.ANTIGRAVITY_API_KEY || "").trim();
  const authHeader = (process.env.ANTIGRAVITY_AUTH_HEADER || "x-api-key").trim();
  const bearerToken = (process.env.ANTIGRAVITY_BEARER_TOKEN || "").trim();

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  if (options.push && !endpoint) {
    throw new Error(
      "Antigravity endpoint missing. Set --endpoint or ANTIGRAVITY_BASE_URL (+ optional ANTIGRAVITY_PATH).",
    );
  }

  const prisma = new PrismaClient({ log: ["error"] });
  const startedAt = new Date();

  try {
    const data = await exportDatasets(prisma, selectedDatasets, options);
    const counts = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0]),
    );

    const snapshot = {
      source: "100xfounder",
      exportedAt: new Date().toISOString(),
      includeDrafts: options.includeDrafts,
      selectedDatasets,
      counts,
      data,
    };

    const defaultOutputDir = join(process.cwd(), "reports", "migrations");
    mkdirSync(defaultOutputDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputPath = options.outputPath || join(defaultOutputDir, `antigravity-migration-${stamp}.json`);
    writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

    const result = {
      success: true,
      mode: options.push ? "push" : "dry-run",
      outputPath,
      counts,
      durationMs: Date.now() - startedAt.getTime(),
      push: null,
    };

    if (options.push) {
      const push = await pushToAntigravity({
        endpoint,
        apiKey,
        authHeader,
        bearerToken,
        payload: snapshot,
        options,
      });
      result.push = push;
      if (push.failedBatches > 0) {
        result.success = false;
      }
    }

    if (options.verbose) {
      console.log(JSON.stringify(snapshot, null, 2));
    }

    console.log(JSON.stringify(result, null, 2));
    if (!result.success) {
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: String(error?.message || error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
