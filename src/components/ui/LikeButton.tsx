"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  responseId: string;
  initialCount: number;
  initialLiked: boolean;
}

export default function LikeButton({ responseId, initialCount, initialLiked }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (!user) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    if (pending) return;

    // Optimistic update
    const wasLiked = liked;
    const prevCount = count;
    setLiked(!wasLiked);
    setCount(wasLiked ? prevCount - 1 : prevCount + 1);
    setPending(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responseId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback on failure
      setLiked(wasLiked);
      setCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <button
        className={cn(
          "group/like flex items-center gap-2 text-[13px] transition-colors duration-300",
          liked
            ? "text-red-400/80"
            : "text-muted/50 hover:text-foreground/70"
        )}
        onClick={handleClick}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "transition-colors duration-300",
            !liked && "group-hover/like:stroke-red-400/70"
          )}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span>{count}</span>
      </button>

      {showTooltip && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2.5 py-1 text-xs text-foreground/70 shadow-lg ring-1 ring-border/50">
          Sign in to like
        </span>
      )}
    </div>
  );
}
