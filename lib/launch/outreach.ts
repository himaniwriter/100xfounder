import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer";
import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import { getOutreachConfig, isImapConfigured, isSmtpConfigured } from "@/lib/launch/config";
import { OUTREACH_STEP_COUNT, renderOutreachEmail } from "@/lib/launch/templates";
import { prisma } from "@/lib/prisma";
import { getSiteBaseUrl } from "@/lib/sitemap";

/** Contacts in these statuses still receive the next step of the sequence. */
const ACTIVE_STATUSES = ["queued", "contacted"];
const DAY_MS = 24 * 60 * 60 * 1000;

export function getFeatureUrl(token: string): string {
  return `${getSiteBaseUrl()}/feature/${token}`;
}

export function getUnsubscribeUrl(token: string): string {
  return `${getSiteBaseUrl()}/outreach/unsubscribe/${token}`;
}

export function getLaunchUrl(slug: string): string {
  return `${getSiteBaseUrl()}/launches/${slug}`;
}

function startOfUtcDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export type SendResult = {
  skipped?: string;
  attempted: number;
  sent: number;
  failed: number;
};

export async function sendDueOutreach(now = new Date()): Promise<SendResult> {
  const config = getOutreachConfig();
  if (!config.enabled) {
    return { skipped: "OUTREACH_ENABLED is not true", attempted: 0, sent: 0, failed: 0 };
  }
  if (!isSmtpConfigured()) {
    return { skipped: "SMTP is not configured", attempted: 0, sent: 0, failed: 0 };
  }
  if (!config.postalAddress) {
    // CAN-SPAM requires a physical postal address in commercial email.
    return { skipped: "OUTREACH_POSTAL_ADDRESS is not set", attempted: 0, sent: 0, failed: 0 };
  }

  await ensureLaunchOutreachSchema();
  const sentToday = await prisma.outreachMessage.count({
    where: { status: "sent", sentAt: { gte: startOfUtcDay(now) } },
  });
  const remaining = Math.max(config.dailyLimit - sentToday, 0);
  if (remaining === 0) {
    return { skipped: "Daily limit reached", attempted: 0, sent: 0, failed: 0 };
  }

  // Follow-ups first so threads progress before new conversations start.
  const due = await prisma.outreachContact.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      step: { lt: OUTREACH_STEP_COUNT },
      nextSendAt: { lte: now },
      product: { isPublished: true },
    },
    include: {
      product: true,
      messages: { where: { status: "sent" }, orderBy: { sentAt: "asc" }, take: 1 },
    },
    orderBy: [{ step: "desc" }, { nextSendAt: "asc" }],
    take: remaining,
  });

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });

  let sent = 0;
  let failed = 0;

  for (const contact of due) {
    const suppressed = await prisma.outreachSuppression.findUnique({ where: { email: contact.email } });
    if (suppressed) {
      await prisma.outreachContact.update({
        where: { id: contact.id },
        data: { status: "unsubscribed", nextSendAt: null },
      });
      continue;
    }

    const unsubscribeUrl = getUnsubscribeUrl(contact.token);
    const { subject, body } = renderOutreachEmail(contact.step, {
      firstName: contact.name?.split(/\s+/)[0] ?? null,
      productName: contact.product.name,
      tagline: contact.product.tagline,
      votesCount: contact.product.votesCount,
      listingUrl: getLaunchUrl(contact.product.slug),
      featureUrl: getFeatureUrl(contact.token),
      unsubscribeUrl,
      fromName: config.fromName,
      postalAddress: config.postalAddress,
    });
    const threadRoot = contact.messages[0]?.providerMessageId;

    try {
      const info = await transporter.sendMail({
        from: { name: config.fromName, address: config.fromEmail },
        to: contact.email,
        replyTo: config.replyTo || undefined,
        subject,
        text: body,
        inReplyTo: threadRoot || undefined,
        references: threadRoot ? [threadRoot] : undefined,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      const nextStep = contact.step + 1;
      const delayDays = config.followUpDays[contact.step] ?? null;
      await prisma.$transaction([
        prisma.outreachMessage.create({
          data: {
            contactId: contact.id,
            step: contact.step,
            subject,
            body,
            providerMessageId: info.messageId,
            status: "sent",
          },
        }),
        prisma.outreachContact.update({
          where: { id: contact.id },
          data: {
            step: nextStep,
            status: nextStep >= OUTREACH_STEP_COUNT ? "sequence_done" : "contacted",
            lastSentAt: now,
            nextSendAt:
              nextStep >= OUTREACH_STEP_COUNT || delayDays === null
                ? null
                : new Date(now.getTime() + delayDays * DAY_MS),
          },
        }),
      ]);
      sent += 1;
    } catch (error) {
      failed += 1;
      await prisma.outreachMessage.create({
        data: {
          contactId: contact.id,
          step: contact.step,
          subject,
          body,
          status: "failed",
          error: error instanceof Error ? error.message.slice(0, 500) : String(error),
        },
      });
      // Retry tomorrow rather than hammering a failing address.
      await prisma.outreachContact.update({
        where: { id: contact.id },
        data: { nextSendAt: new Date(now.getTime() + DAY_MS) },
      });
    }
  }

  return { attempted: due.length, sent, failed };
}

export async function suppressContact(token: string, reason: string) {
  await ensureLaunchOutreachSchema();
  const contact = await prisma.outreachContact.findUnique({ where: { token } });
  if (!contact) {
    return null;
  }
  await prisma.$transaction([
    prisma.outreachSuppression.upsert({
      where: { email: contact.email },
      create: { email: contact.email, reason },
      update: {},
    }),
    prisma.outreachContact.updateMany({
      where: { email: contact.email, status: { notIn: ["form_submitted", "featured"] } },
      data: { status: "unsubscribed", nextSendAt: null },
    }),
  ]);
  return contact;
}

export type ReplyCheckResult = {
  skipped?: string;
  scanned: number;
  replies: number;
  bounces: number;
};

/**
 * Stops the sequence for anyone who replied, and suppresses addresses that
 * bounced, by scanning the outreach mailbox over IMAP.
 */
export async function checkOutreachReplies(): Promise<ReplyCheckResult> {
  if (!isImapConfigured()) {
    return { skipped: "IMAP is not configured", scanned: 0, replies: 0, bounces: 0 };
  }
  await ensureLaunchOutreachSchema();

  const active = await prisma.outreachContact.findMany({
    where: { status: { in: ["contacted", "sequence_done"] }, lastSentAt: { not: null } },
    select: { id: true, email: true, lastSentAt: true },
  });
  if (active.length === 0) {
    return { scanned: 0, replies: 0, bounces: 0 };
  }

  const byEmail = new Map(active.map((contact) => [contact.email.toLowerCase(), contact]));
  const since = new Date(Math.min(...active.map((contact) => contact.lastSentAt!.getTime())) - DAY_MS);
  const { imap } = getOutreachConfig();
  const client = new ImapFlow({
    host: imap.host,
    port: imap.port,
    secure: imap.port === 993,
    auth: { user: imap.user, pass: imap.pass },
    logger: false,
  });

  const replied = new Set<string>();
  const bounced = new Set<string>();
  let scanned = 0;

  await client.connect();
  const lock = await client.getMailboxLock("INBOX");
  try {
    const uids = await client.search({ since }, { uid: true });
    if (uids && uids.length > 0) {
      for await (const message of client.fetch(uids, { envelope: true, source: true }, { uid: true })) {
        scanned += 1;
        const from = message.envelope?.from?.[0]?.address?.toLowerCase() || "";
        if (byEmail.has(from)) {
          replied.add(from);
          continue;
        }
        if (/^(mailer-daemon|postmaster)@/i.test(from) && message.source) {
          const raw = message.source.toString("utf8").toLowerCase();
          for (const email of byEmail.keys()) {
            if (raw.includes(email)) {
              bounced.add(email);
            }
          }
        }
      }
    }
  } finally {
    lock.release();
    await client.logout().catch(() => undefined);
  }

  const now = new Date();
  for (const email of replied) {
    await prisma.outreachContact.updateMany({
      where: { email, status: { in: ["contacted", "sequence_done"] } },
      data: { status: "replied", repliedAt: now, nextSendAt: null },
    });
  }
  for (const email of bounced) {
    if (replied.has(email)) continue;
    await prisma.$transaction([
      prisma.outreachSuppression.upsert({ where: { email }, create: { email, reason: "bounced" }, update: {} }),
      prisma.outreachContact.updateMany({ where: { email }, data: { status: "bounced", nextSendAt: null } }),
    ]);
  }

  return { scanned, replies: replied.size, bounces: bounced.size };
}
