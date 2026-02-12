import type { MetadataRoute } from "next";
import { getXmlSitemapEntries } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getXmlSitemapEntries();
}
