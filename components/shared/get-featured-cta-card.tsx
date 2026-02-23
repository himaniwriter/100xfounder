import Link from "next/link";
import { buildWhatsAppRedirectPath } from "@/lib/marketing/outreach";

type GetFeaturedCtaCardProps = {
  context: "founder_profile" | "company_profile" | "blog_post";
  title?: string;
  description?: string;
  plan?: string;
};

export function GetFeaturedCtaCard({
  context,
  title = "Want to get featured on 100Xfounder?",
  description = "Get a verified founder/company profile with funding and hiring context in one place.",
  plan,
}: GetFeaturedCtaCardProps) {
  const whatsappHref = buildWhatsAppRedirectPath({
    context,
    source: "content_page",
    plan,
  });

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-300">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={whatsappHref}
          className="inline-flex items-center rounded-md border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 transition-colors hover:bg-emerald-500/20"
        >
          Contact on WhatsApp
        </a>
        <Link
          href="/get-featured"
          className="inline-flex items-center rounded-md border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
        >
          Open Get Featured
        </Link>
      </div>
    </section>
  );
}
