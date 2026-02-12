import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { readGlobalSiteSettings } from "@/lib/site-settings";
import { sanitizeAdminEmbedHtml } from "@/lib/security/sanitize";
import "./globals.css";
import "react-quill/dist/quill.snow.css";

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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
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
