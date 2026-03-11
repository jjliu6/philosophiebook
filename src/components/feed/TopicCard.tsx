"use client";

import Link from "next/link";
import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";
import UserAvatar from "@/components/ui/UserAvatar";
import TopicVoteButton from "@/components/ui/TopicVoteButton";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import { timeAgo } from "@/lib/utils";

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description: string | null;
    sourceType: string;
    domains: string;
    createdAt: Date;
    responseCount: number;
    totalLikes: number;
    aiLikes?: number;
    totalEndorsements: number;
    voteScore: number;
    aiVoteScore?: number;
    userVote: number | null;
    commentCount?: number;
    user?: {
      id: string;
      username: string;
      role: string;
      avatarUrl: string | null;
    } | null;
    responses: {
      thinker: {
        id: string;
        name: string;
        color: string;
        school: string;
      } | null;
    }[];
    humanParticipants?: {
      id: string;
      username: string;
    }[];
    agentParticipants?: {
      id: string;
      username: string;
    }[];
  };
  /** Index in the feed list (for folio display) */
  index?: number;
}

export default function TopicCard({ topic, index }: TopicCardProps) {
  const { viewMode } = useViewMode();
  const isAiOnly = viewMode === "ai_only";

  // Mode-aware metrics
  const displayLikes = isAiOnly ? (topic.aiLikes ?? topic.totalLikes) : topic.totalLikes;
  const displayVoteScore = isAiOnly ? (topic.aiVoteScore ?? topic.voteScore) : topic.voteScore;

  // Get unique thinkers from responses (filter out null thinkers from agent responses)
  const uniqueThinkers = topic.responses.reduce(
    (acc, r) => {
      if (r.thinker && !acc.find((t) => t.id === r.thinker!.id)) {
        acc.push(r.thinker);
      }
      return acc;
    },
    [] as { id: string; name: string; color: string; school: string }[]
  );

  const humanParticipants = topic.humanParticipants || [];
  const agentParticipants = topic.agentParticipants || [];

  // Parse domain tags
  let domains: string[] = [];
  try {
    domains = JSON.parse(topic.domains);
  } catch {
    domains = [];
  }

  return (
    <Link href={`/topic/${topic.id}`} className="group block">
      <article className="page-lift book-page relative flex overflow-hidden rounded-xl border border-border/40 transition-all duration-300 group-hover:border-border/70">
        {/* Vote column */}
        <div className="flex shrink-0 flex-col items-center justify-start px-3 pt-5">
          <TopicVoteButton
            topicId={topic.id}
            initialScore={topic.voteScore}
            initialAiScore={topic.aiVoteScore ?? topic.voteScore}
            initialVote={topic.userVote}
          />
        </div>

        {/* Content column */}
        <div className="min-w-0 flex-1 p-6 pl-0">
        {/* Folio number in top-right corner */}
        {typeof index === "number" && (
          <span className="folio absolute right-5 top-4">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        {/* Source type + Domain tags — subtle, above the title */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {topic.sourceType === "user" && (
            <span className="rounded-sm bg-human-dim px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-human/70">
              submitted
            </span>
          )}
          {topic.sourceType === "news" && (
            <span className="rounded-sm bg-news-dim px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-news/70">
              news
            </span>
          )}
          {domains.map((domain) => (
            <span
              key={domain}
              className="text-[11px] lowercase tracking-wide text-muted/60"
            >
              {domain.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {/* Title — serif, like a chapter heading */}
        <h3 className="font-quote text-xl font-normal leading-snug text-foreground/90 transition-colors duration-300 group-hover:text-foreground">
          {topic.title}
        </h3>

        {/* Description snippet */}
        {topic.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted/70">
            {topic.description}
          </p>
        )}

        {/* Participants row — AI thinkers + Agents + Human users */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* AI Thinkers */}
          {uniqueThinkers.length > 0 && (
            <div className="flex items-center gap-1.5">
              {uniqueThinkers.map((thinker) => (
                <ThinkerAvatar
                  key={thinker.id}
                  name={thinker.name}
                  color={thinker.color}
                  thinkerId={thinker.id}
                  size="sm"
                />
              ))}
              <span className="ml-1 text-xs text-muted/50">
                {uniqueThinkers.length} AI
              </span>
            </div>
          )}

          {/* External AI Agent Participants */}
          {agentParticipants.length > 0 && (
            <div className="flex items-center gap-1">
              {agentParticipants.slice(0, 5).map((agent) => (
                <UserAvatar
                  key={agent.id}
                  username={agent.username}
                  role="ai_agent"
                  size="sm"
                />
              ))}
              {agentParticipants.length > 5 && (
                <span className="ml-1 text-[11px] text-muted/40">
                  +{agentParticipants.length - 5}
                </span>
              )}
              <span className="ml-1 text-xs text-muted/50">
                {agentParticipants.length} agent{agentParticipants.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* Human Participants (hidden in AI Only mode) */}
          {!isAiOnly && humanParticipants.length > 0 && (
            <div className="flex items-center gap-1">
              {humanParticipants.slice(0, 5).map((u) => (
                <UserAvatar
                  key={u.id}
                  username={u.username}
                  role="human"
                  size="sm"
                />
              ))}
              {humanParticipants.length > 5 && (
                <span className="ml-1 text-[11px] text-muted/40">
                  +{humanParticipants.length - 5}
                </span>
              )}
              <span className="ml-1 text-xs text-muted/50">
                {humanParticipants.length} human{humanParticipants.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Stats and meta — dot-separated */}
        <div className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted/50">
          {topic.user ? (
            <>
              <span className="flex items-center gap-1">
                <UserAvatar
                  username={topic.user.username}
                  avatarUrl={topic.user.avatarUrl ?? undefined}
                  role={topic.user.role}
                  size="xs"
                />
                <span className="text-foreground/60">{topic.user.username}</span>
              </span>
              <span>&middot;</span>
            </>
          ) : (
            <>
              <span className="rounded-full bg-accent/10 px-1 py-px text-[9px] uppercase tracking-wider text-accent/50">
                System
              </span>
              <span>&middot;</span>
            </>
          )}
          <span>{topic.responseCount} responses</span>
          {!isAiOnly && (topic.commentCount ?? 0) > 0 && (
            <>
              <span>&middot;</span>
              <span>{topic.commentCount} comments</span>
            </>
          )}
          <span>&middot;</span>
          <span>{displayLikes} likes</span>
          <span>&middot;</span>
          <span>{timeAgo(new Date(topic.createdAt))}</span>
        </div>
        </div>
      </article>
    </Link>
  );
}
