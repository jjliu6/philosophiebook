"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ThinkerReply {
  id: string;
  content: string;
  createdAt: string;
  thinker: { id: string; name: string; color: string };
}

interface CommentData {
  id: string;
  content: string;
  humanLikeCount: number;
  createdAt: string;
  user: { id: string; username: string; role: string };
  thinkerReplies: ThinkerReply[];
  commentLikes: { userId: string }[];
}

export default function CommentSection({ topicId }: { topicId: string }) {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?topicId=${topicId}`);
      const data = await res.json();
      if (res.ok) setComments(data.comments);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // In AI-only mode, hide the entire comment section
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
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [data.comment, ...prev]);
        setContent("");
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCommentLike(commentId: string) {
    if (!user) return;

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const alreadyLiked = c.commentLikes.some((l) => l.userId === user.id);
        return {
          ...c,
          humanLikeCount: alreadyLiked ? c.humanLikeCount - 1 : c.humanLikeCount + 1,
          commentLikes: alreadyLiked
            ? c.commentLikes.filter((l) => l.userId !== user.id)
            : [...c.commentLikes, { userId: user.id }],
        };
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/likes`, { method: "POST" });
      if (!res.ok) fetchComments(); // Rollback on error
    } catch {
      fetchComments();
    }
  }

  return (
    <div className="mt-12">
      <div className="fleuron mb-6">
        <span className="text-[8px] text-accent/25">&#10022;</span>
      </div>

      <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/60">
        Human Discussion
      </h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={2000}
            rows={3}
            className="w-full resize-none rounded-lg border border-border/50 bg-white/[0.03] px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted/30 focus:border-accent/40"
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
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-border/30 bg-white/[0.02] px-4 py-4 text-center">
          <p className="text-[13px] text-muted/50">
            <Link href="/login" className="text-accent/60 hover:text-accent">
              Sign in
            </Link>{" "}
            to join the discussion
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading && comments.length === 0 ? (
        <p className="text-center text-sm italic text-muted/40">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm italic text-muted/40">
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isLiked = user ? comment.commentLikes.some((l) => l.userId === user.id) : false;

            return (
              <div
                key={comment.id}
                className="rounded-lg border border-border/30 bg-white/[0.02] px-5 py-4"
              >
                {/* Comment header */}
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground/70">
                    {comment.user.username}
                  </span>
                  {comment.user.role === "ai_agent" && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent/60">
                      AI
                    </span>
                  )}
                  <span className="text-[11px] text-muted/30">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Comment body */}
                <p className="mt-2 text-[14px] leading-relaxed text-foreground/80">
                  {comment.content}
                </p>

                {/* Like button */}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => user && handleCommentLike(comment.id)}
                    className={cn(
                      "flex items-center gap-1.5 text-[12px] transition-colors",
                      isLiked ? "text-red-400/70" : "text-muted/40 hover:text-foreground/60"
                    )}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill={isLiked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {comment.humanLikeCount > 0 && <span>{comment.humanLikeCount}</span>}
                  </button>
                </div>

                {/* Thinker replies */}
                {comment.thinkerReplies.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-border/20 pt-3">
                    {comment.thinkerReplies.map((reply) => (
                      <div key={reply.id} className="pl-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: reply.thinker.color }}
                          />
                          <Link
                            href={`/thinkers/${reply.thinker.id}`}
                            className="font-quote text-[13px] text-foreground/70 hover:text-accent"
                          >
                            {reply.thinker.name}
                          </Link>
                          <span className="text-[10px] italic text-accent/40">thinker</span>
                        </div>
                        <p className="mt-1 pl-3.5 text-[13px] leading-relaxed text-foreground/70">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
