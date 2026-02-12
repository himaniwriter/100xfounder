import type { ProfileFaq } from "@/lib/seo/profile-seo";

type ProfileFaqSectionProps = {
  title: string;
  faqs: ProfileFaq[];
};

export function ProfileFaqSection({ title, faqs }: ProfileFaqSectionProps) {
  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
      <h2 className="text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Common questions people ask about this profile.
      </p>

      <div className="mt-5 space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={faq.question}
            open={index === 0}
            className="group rounded-xl border border-white/12 bg-black/30 px-4 py-3"
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-zinc-100">
              {faq.question}
            </summary>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

