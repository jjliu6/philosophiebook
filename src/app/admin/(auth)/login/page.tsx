"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "#0a0a0c" }}>
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <div className="mb-2 text-xs font-medium uppercase tracking-[0.25em] text-neutral-500">
            PhilosophieBook
          </div>
          <h1 className="text-2xl font-light text-neutral-200">
            Admin Console
          </h1>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-[11px] uppercase tracking-wider text-neutral-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-neutral-700/50 bg-neutral-800/50 px-4 py-2.5 text-[15px] text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 focus:border-neutral-500"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[11px] uppercase tracking-wider text-neutral-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-700/50 bg-neutral-800/50 px-4 py-2.5 text-[15px] text-neutral-200 outline-none transition-colors placeholder:text-neutral-600 focus:border-neutral-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-neutral-200 px-4 py-2.5 text-[14px] font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[12px] text-neutral-600">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
