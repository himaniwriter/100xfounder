import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Feature Now | 100Xfounder",
  description: "Get featured on 100Xfounder with a verified founder profile and editorial review.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/get-featured`,
  },
};

export default function FeatureNowPage() {
  redirect("/get-featured?source=feature_now");
}
