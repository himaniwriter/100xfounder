import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { StartupsClient } from "./startups-client";

export default function StartupsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupsClient />
      <Footer />
    </main>
  );
}

