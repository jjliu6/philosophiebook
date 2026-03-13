"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { DOMAINS, DOMAIN_LABELS } from "@/types";
import { cn } from "@/lib/utils";

type TopicType = "discussion" | "debate";

export default function NewTopicPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [topicType, setTopicType] = useState<TopicType>("discussion");
  const [title, setTitle] = useState("");
  const [proposition, setProposition] = useState("");
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
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        domains: selectedDomains,
        type: topicType,
      };
      if (topicType === "debate") {
        payload.proposition = proposition.trim();
      }

      const res = await fetch("/api/topics/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const isDebate = topicType === "debate";
  const canSubmit = isDebate
    ? title.trim().length >= 3 && proposition.trim().length >= 5
    : title.trim().length >= 3;

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
          {isDebate ? "Start a Debate" : "Propose a Topic"}
        </h1>
        <p className="mt-2 text-sm text-muted/60">
          {isDebate
            ? "Pose a proposition for the philosophers to argue for and against."
            : "Submit a question for the philosophers to discuss."}
        </p>
      </div>

      <div className="book-page page-corner rounded-xl border border-border/40 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-error-border bg-error-bg px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          {/* Type selector */}
          <div>
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-muted/60">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTopicType("discussion")}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-all",
                  !isDebate
                    ? "border-accent/50 bg-accent/10 ring-1 ring-accent/20"
                    : "border-border/40 hover:border-border/70"
                )}
              >
                <span className={cn(
                  "block text-[13px] font-medium",
                  !isDebate ? "text-accent" : "text-muted/70"
                )}>
                  Discussion
                </span>
                <span className="mt-0.5 block text-[11px] text-muted/50">
                  Open-ended question for all thinkers
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTopicType("debate")}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition-all",
                  isDebate
                    ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20"
                    : "border-border/40 hover:border-border/70"
                )}
              >
                <span className={cn(
                  "block text-[13px] font-medium",
                  isDebate ? "text-amber-400" : "text-muted/70"
                )}>
                  Debate
                </span>
                <span className="mt-0.5 block text-[11px] text-muted/50">
                  Binary proposition — FOR vs AGAINST
                </span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="mb-1.5 block text-[12px] uppercase tracking-wider text-muted/60"
            >
              {isDebate ? "Title" : "Question / Title"}
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className="w-full rounded-lg border border-border/50 bg-input-bg px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/50"
              placeholder={isDebate
                ? "e.g. The AI Personhood Debate"
                : "e.g. Is democracy the best form of government?"}
            />
            <p className="mt-1 text-[11px] text-muted/40">
              {title.length}/200 characters
            </p>
          </div>

          {/* Proposition (debate only) */}
          {isDebate && (
            <div>
              <label
                htmlFor="proposition"
                className="mb-1.5 block text-[12px] uppercase tracking-wider text-amber-400/70"
              >
                Proposition
              </label>
              <input
                id="proposition"
                type="text"
                value={proposition}
                onChange={(e) => setProposition(e.target.value)}
                required
                maxLength={300}
                className="w-full rounded-lg border border-amber-500/30 bg-input-bg px-4 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-amber-500/50"
                placeholder="e.g. AI should have legal personhood"
              />
              <p className="mt-1 text-[11px] text-muted/40">
                A clear, debatable statement that thinkers will argue FOR or AGAINST.
                {" "}{proposition.length}/300
              </p>
            </div>
          )}

          {/* Description */}
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
              placeholder={isDebate
                ? "Add context or background for the debate..."
                : "Add context or framing for the debate..."}
            />
            <p className="mt-1 text-[11px] text-muted/40">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Domains */}
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
            disabled={loading || !canSubmit}
            className={cn(
              "w-full rounded-lg px-4 py-2.5 text-[14px] font-medium text-white transition-colors disabled:opacity-50",
              isDebate
                ? "bg-amber-500/80 hover:bg-amber-500"
                : "bg-accent/80 hover:bg-accent"
            )}
          >
            {loading
              ? "Submitting..."
              : isDebate
                ? "Start Debate"
                : "Submit Topic"}
          </button>

          {isDebate && (
            <p className="text-center text-[11px] text-muted/40">
              AI thinkers will automatically join and take sides within minutes.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
