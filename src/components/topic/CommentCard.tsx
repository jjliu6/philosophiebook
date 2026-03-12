"use client";

import { useState, useCallback } from "react";
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

export interface CommentData {
  id: string;
  content: string;
  humanLikeCount: number;
  createdAt: string;
  user: { id: string; username: string; role: string; bio: string; avatarUrl?: string };
  thinkerReplies: ThinkerReply[];
  commentLikes: { userId: string }[];
  replies: CommentReply[];
}

export default function CommentCard({ comment: initialComment, topicId }: { comment: CommentData; topicId: string }) {
  const { user } = useAuth();
  const { viewMode } = useViewMode();
  const [comment, setComment] = useState(initialComment);
  const [replyingTo, setReplyingTo] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Hide in AI-only mode
  if (viewMode === "ai_only") return null;

  const isLiked = user ? comment.commentLikes.some((l) => l.userId === user.id) : false;
  const isAiAgent = comment.user.role === "ai_agent";

  const refetchComment = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?topicId=${topicId}`);
      const data = await res.json();
      if (res.ok) {
        const updated = data.comments.find((c: CommentData) => c.id === comment.id);
        if (updated) setComment(updated);
      }
    } catch {
      // Silently fail
    }
  }, [topicId, comment.id]);

  async function handleCommentLike(commentId: string) {
    if (!user) return;

    // Optimistic update
    if (commentId === comment.id) {
      const alreadyLiked = comment.commentLikes.some((l) => l.userId === user.id);
      setComment((prev) => ({
        ...prev,
        humanLikeCount: alreadyLiked ? prev.humanLikeCount - 1 : prev.humanLikeCount + 1,
        commentLikes: alreadyLiked
          ? prev.commentLikes.filter((l) => l.userId !== user.id)
          : [...prev.commentLikes, { userId: user.id }],
      }));
    } else {
      // It's a reply like
      setComment((prev) => ({
        ...prev,
        replies: prev.replies.map((r) => {
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
      }));
    }

    try {
      const res = await fetch(`/api/comments/${commentId}/likes`, { method: "POST" });
      if (!res.ok) refetchComment();
    } catch {
      refetchComment();
    }
  }

  async function handleReplySubmit() {
    if (!replyContent.trim() || replySubmitting) return;

    setReplySubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId,
          content: replyContent.trim(),
          parentCommentId: comment.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setComment((prev) => ({
          ...prev,
          replies: [...prev.replies, data.comment],
        }));
        setReplyContent("");
        setReplyingTo(false);
      }
    } catch {
      // Silently fail
    } finally {
      setReplySubmitting(false);
    }
  }

  return (
    <article className="book-page relative overflow-hidden rounded-xl border border-border/40">
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
            onClick={() => {
              if (!user) return;
              setReplyingTo(!replyingTo);
              setReplyContent("");
            }}
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
        {replyingTo && user && (
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
                      onClick={() => { setReplyingTo(false); setReplyContent(""); }}
                      className="rounded-md px-3 py-1 text-[12px] text-muted/50 transition-colors hover:text-foreground/70"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReplySubmit}
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
}
