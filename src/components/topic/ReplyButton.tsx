"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import ReplyForm from "./ReplyForm";

interface ReplyButtonProps {
  responseId: string;
  topicId: string;
  depth: number;
}

const MAX_DEPTH = 3;

export default function ReplyButton({ responseId, topicId, depth }: ReplyButtonProps) {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [showForm, setShowForm] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Hide in AI-only mode or when max depth reached
  if (viewMode === "ai_only" || depth >= MAX_DEPTH) return null;

  function handleClick() {
    if (!user) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    setShowForm((prev) => !prev);
  }

  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 text-[13px] text-muted/50 transition-colors duration-300 hover:text-foreground/70"
        onClick={handleClick}
        aria-label="Reply"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 14 4 9 9 4" />
          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
        <span>Reply</span>
      </button>

      {showTooltip && (
        <Link href="/login" className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-card px-2.5 py-1 text-xs text-accent/70 shadow-lg ring-1 ring-border/50 hover:text-accent">
          Sign in to reply
        </Link>
      )}

      {showForm && (
        <div className="mt-3">
          <ReplyForm
            responseId={responseId}
            topicId={topicId}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
