"use client";

import type { SiteEventName } from "@/lib/analytics/site-events";

const TRACKING_SESSION_COOKIE = "xf_session_id";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") {
    return;
  }

  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function getOrCreateSessionId(): string {
  const existing = readCookie(TRACKING_SESSION_COOKIE);
  if (existing) {
    return existing;
  }

  const created =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  setCookie(TRACKING_SESSION_COOKIE, created, 365);
  return created;
}

export async function trackSiteEvent(input: {
  event_name: SiteEventName;
  path: string;
  payload?: Record<string, unknown>;
}) {
  try {
    await fetch("/api/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event_name: input.event_name,
        path: input.path,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        session_id: getOrCreateSessionId(),
        payload: input.payload ?? null,
      }),
    });
  } catch {
    // Tracking failures are intentionally ignored.
  }
}

export async function logDataUnlock(companyId: string, companyViewed?: string) {
  try {
    await fetch("/api/events/unlock-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId,
        companyViewed: companyViewed ?? companyId,
      }),
    });
  } catch {
    // Intentionally no-op for client analytics failures.
  }
}
