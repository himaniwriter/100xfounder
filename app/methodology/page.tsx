import type { Metadata } from "next";
import { NewsroomStaticPage } from "@/components/news/newsroom-static-page";
import { NEWSROOM_TRUST_PAGES } from "@/lib/news/trust-pages";

const content = NEWSROOM_TRUST_PAGES.methodology;

export const metadata: Metadata = {
  title: `${content.title} | 100Xfounder Newsroom`,
  description: content.description,
};

export default function MethodologyPage() {
  return <NewsroomStaticPage content={content} />;
}
