import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LoginRegisterForm } from "@/components/auth/login-register-form";
import { getSessionFromCookies } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSessionFromCookies();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-3 text-center text-3xl font-semibold tracking-tight text-white">
          Login to 100Xfounder Dashboard
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-zinc-400">
          Admins can connect aggregator APIs and sync data. Members can claim
          their founder profile.
        </p>

        <LoginRegisterForm />
      </section>
      <Footer />
    </main>
  );
}
