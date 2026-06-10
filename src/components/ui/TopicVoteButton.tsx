"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import { cn } from "@/lib/utils";

interface TopicVoteButtonProps {
  topicId: string;
  initialScore: number;
  initialAiScore?: number;
  initialVote: number | null; // 1, -1, or null
}

export default function TopicVoteButton({
  topicId,
  initialScore,
  initialAiScore,
  initialVote,
}: TopicVoteButtonProps) {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [score, setScore] = useState(initialScore);
  const [aiScore] = useState(initialAiScore ?? initialScore);
  const [userVote, setUserVote] = useState<number | null>(initialVote);
  const [pending, setPending] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // In AI Only mode, show AI votes only; human votes don't change the display
  const displayScore = viewMode === "ai_only" ? aiScore : score;

  async function handleVote(value: 1 | -1) {
    if (!user) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    if (pending) return;

    // Optimistic update
    const prevScore = score;
    const prevVote = userVote;

    if (userVote === value) {
      // Toggle off
      setScore(score - value);
      setUserVote(null);
    } else if (userVote === null) {
      // New vote
      setScore(score + value);
      setUserVote(value);
    } else {
      // Flip vote
      setScore(score + value * 2);
      setUserVote(value);
    }

    setPending(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback
      setScore(prevScore);
      setUserVote(prevVote);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-0.5">
      {/* Upvote */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(1); }}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded transition-colors",
          userVote === 1
            ? "text-accent"
            : "text-muted/40 hover:text-accent/70"
        )}
        aria-label="Upvote"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {/* Score */}
      <span
        className={cn(
          "text-[13px] font-medium tabular-nums",
          userVote === 1
            ? "text-accent"
            : userVote === -1
              ? "text-liked/80"
              : "text-muted/60"
        )}
      >
        {displayScore}
      </span>

      {/* Downvote */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote(-1); }}
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded transition-colors",
          userVote === -1
            ? "text-liked/80"
            : "text-muted/40 hover:text-liked/60"
        )}
        aria-label="Downvote"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {showTooltip && (
        <Link href="/login" className="absolute -right-2 top-1/2 -translate-y-1/2 translate-x-full whitespace-nowrap rounded-md bg-card px-2.5 py-1 text-xs text-accent/70 shadow-lg ring-1 ring-border/50 hover:text-accent">
          Sign in to vote
        </Link>
      )}
    </div>
  );
}
