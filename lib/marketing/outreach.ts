import { getSiteBaseUrl } from "@/lib/sitemap";

const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/100x.founder/";
const DEFAULT_WHATSAPP_NUMBER = "917988253046";
const DEFAULT_WHATSAPP_MESSAGE = "I want to get featured on 100xfounder.com";
const LEGACY_WHATSAPP_NUMBER = "918989613141";
const LEGACY_WHATSAPP_MESSAGE = "Hi 100Xfounder, I want to get featured on 100xfounder.com.";

function sanitizeWhatsAppNumber(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function getInstagramProfileUrl(): string {
  return process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || DEFAULT_INSTAGRAM_URL;
}

export function getWhatsAppNumber(): string {
  const configured = sanitizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "");
  if (!configured || configured === LEGACY_WHATSAPP_NUMBER) {
    return DEFAULT_WHATSAPP_NUMBER;
  }

  return configured;
}

export function getWhatsAppFeaturedTemplate(): string {
  const configured = process.env.NEXT_PUBLIC_WHATSAPP_FEATURED_TEXT?.trim() || "";
  if (!configured || configured === LEGACY_WHATSAPP_MESSAGE) {
    return DEFAULT_WHATSAPP_MESSAGE;
  }

  return configured;
}

export function buildWhatsAppMessage(input: {
  context?: string;
  plan?: string;
  source?: string;
}): string {
  void input;
  return getWhatsAppFeaturedTemplate();
}

export function buildWhatsAppDeepLink(input: {
  context?: string;
  plan?: string;
  source?: string;
}): string | null {
  const number = getWhatsAppNumber();
  if (!number) {
    return null;
  }

  const text = encodeURIComponent(buildWhatsAppMessage(input));
  return `https://wa.me/${number}?text=${text}`;
}

export function buildWhatsAppRedirectPath(input: {
  context?: string;
  plan?: string;
  source?: string;
}): string {
  const params = new URLSearchParams();
  if (input.context) {
    params.set("context", input.context);
  }
  if (input.plan) {
    params.set("plan", input.plan);
  }
  if (input.source) {
    params.set("source", input.source);
  }

  const query = params.toString();
  return query ? `/api/redirect/whatsapp?${query}` : "/api/redirect/whatsapp";
}

export function getFeatureNowUrl(): string {
  return `${getSiteBaseUrl()}/feature-now`;
}
