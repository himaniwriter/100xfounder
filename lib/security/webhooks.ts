import { timingSafeEqual } from "node:crypto";
import { readGlobalSiteSettings } from "@/lib/site-settings";

function safeCompare(secretA: string, secretB: string): boolean {
  const left = Buffer.from(secretA);
  const right = Buffer.from(secretB);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export async function getConfiguredN8nSecret(): Promise<string> {
  const settings = await readGlobalSiteSettings();
  return (
    settings.n8nSecretKey.trim() ||
    process.env.N8N_SYNC_SECRET ||
    process.env.N8N_SECRET_KEY ||
    ""
  );
}

export async function isAuthorizedN8nWebhook(headers: Headers): Promise<boolean> {
  const configuredSecret = await getConfiguredN8nSecret();
  if (!configuredSecret) {
    return false;
  }

  const headerSecret =
    headers.get("x-n8n-secret") ||
    headers.get("x-secret-key") ||
    "";

  if (!headerSecret) {
    return false;
  }

  return safeCompare(headerSecret, configuredSecret);
}
