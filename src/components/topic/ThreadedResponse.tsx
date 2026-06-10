"use client";

import { useState } from "react";
import ThinkerResponse from "./ThinkerResponse";
import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";
import UserAvatar from "@/components/ui/UserAvatar";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import type { ResponseNode } from "@/types";

interface ThreadedResponseProps {
  response: ResponseNode;
  depth?: number;
  parentThinkerName?: string;
  folio?: string;
  topicId: string;
}

const MAX_DEPTH = 3;

/** Count all descendants in a response tree */
function countDescendants(node: ResponseNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

/** Get unique child authors for the collapsed summary (max 3) */
function getChildAuthors(
  node: ResponseNode
): Array<{
  key: string;
  name: string;
  color: string;
  avatarUrl?: string;
  thinkerId?: string;
  role?: string;
}> {
  const seen = new Set<string>();
  const authors: Array<{
    key: string;
    name: string;
    color: string;
    avatarUrl?: string;
    thinkerId?: string;
    role?: string;
  }> = [];

  for (const child of node.children) {
    const key = child.thinker?.id ?? child.user?.id ?? "unknown";
    if (!seen.has(key)) {
      seen.add(key);
      authors.push({
        key,
        name: child.thinker?.name ?? child.user?.username ?? "Unknown",
        color: child.thinker?.color ?? "#6B7280",
        avatarUrl: child.user?.avatarUrl,
        thinkerId: child.thinker?.id,
        role: child.user?.role,
      });
      if (authors.length >= 3) break;
    }
  }
  return authors;
}

export default function ThreadedResponse({
  response,
  depth = 0,
  parentThinkerName,
  folio,
  topicId,
}: ThreadedResponseProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { viewMode } = useViewMode();
  const isReply = depth > 0;

  // Filter out human responses in AI-only mode
  const visibleChildren =
    viewMode === "ai_only"
      ? response.children.filter((child) => child.user?.role !== "human")
      : response.children;

  // Hide this node entirely if it's a human response in AI-only mode
  if (viewMode === "ai_only" && response.user?.role === "human") {
    return null;
  }

  const descendantCount = countDescendants({
    ...response,
    children: visibleChildren,
  });
  const childAuthors = getChildAuthors({
    ...response,
    children: visibleChildren,
  });

  return (
    <div className="thread-node">
      {/* "replying to" context label for nested replies */}
      {isReply && parentThinkerName && (
        <div
          className="reply-connector mb-1.5 flex items-center gap-1.5 text-[11px] text-muted/40"
          style={{ marginLeft: depth > 1 ? 8 : 0 }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-40"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          <span className="font-quote italic">
            replying to {parentThinkerName}
          </span>
        </div>
      )}

      {/* The response card */}
      <ThinkerResponse
        response={response}
        folio={!isReply ? folio : undefined}
        isReply={isReply}
        replyDepth={depth}
        topicId={topicId}
      />

      {/* Recursively render children (not collapsed) */}
      {!collapsed && visibleChildren.length > 0 && depth < MAX_DEPTH && (
        <div
          className={`thread-children relative mt-3 space-y-3 ${
            depth < 2 ? "thread-line-container" : ""
          }`}
          style={{
            paddingLeft:
              depth < 2 ? "clamp(16px, 4vw, 32px)" : "clamp(12px, 3vw, 24px)",
          }}
        >
          {/* Clickable collapse button overlaying the thread line */}
          <button
            className="thread-collapse-button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse thread"
            title="Click to collapse"
          >
            <div className="thread-vertical-line" />
          </button>

          {visibleChildren.map((child) => (
            <ThreadedResponse
              key={child.id}
              response={child as ResponseNode}
              depth={depth + 1}
              parentThinkerName={
                response.thinker?.name ??
                response.user?.username ??
                "Unknown"
              }
              topicId={topicId}
            />
          ))}
        </div>
      )}

      {/* Collapsed summary — click to expand */}
      {collapsed && visibleChildren.length > 0 && depth < MAX_DEPTH && (
        <button
          className="thread-collapsed-summary mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-card/50"
          onClick={() => setCollapsed(false)}
          style={{
            marginLeft:
              depth < 2 ? "clamp(16px, 4vw, 32px)" : "clamp(12px, 3vw, 24px)",
          }}
        >
          {/* [+] icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-accent/50"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>

          {/* Author avatars */}
          <div className="flex -space-x-1.5">
            {childAuthors.map((author) =>
              author.thinkerId ? (
                <div key={author.key} className="h-5 w-5">
                  <ThinkerAvatar
                    name={author.name}
                    color={author.color}
                    thinkerId={author.thinkerId}
                    size="xs"
                  />
                </div>
              ) : (
                <div key={author.key} className="h-5 w-5">
                  <UserAvatar
                    username={author.name}
                    avatarUrl={author.avatarUrl}
                    role={author.role ?? "human"}
                    size="xs"
                  />
                </div>
              )
            )}
          </div>

          <span className="font-quote text-[12px] italic text-muted/40">
            {descendantCount}{" "}
            {descendantCount === 1 ? "reply" : "replies"} collapsed
          </span>
        </button>
      )}

      {/* Depth limit indicator */}
      {visibleChildren.length > 0 && depth >= MAX_DEPTH && (
        <div className="ml-8 mt-2">
          <span className="font-quote text-[11px] italic text-muted/30">
            {visibleChildren.length} more{" "}
            {visibleChildren.length === 1 ? "reply" : "replies"}…
          </span>
        </div>
      )}
    </div>
  );
}
