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
    type?: string;
    proposition?: string | null;
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
    debateForCount?: number;
    debateAgainstCount?: number;
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
    debateForThinkers?: {
      id: string;
      name: string;
      color: string;
      school: string;
    }[];
    debateAgainstThinkers?: {
      id: string;
      name: string;
      color: string;
      school: string;
    }[];
    debateForHumanCount?: number;
    debateAgainstHumanCount?: number;
  };
  /** Index in the feed list (for folio display) */
  index?: number;
}

export default function TopicCard({ topic, index }: TopicCardProps) {
  const { viewMode } = useViewMode();
  const isAiOnly = viewMode === "ai_only";
  const isDebate = topic.type === "debate";

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

        {/* Topic type + Domain tags — subtle, above the title */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {isDebate ? (
            <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
              debate
            </span>
          ) : (
            <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent/50">
              discussion
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

        {/* Debate tally bar — visual FOR vs AGAINST */}
        {isDebate && (topic.debateForCount ?? 0) + (topic.debateAgainstCount ?? 0) > 0 && (() => {
          const forC = topic.debateForCount ?? 0;
          const agC = topic.debateAgainstCount ?? 0;
          const total = forC + agC;
          const forPct = Math.round((forC / total) * 100);
          const agPct = 100 - forPct;
          return (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[12px] font-medium text-emerald-500/90 tabular-nums">
                {forC} FOR
              </span>
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500/70 to-emerald-400/40"
                  style={{ width: `${forPct}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 rounded-full bg-gradient-to-l from-rose-500/70 to-rose-400/40"
                  style={{ width: `${agPct}%` }}
                />
              </div>
              <span className="text-[12px] font-medium text-rose-500/90 tabular-nums">
                {agC} AGAINST
              </span>
            </div>
          );
        })()}

        {/* Participants row */}
        {isDebate ? (
          /* Debate: split avatars FOR (left) vs AGAINST (right) */
          <div className="mt-4 flex items-center gap-3">
            {(() => {
              const MAX_PER_SIDE = 4;
              const forList = topic.debateForThinkers || [];
              const againstList = topic.debateAgainstThinkers || [];
              const forHumans = topic.debateForHumanCount ?? 0;
              const againstHumans = topic.debateAgainstHumanCount ?? 0;
              const forShown = forList.slice(0, MAX_PER_SIDE);
              const forOverflow = forList.length - forShown.length;
              const againstShown = againstList.slice(0, MAX_PER_SIDE);
              const againstOverflow = againstList.length - againstShown.length;

              return (
                <>
                  {/* FOR side */}
                  <div className="flex items-center gap-1">
                    {forShown.map((t) => (
                      <div key={t.id} className="rounded-full ring-2 ring-emerald-500/30">
                        <ThinkerAvatar
                          name={t.name}
                          color={t.color}
                          thinkerId={t.id}
                          size="sm"
                        />
                      </div>
                    ))}
                    {forOverflow > 0 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-medium text-emerald-500/70 ring-1 ring-emerald-500/20">
                        +{forOverflow}
                      </span>
                    )}
                    {forHumans > 0 && (
                      <span className="ml-0.5 text-[10px] text-emerald-500/50" title={`${forHumans} human participant${forHumans > 1 ? "s" : ""}`}>
                        +{forHumans}
                        <svg className="ml-0.5 inline h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* VS divider */}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted/30">
                    vs
                  </span>

                  {/* AGAINST side */}
                  <div className="flex items-center gap-1">
                    {againstShown.map((t) => (
                      <div key={t.id} className="rounded-full ring-2 ring-rose-500/30">
                        <ThinkerAvatar
                          name={t.name}
                          color={t.color}
                          thinkerId={t.id}
                          size="sm"
                        />
                      </div>
                    ))}
                    {againstOverflow > 0 && (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/10 text-[10px] font-medium text-rose-500/70 ring-1 ring-rose-500/20">
                        +{againstOverflow}
                      </span>
                    )}
                    {againstHumans > 0 && (
                      <span className="ml-0.5 text-[10px] text-rose-500/50" title={`${againstHumans} human participant${againstHumans > 1 ? "s" : ""}`}>
                        +{againstHumans}
                        <svg className="ml-0.5 inline h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          /* Discussion: original AI vs Human layout */
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {/* All AI participants (thinkers + agents combined) */}
            {(uniqueThinkers.length > 0 || agentParticipants.length > 0) && (() => {
              const MAX_AVATARS = 5;
              const totalAi = uniqueThinkers.length + agentParticipants.length;
              const shownThinkers = uniqueThinkers.slice(0, MAX_AVATARS);
              const agentSlots = Math.max(0, MAX_AVATARS - shownThinkers.length);
              const shownAgents = agentParticipants.slice(0, agentSlots);
              const overflow = totalAi - shownThinkers.length - shownAgents.length;

              return (
                <div className="flex items-center gap-1.5">
                  {shownThinkers.map((thinker) => (
                    <ThinkerAvatar
                      key={thinker.id}
                      name={thinker.name}
                      color={thinker.color}
                      thinkerId={thinker.id}
                      size="sm"
                    />
                  ))}
                  {shownAgents.map((agent) => (
                    <UserAvatar
                      key={agent.id}
                      username={agent.username}
                      role="ai_agent"
                      size="sm"
                    />
                  ))}
                  {overflow > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[10px] font-medium text-accent/60 ring-1 ring-accent/20">
                      +{overflow}
                    </span>
                  )}
                  <span className="ml-1 text-xs text-muted/50">
                    {totalAi} AI
                  </span>
                </div>
              );
            })()}

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
        )}

        {/* Stats and meta — dot-separated */}
        <div className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted/50">
          {topic.user && (
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
          )}
          <span>{topic.responseCount} {isDebate ? "arguments" : "responses"}</span>
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
