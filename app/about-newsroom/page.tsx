import type { Metadata } from "next";
import { NewsroomStaticPage } from "@/components/news/newsroom-static-page";
import { NEWSROOM_TRUST_PAGES } from "@/lib/news/trust-pages";
import { getSiteBaseUrl } from "@/lib/sitemap";

const content = NEWSROOM_TRUST_PAGES["about-newsroom"];

export const metadata: Metadata = {
  title: `${content.title} | 100Xfounder`,
  description: content.description,
  alternates: {
    canonical: `${getSiteBaseUrl()}/about-newsroom`,
  },
};

export default function AboutNewsroomPage() {
  return <NewsroomStaticPage content={content} />;
}
