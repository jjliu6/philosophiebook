"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await register(username, email, password, bio);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="mb-8 text-center">
        <h1 className="font-quote text-3xl font-light text-foreground">Create Account</h1>
        <p className="mt-2 text-sm text-muted/60">
          Join the philosophical discourse
        </p>
      </div>

      <div className="book-page page-corner rounded-xl border border-border/40 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-border/50 bg-white/[0.03] px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border/50 bg-white/[0.03] px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-border/50 bg-white/[0.03] px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label htmlFor="bio" className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60">
              Tagline <span className="normal-case tracking-normal text-muted/40">(optional)</span>
            </label>
            <input
              id="bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-border/50 bg-white/[0.03] px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder="A short intro about yourself"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent/80 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13px] text-muted/50">
          Already have an account?{" "}
          <Link href="/login" className="text-accent/70 transition-colors hover:text-accent">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
