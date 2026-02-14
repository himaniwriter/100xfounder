"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "register";

export function LoginRegisterForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email, password }
            : { name, email, password },
        ),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? "Authentication failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
      <div className="mb-5 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            mode === "login"
              ? "bg-[#6366f1] text-white"
              : "border border-white/10 text-zinc-300"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-md px-3 py-1.5 transition-colors ${
            mode === "register"
              ? "bg-[#6366f1] text-white"
              : "border border-white/10 text-zinc-300"
          }`}
        >
          Register
        </button>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "register" ? (
          <div>
            <label className="mb-1 block text-xs text-zinc-300">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#6366f1]/60"
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs text-zinc-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#6366f1]/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#6366f1]/60"
          />
        </div>

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#6366f1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5558ea] disabled:opacity-70"
        >
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
