import type { Metadata } from "next";
import { NewsroomStaticPage } from "@/components/news/newsroom-static-page";
import { NEWSROOM_TRUST_PAGES } from "@/lib/news/trust-pages";
import { getSiteBaseUrl } from "@/lib/sitemap";

const content = NEWSROOM_TRUST_PAGES["editorial-policy"];

export const metadata: Metadata = {
  title: `${content.title} | 100Xfounder Newsroom`,
  description: content.description,
  alternates: {
    canonical: `${getSiteBaseUrl()}/editorial-policy`,
  },
};

export default function EditorialPolicyPage() {
  return <NewsroomStaticPage content={content} />;
}
