"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DebateVoteButtonsProps {
  topicId: string;
  initialSide: "for" | "against" | null;
}

export default function DebateVoteButtons({
  topicId,
  initialSide,
}: DebateVoteButtonsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentSide, setCurrentSide] = useState<"for" | "against" | null>(initialSide);
  const [pending, setPending] = useState(false);
  const [showArgueForm, setShowArgueForm] = useState(false);
  const [argueContent, setArgueContent] = useState("");
  const [argueSubmitting, setArgueSubmitting] = useState(false);

  async function handleVote(side: "for" | "against") {
    if (!user || pending) return;

    const prevSide = currentSide;
    // Optimistic
    setCurrentSide(currentSide === side ? null : side);

    setPending(true);
    try {
      const res = await fetch("/api/debates/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, side }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCurrentSide(data.vote);

      // Show argue form after voting (not on un-vote)
      if (data.vote && !data.removed) {
        setShowArgueForm(true);
      } else {
        setShowArgueForm(false);
      }

      router.refresh();
    } catch {
      setCurrentSide(prevSide);
    } finally {
      setPending(false);
    }
  }

  async function handleArgueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!argueContent.trim() || argueSubmitting || !currentSide) return;

    setArgueSubmitting(true);
    try {
      const res = await fetch("/api/responses/debate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          content: argueContent.trim(),
          debateSide: currentSide,
        }),
      });
      if (res.ok) {
        setArgueContent("");
        setShowArgueForm(false);
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setArgueSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-border/40 bg-card/30 px-6 py-8 text-center">
        <p className="text-[13px] text-muted/50">
          <Link href="/login" className="text-accent/60 hover:text-accent">
            Sign in
          </Link>{" "}
          to cast your vote
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-5">
      <p className="mb-4 text-center font-quote text-[14px] text-muted/60">
        {currentSide ? "Your position" : "Cast your vote"}
      </p>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => handleVote("for")}
          disabled={pending}
          className={cn(
            "flex-1 rounded-lg px-6 py-3 text-[14px] font-medium uppercase tracking-wider transition-all",
            currentSide === "for"
              ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
              : "bg-card text-muted/60 ring-1 ring-border/30 hover:bg-emerald-500/10 hover:text-emerald-400/80"
          )}
        >
          For
        </button>
        <button
          onClick={() => handleVote("against")}
          disabled={pending}
          className={cn(
            "flex-1 rounded-lg px-6 py-3 text-[14px] font-medium uppercase tracking-wider transition-all",
            currentSide === "against"
              ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
              : "bg-card text-muted/60 ring-1 ring-border/30 hover:bg-rose-500/10 hover:text-rose-400/80"
          )}
        >
          Against
        </button>
      </div>

      {/* Optional argue form after voting */}
      {showArgueForm && currentSide && (
        <form onSubmit={handleArgueSubmit} className="mt-4">
          <p className="mb-2 text-[12px] text-muted/40">
            Want to make your case? (optional)
          </p>
          <div className="flex items-start gap-3">
            <UserAvatar
              username={user.username}
              avatarUrl={user.avatarUrl}
              role={user.role}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <textarea
                value={argueContent}
                onChange={(e) => setArgueContent(e.target.value)}
                placeholder={`Argue ${currentSide === "for" ? "for" : "against"} the proposition...`}
                maxLength={2000}
                rows={3}
                className="w-full resize-none rounded-lg border border-border/50 bg-input-bg px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/40"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-muted/30">
                  {argueContent.length}/2000
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowArgueForm(false); setArgueContent(""); }}
                    className="rounded-md px-3 py-1.5 text-[12px] text-muted/50 transition-colors hover:text-foreground/70"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    disabled={!argueContent.trim() || argueSubmitting}
                    className={cn(
                      "rounded-lg px-4 py-1.5 text-[13px] text-white transition-colors disabled:opacity-40",
                      currentSide === "for"
                        ? "bg-emerald-500/70 hover:bg-emerald-500"
                        : "bg-rose-500/70 hover:bg-rose-500"
                    )}
                  >
                    {argueSubmitting ? "Posting..." : "Post Argument"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
