import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter, JetBrains_Mono } from "next/font/google";
import { readGlobalSiteSettings } from "@/lib/site-settings";
import { sanitizeAdminEmbedHtml } from "@/lib/security/sanitize";
import "./globals.css";

const GlobalCommandPalette = dynamic(
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

export const metadata: Metadata = {
  title: "100Xfounder",
  description: "Premium startup founder directory",
};

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
