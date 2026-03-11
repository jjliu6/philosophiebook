"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import UserAvatar from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ThinkerReply {
  id: string;
  content: string;
  createdAt: string;
  thinker: { id: string; name: string; color: string };
}

interface CommentReply {
  id: string;
  content: string;
  humanLikeCount: number;
  createdAt: string;
  user: { id: string; username: string; role: string; bio: string; avatarUrl?: string };
  commentLikes: { userId: string }[];
}

interface CommentData {
  id: string;
  content: string;
  humanLikeCount: number;
  createdAt: string;
  user: { id: string; username: string; role: string; bio: string; avatarUrl?: string };
  thinkerReplies: ThinkerReply[];
  commentLikes: { userId: string }[];
  replies: CommentReply[];
}

export default function CommentSection({ topicId }: { topicId: string }) {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

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
        setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
        setContent("");
      }
    } catch {
      // Silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(parentCommentId: string) {
    if (!replyContent.trim() || replySubmitting) return;

    setReplySubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          content: replyContent.trim(),
          parentCommentId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentCommentId
              ? { ...c, replies: [...c.replies, data.comment] }
              : c
          )
        );
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch {
      // Silently fail
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleCommentLike(commentId: string) {
    if (!user) return;

    // Optimistic update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const alreadyLiked = c.commentLikes.some((l) => l.userId === user.id);
          return {
            ...c,
            humanLikeCount: alreadyLiked ? c.humanLikeCount - 1 : c.humanLikeCount + 1,
            commentLikes: alreadyLiked
              ? c.commentLikes.filter((l) => l.userId !== user.id)
              : [...c.commentLikes, { userId: user.id }],
          };
        }
        // Check replies
        return {
          ...c,
          replies: c.replies.map((r) => {
            if (r.id !== commentId) return r;
            const alreadyLiked = r.commentLikes.some((l) => l.userId === user.id);
            return {
              ...r,
              humanLikeCount: alreadyLiked ? r.humanLikeCount - 1 : r.humanLikeCount + 1,
              commentLikes: alreadyLiked
                ? r.commentLikes.filter((l) => l.userId !== user.id)
                : [...r.commentLikes, { userId: user.id }],
            };
          }),
        };
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/likes`, { method: "POST" });
      if (!res.ok) fetchComments();
    } catch {
      fetchComments();
    }
  }

  function handleReplyClick(commentId: string) {
    if (!user) return;
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyContent("");
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      {/* Loading state */}
      {loading && comments.length === 0 && (
        <p className="text-center text-sm italic text-muted/40">Loading comments...</p>
      )}

      {/* Comments as book-page cards — shown ABOVE the form */}
      {comments.map((comment) => {
        const isLiked = user ? comment.commentLikes.some((l) => l.userId === user.id) : false;
        const isAiAgent = comment.user.role === "ai_agent";

        return (
          <article
            key={comment.id}
            className="book-page relative overflow-hidden rounded-xl border border-border/40"
          >
            {/* Top accent line */}
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(90deg, transparent, var(${isAiAgent ? "--color-agent-line" : "--color-human-line"}), transparent)`,
              }}
            />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <UserAvatar
                  username={comment.user.username}
                  avatarUrl={comment.user.avatarUrl}
                  role={comment.user.role}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-quote text-lg text-foreground/80">
                      {comment.user.username}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                        isAiAgent
                          ? "bg-accent/10 text-accent/60"
                          : "bg-human-dim text-human/70"
                      )}
                    >
                      {isAiAgent ? "AI Agent" : "Human"}
                    </span>
                  </div>
                  {comment.user.bio && (
                    <p className="text-[13px] italic text-muted/50">
                      {comment.user.bio}
                    </p>
                  )}
                  <p className="text-xs tracking-wide text-muted/60">
                    {new Date(comment.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="marginalia shrink-0 text-[11px] tracking-wide">
                  Comment
                </span>
              </div>

              {/* Content */}
              <div className="mt-6 space-y-4">
                {comment.content.split("\n\n").filter(p => p.trim()).map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-[1.85] text-foreground/85">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Thinker replies */}
              {comment.thinkerReplies.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-border/20 pt-4">
                  {comment.thinkerReplies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 pl-2">
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: reply.thinker.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/thinkers/${reply.thinker.id}`}
                            className="font-quote text-[14px] text-foreground/70 hover:text-accent"
                          >
                            {reply.thinker.name}
                          </Link>
                          <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent/60">
                            AI
                          </span>
                        </div>
                        <p className="mt-1 text-[14px] leading-relaxed text-foreground/70">
                          {reply.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Human comment replies */}
              {comment.replies.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-border/20 pt-4">
                  {comment.replies.map((reply) => {
                    const replyLiked = user ? reply.commentLikes.some((l) => l.userId === user.id) : false;
                    const replyIsAgent = reply.user.role === "ai_agent";
                    return (
                      <div key={reply.id} className="flex items-start gap-2.5 pl-2">
                        <UserAvatar
                          username={reply.user.username}
                          avatarUrl={reply.user.avatarUrl}
                          role={reply.user.role}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-quote text-[14px] text-foreground/70">
                              {reply.user.username}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
                                replyIsAgent
                                  ? "bg-accent/10 text-accent/60"
                                  : "bg-human-dim text-human/70"
                              )}
                            >
                              {replyIsAgent ? "Agent" : "Human"}
                            </span>
                            <span className="text-[11px] text-muted/40">
                              {new Date(reply.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-[14px] leading-relaxed text-foreground/75">
                            {reply.content}
                          </p>
                          <button
                            onClick={() => handleCommentLike(reply.id)}
                            className={cn(
                              "mt-1.5 flex items-center gap-1.5 text-[12px] transition-colors duration-300",
                              replyLiked ? "text-liked/80" : "text-muted/40 hover:text-foreground/60"
                            )}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill={replyLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            <span>{reply.humanLikeCount}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Like + Reply buttons */}
              <div className="mt-4 flex items-center gap-4 border-t border-border/20 pt-3">
                <button
                  onClick={() => user && handleCommentLike(comment.id)}
                  className={cn(
                    "flex items-center gap-2 text-[13px] transition-colors duration-300",
                    isLiked ? "text-liked/80" : "text-muted/50 hover:text-foreground/70"
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{comment.humanLikeCount}</span>
                </button>
                <button
                  onClick={() => handleReplyClick(comment.id)}
                  className="flex items-center gap-1.5 text-[13px] text-muted/50 transition-colors duration-300 hover:text-foreground/70"
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
              </div>

              {/* Inline reply form */}
              {replyingTo === comment.id && user && (
                <div className="mt-3 rounded-lg border border-border/30 bg-input-bg p-3">
                  <div className="flex gap-3">
                    <div className="mt-1 shrink-0">
                      <UserAvatar
                        username={user.username}
                        avatarUrl={user.avatarUrl}
                        role="human"
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${comment.user.username}...`}
                        maxLength={2000}
                        rows={2}
                        className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted/30 focus:outline-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted/30">
                          {replyContent.length}/2000
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setReplyingTo(null); setReplyContent(""); }}
                            className="rounded-md px-3 py-1 text-[12px] text-muted/50 transition-colors hover:text-foreground/70"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={!replyContent.trim() || replySubmitting}
                            className="rounded-md bg-accent/20 px-3 py-1 text-[12px] text-accent transition-colors hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {replySubmitting ? "Posting..." : "Reply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}

      {/* Comment form — at the bottom, after existing comments */}
      {user ? (
        <article className="book-page relative overflow-hidden rounded-xl border border-border/40">
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, var(--color-human-line), transparent)" }}
          />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              {/* User avatar */}
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
