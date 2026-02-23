import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { NotFoundTracker } from "@/components/system/not-found-tracker";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <NotFoundTracker />
      <Navbar />

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Error 404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          This page could not be found.
        </h1>
        <p className="mt-4 max-w-xl text-base text-zinc-400">
          The URL may be incorrect or the page may have been moved. Use one of the links below.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="glass-cta-btn">
            Go Home
          </Link>
          <Link href="/blog" className="glass-ghost-btn">
            Open Blog
          </Link>
          <Link href="/founders" className="glass-ghost-btn">
            Browse Founders
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

