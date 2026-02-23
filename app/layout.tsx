import type { Metadata } from "next";
import dynamicImport from "next/dynamic";
import { Inter, JetBrains_Mono } from "next/font/google";
import { readGlobalSiteSettings } from "@/lib/site-settings";
import { sanitizeAdminEmbedHtml } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import "./globals.css";

const GlobalCommandPalette = dynamicImport(
  () =>
    import("@/components/system/global-command-palette").then(
      (module) => module.GlobalCommandPalette,
    ),
  {
    ssr: false,
  },
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = getSiteBaseUrl();
  const settings = await readGlobalSiteSettings();
  const defaultTitle =
    settings.defaultMetaTitle?.trim() ||
    "100Xfounder | Founder Intelligence and Startup Newsroom";
  const defaultDescription =
    "100Xfounder tracks startup funding, founder profiles, hiring signals, and source-attributed newsroom coverage across India and the US.";
  const ogImageUrl = settings.defaultOgImageUrl?.trim() || undefined;
  const twitterHandle = settings.twitterHandle?.trim() || undefined;

  return {
    metadataBase: new URL(baseUrl),
    title: defaultTitle,
    description: defaultDescription,
    alternates: {
      canonical: `${baseUrl}/`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      url: baseUrl,
      siteName: "100Xfounder",
      title: defaultTitle,
      description: defaultDescription,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              alt: "100Xfounder",
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: defaultTitle,
      description: defaultDescription,
      creator: twitterHandle,
      site: twitterHandle,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await readGlobalSiteSettings();
  const safeHeadCode = siteSettings.headCode
    ? sanitizeAdminEmbedHtml(siteSettings.headCode)
    : "";
  const safeBodyCode = siteSettings.bodyCode
    ? sanitizeAdminEmbedHtml(siteSettings.bodyCode)
    : "";

  return (
    <html lang="en" suppressHydrationWarning>
      {safeHeadCode ? (
        <head dangerouslySetInnerHTML={{ __html: safeHeadCode }} />
      ) : null}
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        {children}
        <GlobalCommandPalette />
        {safeBodyCode ? (
          <div
            id="admin-body-code"
            dangerouslySetInnerHTML={{ __html: safeBodyCode }}
          />
        ) : null}
      </body>
    </html>
  );
}
