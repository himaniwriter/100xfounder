import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import type { NewsroomPageContent } from "@/lib/news/trust-pages";

type NewsroomStaticPageProps = {
  content: NewsroomPageContent;
};

export function NewsroomStaticPage({ content }: NewsroomStaticPageProps) {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">100Xfounder Newsroom</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-3 text-sm text-zinc-400">{content.description}</p>

        <div className="mt-8 space-y-4">
          {content.sections.map((section) => (
            <section key={section.heading} className="rounded-xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-md">
              <h2 className="text-lg font-semibold text-white">{section.heading}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-300">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/15 bg-black/30 p-4">
          <p className="text-sm text-zinc-300">
            Need to report an issue? Visit{" "}
            <Link href="/contact-newsroom" className="text-indigo-300 hover:text-indigo-200">
              Contact Newsroom
            </Link>
            .
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
