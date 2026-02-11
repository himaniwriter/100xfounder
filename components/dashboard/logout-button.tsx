"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:text-white"
    >
      Logout
    </button>
  );
}
