"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import UserAvatar from "@/components/ui/UserAvatar";

interface ReplyFormProps {
  responseId: string;
  topicId: string;
  onClose: () => void;
}

const MAX_LENGTH = 2000;

export default function ReplyForm({ responseId, onClose }: ReplyFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea to fit its content (up to a max), so long replies
  // are easy to read and edit instead of scrolling a tiny box.
  function autoGrowTextarea(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/responses/${responseId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to post reply");
        return;
      }

      setContent("");
      onClose();
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border/30 bg-input-bg p-3"
    >
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
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoGrowTextarea(e.target);
            }}
            placeholder="Write your reply..."
            maxLength={MAX_LENGTH}
            rows={3}
            className="max-h-[240px] w-full resize-none overflow-y-auto bg-transparent text-[14px] leading-relaxed text-foreground placeholder:text-muted/30 focus:outline-none"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {error && (
                <span className="text-[12px] text-error">{error}</span>
              )}
              <span className="text-[11px] text-muted/30">
                {content.length}/{MAX_LENGTH}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1 text-[12px] text-muted/50 transition-colors hover:text-foreground/70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="rounded-md bg-accent/20 px-3 py-1 text-[12px] text-accent transition-colors hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Posting…" : "Reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
