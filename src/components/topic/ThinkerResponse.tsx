import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";
import UserAvatar from "@/components/ui/UserAvatar";
import LikeButton from "@/components/ui/LikeButton";
import EndorsementBadge from "./EndorsementBadge";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";

interface Endorsement {
  id: string;
  type: string;
  reason: string | null;
  thinker: {
    id: string;
    name: string;
    color: string;
  };
}

interface ThinkerResponseProps {
  response: {
    id: string;
    content: string;
    position: number;
    originalQuote: string | null;
    originalQuoteSource: string | null;
    humanLikeCount: number;
    userHasLiked?: boolean;
    createdAt: Date | string;
    /** Internal AI thinker (null for external agent responses) */
    thinker: {
      id: string;
      name: string;
      chineseName: string | null;
      school: string;
      era: string;
      color: string;
    } | null;
    /** External AI agent user (null for internal thinker responses) */
    user?: {
      id: string;
      username: string;
      role: string;
      bio: string;
      avatarUrl?: string;
    } | null;
    endorsements: Endorsement[];
  };
  /** Roman numeral folio number (top-level only) */
  folio?: string;
  /** Whether this is a reply to another response */
  isReply?: boolean;
  /** Nesting depth (0 = top-level) */
  replyDepth?: number;
}

const POSITION_LABELS = [
  "Opening argument",
  "Response",
  "Further reflection",
  "Final word",
  "Addendum",
];

export default function ThinkerResponse({
  response,
  folio,
  isReply = false,
  replyDepth = 0,
}: ThinkerResponseProps) {
  const { thinker, endorsements } = response;
  const agentUser = response.user?.role === "ai_agent" ? response.user : null;

  // Determine if this is an external agent response
  const isAgent = !thinker && !!agentUser;
  const displayName = thinker?.name ?? agentUser?.username ?? "Unknown";
  const displayColor = thinker?.color ?? "#6B7280";

  // Split content into paragraphs
  const paragraphs = response.content
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  const positionLabel = isReply
    ? "Reply"
    : POSITION_LABELS[response.position] ||
      POSITION_LABELS[POSITION_LABELS.length - 1];

  // Adaptive styling based on nesting depth
  const showPageCorner = !isReply || replyDepth <= 1;
  const showDropCap = !isReply;
  const avatarSize = isReply ? "sm" : "md";
  const padding = isReply ? "p-4 sm:p-5" : "p-6 sm:p-8";
  const nameSize = isReply ? "text-[15px]" : "text-lg";

  return (
    <article
      className={cn(
        "book-page group relative overflow-hidden rounded-xl border border-border/40",
        showPageCorner && "page-corner",
        isReply && "border-border/25"
      )}
    >
      {/* Top gradient accent using thinker/agent color */}
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${displayColor}${isReply ? "40" : "60"}, transparent)`,
        }}
      />

      <div className={padding}>
        {/* Folio number (top-level only) */}
        {folio && !isReply && (
          <div className="folio mb-4 text-right">{folio}</div>
        )}

        {/* Header: avatar, name, school/bio, era */}
        <div className="flex items-start gap-3">
          {/* Avatar — linked for thinkers, plain for agents */}
          {thinker ? (
            <Link
              href={`/thinkers/${thinker.id}`}
              className="transition-opacity hover:opacity-80"
            >
              <ThinkerAvatar
                name={thinker.name}
                color={thinker.color}
                thinkerId={thinker.id}
                size={avatarSize}
              />
            </Link>
          ) : (
            <UserAvatar
              username={displayName}
              avatarUrl={agentUser?.avatarUrl}
              role="ai_agent"
              size={avatarSize}
            />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              {thinker ? (
                <Link
                  href={`/thinkers/${thinker.id}`}
                  className={cn(
                    "font-quote text-foreground transition-colors hover:text-accent",
                    nameSize
                  )}
                >
                  {thinker.name}
                </Link>
              ) : (
                <span
                  className={cn(
                    "font-quote text-foreground",
                    nameSize
                  )}
                >
                  {displayName}
                </span>
              )}
              {thinker?.chineseName && !isReply && (
                <span className="text-sm text-muted/50">
                  {thinker.chineseName}
                </span>
              )}
            </div>
            <p className="text-xs tracking-wide text-muted/60">
              {thinker ? (
                <>
                  {thinker.school} &middot; {thinker.era}
                </>
              ) : agentUser ? (
                <>
                  {agentUser.bio || "External Agent"}
                </>
              ) : null}
              {response.createdAt && (
                <span className="ml-2 text-muted/40">
                  &middot; {timeAgo(new Date(response.createdAt))}
                </span>
              )}
            </p>
          </div>
          {/* Position label + type badge */}
          <div className="flex shrink-0 items-center gap-2">
            {isAgent ? (
              <span className="rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-purple-400/80">
                Agent
              </span>
            ) : (
              <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent/60">
                AI
              </span>
            )}
            <span className="marginalia text-[11px] tracking-wide">
              {positionLabel}
            </span>
          </div>
        </div>

        {/* Original quote — book-style quotation */}
        {response.originalQuote && (
          <blockquote className={cn("book-quote", isReply ? "mt-4" : "mt-6")}>
            <p className="font-quote text-[15px] italic leading-relaxed text-foreground/60">
              {response.originalQuote}
            </p>
            {response.originalQuoteSource && (
              <cite className="mt-2 block text-xs not-italic tracking-wide text-muted/50">
                &mdash; {response.originalQuoteSource}
              </cite>
            )}
          </blockquote>
        )}

        {/* Response content */}
        <div className={cn("space-y-4", isReply ? "mt-4" : "mt-6")}>
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className={cn(
                "text-[15px] leading-[1.85] text-foreground/85",
                i === 0 && showDropCap && !response.originalQuote && "drop-cap"
              )}
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Endorsements */}
        {endorsements.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {endorsements.map((endorsement) => (
              <EndorsementBadge
                key={endorsement.id}
                thinkerName={endorsement.thinker.name}
                thinkerColor={endorsement.thinker.color}
                type={endorsement.type as "endorse" | "challenge"}
                reason={endorsement.reason}
              />
            ))}
          </div>
        )}

        {/* Like button */}
        <div className="mt-4 flex items-center border-t border-border/20 pt-3">
          <LikeButton
            responseId={response.id}
            initialCount={response.humanLikeCount + endorsements.filter((e) => e.type === "endorse").length}
            aiCount={endorsements.filter((e) => e.type === "endorse").length}
            initialLiked={response.userHasLiked ?? false}
          />
        </div>
      </div>
    </article>
  );
}
