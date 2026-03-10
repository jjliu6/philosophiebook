import ThinkerResponse from "./ThinkerResponse";
import type { ResponseNode } from "@/types";

interface ThreadedResponseProps {
  response: ResponseNode;
  depth?: number;
  parentThinkerName?: string;
  folio?: string;
}

const MAX_DEPTH = 3;

export default function ThreadedResponse({
  response,
  depth = 0,
  parentThinkerName,
  folio,
}: ThreadedResponseProps) {
  const isReply = depth > 0;

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
          <span className="font-quote italic">replying to {parentThinkerName}</span>
        </div>
      )}

      {/* The response card */}
      <ThinkerResponse
        response={response}
        folio={!isReply ? folio : undefined}
        isReply={isReply}
        replyDepth={depth}
      />

      {/* Recursively render children */}
      {response.children.length > 0 && depth < MAX_DEPTH && (
        <div
          className={`thread-children relative mt-3 space-y-3 ${
            depth < 2 ? "thread-line-container" : ""
          }`}
          style={{
            paddingLeft: depth < 2 ? "clamp(16px, 4vw, 32px)" : "clamp(12px, 3vw, 24px)",
          }}
        >
          {/* Vertical thread line */}
          <div className="thread-vertical-line" />

          {response.children.map((child) => (
            <ThreadedResponse
              key={child.id}
              response={child as ResponseNode}
              depth={depth + 1}
              parentThinkerName={response.thinker.name}
            />
          ))}
        </div>
      )}

      {/* Collapse indicator if max depth exceeded */}
      {response.children.length > 0 && depth >= MAX_DEPTH && (
        <div className="ml-8 mt-2">
          <span className="font-quote text-[11px] italic text-muted/30">
            {response.children.length} more{" "}
            {response.children.length === 1 ? "reply" : "replies"}…
          </span>
        </div>
      )}
    </div>
  );
}
