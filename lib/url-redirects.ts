import { Prisma } from "@prisma/client";
import { ensureGrowthWaveSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

type UrlRedirectRuleRow = {
  id: string;
  source_path: string;
  target_url: string;
  is_active: boolean;
  note: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export type UrlRedirectRule = {
  id: string;
  sourcePath: string;
  targetUrl: string;
  isActive: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function toRule(row: UrlRedirectRuleRow): UrlRedirectRule {
  const createdAt =
    row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  const updatedAt =
    row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at);

  return {
    id: row.id,
    sourcePath: row.source_path,
    targetUrl: row.target_url,
    isActive: row.is_active,
    note: row.note,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date().toISOString() : updatedAt.toISOString(),
  };
}

function stripQueryAndHash(value: string): string {
  return value.split("?")[0]?.split("#")[0] ?? value;
}

function trimTrailingSlash(path: string): string {
  if (path === "/") {
    return path;
  }
  return path.replace(/\/+$/, "");
}

export function normalizeRedirectSourcePath(input: string): string {
  const raw = input.trim();
  if (!raw) {
    return "/";
  }

  let pathname = raw;
  if (/^https?:\/\//i.test(raw)) {
    try {
      pathname = new URL(raw).pathname;
    } catch {
      pathname = raw;
    }
  }

  pathname = stripQueryAndHash(pathname).trim();
  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  pathname = pathname.replace(/\/{2,}/g, "/");
  pathname = trimTrailingSlash(pathname);
  return pathname || "/";
}

export function normalizeRedirectTargetUrl(input: string): string {
  const raw = input.trim();
  if (!raw) {
    return "/";
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  let value = raw;
  if (!value.startsWith("/")) {
    value = `/${value}`;
  }
  return value.replace(/\/{2,}/g, "/");
}

export async function findActiveRedirectTarget(pathname: string): Promise<string | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureGrowthWaveSchema();
  const normalizedPath = normalizeRedirectSourcePath(pathname);
  const rows = await prisma.$queryRaw<UrlRedirectRuleRow[]>(
    Prisma.sql`
      SELECT id, source_path, target_url, is_active, note, created_at, updated_at
      FROM public.url_redirect_rules
      WHERE source_path = ${normalizedPath}
        AND is_active = true
      LIMIT 1
    `,
  );

  return rows[0]?.target_url ?? null;
}

export async function findFirstActiveRedirectTarget(paths: string[]): Promise<string | null> {
  for (const path of paths) {
    const target = await findActiveRedirectTarget(path);
    if (target) {
      return target;
    }
  }

  return null;
}

export async function listRedirectRules(options: {
  pathContains?: string;
  limit?: number;
} = {}): Promise<UrlRedirectRule[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  await ensureGrowthWaveSchema();
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 500);
  const pathContains = options.pathContains?.trim();
  const wherePath =
    pathContains && pathContains.length > 0
      ? Prisma.sql`WHERE source_path ILIKE ${`%${pathContains}%`}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<UrlRedirectRuleRow[]>(
    Prisma.sql`
      SELECT id, source_path, target_url, is_active, note, created_at, updated_at
      FROM public.url_redirect_rules
      ${wherePath}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `,
  );

  return rows.map(toRule);
}

export async function upsertRedirectRule(input: {
  sourcePath: string;
  targetUrl: string;
  isActive?: boolean;
  note?: string | null;
}): Promise<UrlRedirectRule | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureGrowthWaveSchema();
  const sourcePath = normalizeRedirectSourcePath(input.sourcePath);
  const targetUrl = normalizeRedirectTargetUrl(input.targetUrl);
  const isActive = input.isActive ?? true;
  const note = input.note?.trim() ? input.note.trim() : null;

  const rows = await prisma.$queryRaw<UrlRedirectRuleRow[]>(
    Prisma.sql`
      INSERT INTO public.url_redirect_rules (
        source_path,
        target_url,
        is_active,
        note,
        updated_at
      )
      VALUES (
        ${sourcePath},
        ${targetUrl},
        ${isActive},
        ${note},
        now()
      )
      ON CONFLICT (source_path)
      DO UPDATE
      SET
        target_url = EXCLUDED.target_url,
        is_active = EXCLUDED.is_active,
        note = EXCLUDED.note,
        updated_at = now()
      RETURNING id, source_path, target_url, is_active, note, created_at, updated_at
    `,
  );

  return rows[0] ? toRule(rows[0]) : null;
}

export async function updateRedirectRuleById(
  id: string,
  input: {
    sourcePath?: string;
    targetUrl?: string;
    isActive?: boolean;
    note?: string | null;
  },
): Promise<UrlRedirectRule | null> {
  if (!isDatabaseConfigured()) {
    return null;
  }

  await ensureGrowthWaveSchema();

  const existingRows = await prisma.$queryRaw<UrlRedirectRuleRow[]>(
    Prisma.sql`
      SELECT id, source_path, target_url, is_active, note, created_at, updated_at
      FROM public.url_redirect_rules
      WHERE id = ${id}::uuid
      LIMIT 1
    `,
  );

  const existing = existingRows[0];
  if (!existing) {
    return null;
  }

  const sourcePath =
    input.sourcePath !== undefined
      ? normalizeRedirectSourcePath(input.sourcePath)
      : existing.source_path;
  const targetUrl =
    input.targetUrl !== undefined
      ? normalizeRedirectTargetUrl(input.targetUrl)
      : existing.target_url;
  const isActive = input.isActive ?? existing.is_active;
  const note =
    input.note !== undefined ? (input.note?.trim() ? input.note.trim() : null) : existing.note;

  const updatedRows = await prisma.$queryRaw<UrlRedirectRuleRow[]>(
    Prisma.sql`
      UPDATE public.url_redirect_rules
      SET
        source_path = ${sourcePath},
        target_url = ${targetUrl},
        is_active = ${isActive},
        note = ${note},
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING id, source_path, target_url, is_active, note, created_at, updated_at
    `,
  );

  return updatedRows[0] ? toRule(updatedRows[0]) : null;
}

export async function deleteRedirectRuleById(id: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false;
  }

  await ensureGrowthWaveSchema();

  const deletedCount = await prisma.$executeRaw(
    Prisma.sql`
      DELETE FROM public.url_redirect_rules
      WHERE id = ${id}::uuid
    `,
  );

  return deletedCount > 0;
}
