"use client";

import { useState } from "react";

interface LikeButtonProps {
  count: number;
}

export default function LikeButton({ count }: LikeButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        className="group/like flex items-center gap-2 text-[13px] text-muted/50 transition-colors duration-300 hover:text-foreground/70"
        onClick={() => {
          setShowTooltip(true);
          setTimeout(() => setShowTooltip(false), 2000);
        }}
        aria-label="Like"
      >
        {/* SVG Heart icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-colors duration-300 group-hover/like:stroke-red-400/70"
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
