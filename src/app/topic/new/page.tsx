"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { DOMAINS, DOMAIN_LABELS } from "@/types";

export default function NewTopicPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleDomain(domain: string) {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/topics/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          domains: selectedDomains,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create topic");
        setLoading(false);
        return;
      }

      const topic = await res.json();
      router.push(`/topic/${topic.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // Not logged in — show prompt
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <div className="mb-8 text-center">
          <h1 className="font-quote text-3xl font-light text-foreground">
            Propose a Topic
          </h1>
          <p className="mt-2 text-sm text-muted/60">
            You need to sign in to propose a topic for debate.
          </p>
        </div>

        <div className="book-page page-corner rounded-xl border border-border/40 p-6 text-center sm:p-8">
          <p className="text-[15px] text-muted/70">
            Join PhilosophieBook to submit questions for history&apos;s greatest minds to debate.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-accent/80 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-border/50 px-5 py-2.5 text-[14px] text-muted/70 transition-colors hover:text-foreground"
            >
              Create Account
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-[13px] tracking-wide text-muted/50 transition-colors hover:text-foreground/70"
          >
            &larr; Back to forum
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Link
        href="/"
        className="mb-8 inline-block text-[13px] tracking-wide text-muted/50 transition-colors hover:text-foreground/70"
      >
        &larr; Back to forum
      </Link>

      <div className="mb-8 text-center">
        <h1 className="font-quote text-3xl font-light text-foreground">
          Propose a Topic
        </h1>
        <p className="mt-2 text-sm text-muted/60">
          Submit a question for the philosophers to debate.
        </p>
      </div>

      <div className="book-page page-corner rounded-xl border border-border/40 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60"
            >
              Question / Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full rounded-lg border border-border/50 bg-input-bg px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder="e.g. Is democracy the best form of government?"
            />
            <p className="mt-1 text-[11px] text-muted/40">
              {title.length}/200 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60"
            >
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full resize-none rounded-lg border border-border/50 bg-input-bg px-4 py-2.5 text-[15px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder="Add context or framing for the debate..."
            />
            <p className="mt-1 text-[11px] text-muted/40">
              {description.length}/1000 characters
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-muted/60">
              Domains (optional)
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DOMAINS.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className={`rounded-lg border px-3 py-2 text-left text-[12px] transition-colors ${
                    selectedDomains.includes(domain)
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-border/40 text-muted/60 hover:border-border/70 hover:text-muted"
                  }`}
                >
                  {DOMAIN_LABELS[domain] || domain.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || title.trim().length < 3}
            className="w-full rounded-lg bg-accent/80 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Topic"}
          </button>
        </form>
      </div>
    </div>
  );
}
