import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
  return (
    <section className="rounded-[14px] border border-indigo-400/20 bg-gradient-to-b from-indigo-500/8 to-transparent p-5">
      <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="mailto:media@100xfounder.com"
          className="glass-ghost-btn glass-ghost-btn-compact border-emerald-400/25 text-emerald-200 hover:border-emerald-400/40 hover:bg-emerald-500/10"
        >
          Contact Editorial
        </a>
        <Link
          href="/get-featured"
          className="glass-ghost-btn glass-ghost-btn-compact border-indigo-400/25 text-indigo-200 hover:border-indigo-400/40 hover:bg-indigo-500/10"
        >
          Get Featured
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}
