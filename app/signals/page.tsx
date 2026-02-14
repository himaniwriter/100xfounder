import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SignalsClient } from "./signals-client";

export default function SignalsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <SignalsClient />
      <Footer />
    </main>
  );
}

