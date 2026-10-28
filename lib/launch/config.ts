function readInt(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name]?.trim() || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readBool(name: string, fallback = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) {
    return fallback;
  }
  return value === "1" || value === "true" || value === "yes";
}

export function getProductHuntToken(): string | null {
  return process.env.PRODUCT_HUNT_TOKEN?.trim() || null;
}

export function getLaunchSelectionConfig() {
  return {
    topN: readInt("PH_TOP_N", 10),
    topFeaturedRank: readInt("PH_TOP_FEATURED_RANK", 5),
    voteThreshold: readInt("PH_VOTE_THRESHOLD", 100),
  };
}

export function getOutreachConfig() {
  const smtpUser = process.env.SMTP_USER?.trim() || "";
  return {
    enabled: readBool("OUTREACH_ENABLED"),
    dailyLimit: readInt("OUTREACH_DAILY_LIMIT", 30),
    followUpDays: [readInt("OUTREACH_FOLLOWUP_1_DAYS", 3), readInt("OUTREACH_FOLLOWUP_2_DAYS", 4)],
    fromName: process.env.OUTREACH_FROM_NAME?.trim() || "100xFounder",
    fromEmail: process.env.OUTREACH_FROM_EMAIL?.trim() || smtpUser,
    replyTo: process.env.OUTREACH_REPLY_TO?.trim() || "",
    postalAddress: process.env.OUTREACH_POSTAL_ADDRESS?.trim() || "",
    smtp: {
      host: process.env.SMTP_HOST?.trim() || "smtp.hostinger.com",
      port: readInt("SMTP_PORT", 465),
      user: smtpUser,
      pass: process.env.SMTP_PASS?.trim() || "",
    },
    imap: {
      host: process.env.IMAP_HOST?.trim() || "imap.hostinger.com",
      port: readInt("IMAP_PORT", 993),
      user: process.env.IMAP_USER?.trim() || smtpUser,
      pass: process.env.IMAP_PASS?.trim() || process.env.SMTP_PASS?.trim() || "",
    },
  };
}

export function isSmtpConfigured(): boolean {
  const { smtp, fromEmail } = getOutreachConfig();
  return Boolean(smtp.host && smtp.user && smtp.pass && fromEmail);
}

export function isImapConfigured(): boolean {
  const { imap } = getOutreachConfig();
  return Boolean(imap.host && imap.user && imap.pass);
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET?.trim() || null;
}
