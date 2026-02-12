import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { requireAdminPage } from "@/lib/auth/admin-guard";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <div className="fixed inset-y-0 left-0 z-30">
        <AdminSidebar />
      </div>

      <div className="pl-[280px]">
        <AdminTopbar email={session.email} role={session.role} />
        <section className="p-6">
          <div className="min-h-[calc(100vh-110px)] rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-md">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
