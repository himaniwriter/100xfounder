import type { Metadata } from "next";
import { Suspense } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { InterviewQuestionnaireForm } from "@/components/outreach/interview-questionnaire-form";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const metadata: Metadata = {
  title: "Founder Interview Questionnaire | 100Xfounder",
  description:
    "Approved founders can submit structured interview responses for publication in the 100Xfounder newsroom.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/interview-questionnaire`,
  },
};

export default function InterviewQuestionnairePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Editorial Intake</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Founder Interview Questionnaire
          </h1>
          <p className="mt-3 text-sm text-zinc-300 sm:text-base">
            This form is for approved founders submitting interview responses for their newsroom
            feature. Please answer each section with specific details and examples.
          </p>
          <p className="mt-3 rounded-md border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200">
            Submission status after upload: Received, editorial review in progress.
          </p>
        </header>

        <Suspense
          fallback={
            <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
              <div className="h-[520px] animate-pulse rounded-xl border border-white/10 bg-black/30" />
            </section>
          }
        >
          <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-md">
            <InterviewQuestionnaireForm />
          </section>
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}
