"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import UserAvatar from "@/components/ui/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CommentSection({ topicId }: { topicId: string }) {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // In AI-only mode, hide the comment form
  if (viewMode === "ai_only") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        // Refresh the page to show the new comment in the unified timeline
        router.refresh();
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      {user ? (
        <article className="book-page relative overflow-hidden rounded-xl border border-border/40">
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, var(--color-human-line), transparent)" }}
          />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <UserAvatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                role={user.role}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-quote text-[15px] text-foreground/80">
                    {user.username}
                  </span>
                  <span className="rounded-full bg-human-dim px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-human/70">
                    Human
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts on this debate..."
                  maxLength={2000}
                  rows={3}
                  className="mt-3 w-full resize-none rounded-lg border border-border/50 bg-input-bg px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/40"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted/30">{content.length}/2000</span>
                  <button
                    type="submit"
                    disabled={!content.trim() || submitting}
                    className="rounded-lg bg-accent/70 px-4 py-1.5 text-[13px] text-white transition-colors hover:bg-accent disabled:opacity-40"
                  >
                    {submitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </article>
      ) : (
        <article className="book-page relative overflow-hidden rounded-xl border border-border/40">
          <div className="px-6 py-8 text-center">
            <p className="text-[13px] text-muted/50">
              <Link href="/login" className="text-accent/60 hover:text-accent">
                Sign in
              </Link>{" "}
              to join the discussion
            </p>
          </div>
        </article>
      )}
    </div>
  );
}
