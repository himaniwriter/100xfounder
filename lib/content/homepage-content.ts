import { promises as fs } from "node:fs";
import path from "node:path";

export type HomepageContent = {
  heroTitle: string;
  heroSubtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

const HOMEPAGE_CONTENT_PATH = path.join(
  process.cwd(),
  "lib/content/homepage-content.json",
);

const FALLBACK_CONTENT: HomepageContent = {
  heroTitle: "Get Discovered by Investors, Customers, and Talent on 100Xfounder.",
  heroSubtitle:
    "Create a verified founder profile with your funding, traction, and hiring signals in one place so the right people can trust and contact you faster.",
  primaryCtaLabel: "Browse Founder Profiles",
  primaryCtaHref: "/founders",
  secondaryCtaLabel: "View Feature Plans",
  secondaryCtaHref: "/get-featured",
};

export async function readHomepageContent(): Promise<HomepageContent> {
  try {
    const raw = await fs.readFile(HOMEPAGE_CONTENT_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<HomepageContent>;

    return {
      heroTitle: parsed.heroTitle ?? FALLBACK_CONTENT.heroTitle,
      heroSubtitle: parsed.heroSubtitle ?? FALLBACK_CONTENT.heroSubtitle,
      primaryCtaLabel: parsed.primaryCtaLabel ?? FALLBACK_CONTENT.primaryCtaLabel,
      primaryCtaHref: parsed.primaryCtaHref ?? FALLBACK_CONTENT.primaryCtaHref,
      secondaryCtaLabel: parsed.secondaryCtaLabel ?? FALLBACK_CONTENT.secondaryCtaLabel,
      secondaryCtaHref: parsed.secondaryCtaHref ?? FALLBACK_CONTENT.secondaryCtaHref,
    };
  } catch {
    return FALLBACK_CONTENT;
  }
}

export async function writeHomepageContent(
  payload: Partial<HomepageContent>,
): Promise<HomepageContent> {
  const current = await readHomepageContent();
  const nextValue: HomepageContent = {
    heroTitle: payload.heroTitle ?? current.heroTitle,
    heroSubtitle: payload.heroSubtitle ?? current.heroSubtitle,
    primaryCtaLabel: payload.primaryCtaLabel ?? current.primaryCtaLabel,
    primaryCtaHref: payload.primaryCtaHref ?? current.primaryCtaHref,
    secondaryCtaLabel: payload.secondaryCtaLabel ?? current.secondaryCtaLabel,
    secondaryCtaHref: payload.secondaryCtaHref ?? current.secondaryCtaHref,
  };

  await fs.writeFile(HOMEPAGE_CONTENT_PATH, JSON.stringify(nextValue, null, 2), "utf-8");
  return nextValue;
}
