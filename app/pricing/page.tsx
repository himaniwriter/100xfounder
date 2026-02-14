import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PricingClient } from "./pricing-client";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <PricingClient />
      <Footer />
    </main>
  );
}

