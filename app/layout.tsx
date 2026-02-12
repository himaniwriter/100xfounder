import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { readGlobalSiteSettings } from "@/lib/site-settings";
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

  return (
    <html lang="en" suppressHydrationWarning>
      {siteSettings.headCode ? (
        <head>
          <script
            id="admin-head-code"
            dangerouslySetInnerHTML={{ __html: siteSettings.headCode }}
          />
        </head>
      ) : null}
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
        {siteSettings.bodyCode ? (
          <div
            id="admin-body-code"
            dangerouslySetInnerHTML={{ __html: siteSettings.bodyCode }}
          />
        ) : null}
      </body>
    </html>
  );
}
