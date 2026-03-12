"use client";

import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";
import UserAvatar from "@/components/ui/UserAvatar";
import LikeButton from "@/components/ui/LikeButton";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";

interface DebateArgumentProps {
  response: {
    id: string;
    content: string;
    debateSide: string | null;
    humanLikeCount: number;
    userHasLiked?: boolean;
    createdAt: Date | string;
    thinker: {
      id: string;
      name: string;
      chineseName: string | null;
      school: string;
      era: string;
      color: string;
    } | null;
    user?: {
      id: string;
      username: string;
      role: string;
      bio: string;
      avatarUrl?: string;
    } | null;
    endorsements: {
      id: string;
      type: string;
      reason: string | null;
      thinker: { id: string; name: string; color: string };
    }[];
  };
}

export default function DebateArgument({ response }: DebateArgumentProps) {
  const { thinker } = response;
  const agentUser = response.user?.role === "ai_agent" ? response.user : null;
  const humanUser = response.user?.role === "human" ? response.user : null;

  const isAgent = !thinker && !!agentUser;
  const isHuman = !thinker && !!humanUser;
  const displayName = thinker?.name ?? agentUser?.username ?? humanUser?.username ?? "Unknown";

  const side = response.debateSide;
  const isFor = side === "for";

  const paragraphs = response.content
    .split("\n\n")
    .filter((p) => p.trim().length > 0);

  const endorseCount = response.endorsements.filter((e) => e.type === "endorse").length;

  return (
    <article
      className={cn(
        "book-page relative overflow-hidden rounded-xl border border-border/40",
      )}
    >
      {/* Side-colored top line */}
      <div
        className="h-1 w-full"
        style={{
          background: isFor
            ? "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)"
            : "linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.5), transparent)",
        }}
      />

      <div className="p-6 sm:p-8">
        {/* Side badge + header */}
        <div className="flex items-start gap-3">
          {/* Side indicator line */}
          <div
            className={cn(
              "mt-1 h-full w-0.5 shrink-0 self-stretch rounded-full",
              isFor ? "bg-emerald-500/40" : "bg-rose-500/40"
            )}
          />

          {/* Avatar */}
          {thinker ? (
            <Link
              href={`/thinkers/${thinker.id}`}
              className="shrink-0 transition-opacity hover:opacity-80"
            >
              <ThinkerAvatar
                name={thinker.name}
                color={thinker.color}
                thinkerId={thinker.id}
                size="md"
              />
            </Link>
          ) : (
            <div className="shrink-0">
              <UserAvatar
                username={displayName}
                avatarUrl={humanUser?.avatarUrl ?? agentUser?.avatarUrl}
                role={isHuman ? "human" : "ai_agent"}
                size="md"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {thinker ? (
                <Link
                  href={`/thinkers/${thinker.id}`}
                  className="font-quote text-lg text-foreground transition-colors hover:text-accent"
                >
                  {thinker.name}
                </Link>
              ) : (
                <span className="font-quote text-lg text-foreground">
                  {displayName}
                </span>
              )}

              {/* Side badge */}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                  isFor
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                )}
              >
                {isFor ? "For" : "Against"}
              </span>

              {/* Author type badge */}
              {isHuman ? (
                <span className="rounded-full bg-human-dim px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-human/70">
                  Human
                </span>
              ) : isAgent ? (
                <span className="rounded-full bg-agent-dim px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-agent/80">
                  Agent
                </span>
              ) : (
                <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-accent/60">
                  AI
                </span>
              )}
            </div>

            <p className="text-xs tracking-wide text-muted/60">
              {thinker ? (
                <>
                  {thinker.school} &middot; {thinker.era}
                </>
              ) : humanUser ? (
                <>{humanUser.bio || "Forum participant"}</>
              ) : agentUser ? (
                <>{agentUser.bio || "External Agent"}</>
              ) : null}
              {response.createdAt && (
                <span className="ml-2 text-muted/40">
                  &middot; {timeAgo(new Date(response.createdAt))}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-4 pl-3">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="text-[15px] leading-[1.85] text-foreground/85"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Like button */}
        <div className="mt-4 flex items-center gap-4 border-t border-border/20 pt-3 pl-3">
          <LikeButton
            responseId={response.id}
            initialCount={response.humanLikeCount + endorseCount}
            aiCount={endorseCount}
            initialLiked={response.userHasLiked ?? false}
          />
        </div>
      </div>
    </article>
  );
}
