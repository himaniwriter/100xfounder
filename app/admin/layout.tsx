import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { requireAdminPage } from "@/lib/auth/admin-guard";
import "react-quill/dist/quill.snow.css";
import "./admin.css";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminPage();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <div className="fixed inset-y-0 left-0 z-30">
        <AdminSidebar />
      </div>

      <div className="pl-[260px] flex flex-col min-h-screen">
        <AdminTopbar email={session.email} role={session.role} />
        <section className="flex-1 p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
