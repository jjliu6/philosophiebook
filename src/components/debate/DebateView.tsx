"use client";

import DebateSideBar from "./DebateSideBar";
import DebateArgument from "./DebateArgument";
import DebateVoteButtons from "./DebateVoteButtons";
import { useViewMode } from "@/components/providers/ViewModeProvider";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { buildDebateScript } from "@/lib/arena/build-script";
import { cn } from "@/lib/utils";

// Loaded only when a reader opens the Arena, so the Book view pays nothing.
const ArenaStage = dynamic(() => import("@/components/arena/ArenaStage"), {
  ssr: false,
  loading: () => (
    <div className="book-page rounded-xl border border-border/40 px-6 py-24 text-center text-sm italic text-muted/40">
      Setting the stage…
    </div>
  ),
});

interface Voter {
  name: string;
  color?: string;
  avatarUrl?: string;
  isThinker: boolean;
  thinkerId?: string;
}

interface DebateReply {
  id: string;
  content: string;
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
}

interface DebateResponse {
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
  replies?: DebateReply[];
}

interface DebateViewProps {
  topicId: string;
  forCount: number;
  againstCount: number;
  forVoters: Voter[];
  againstVoters: Voter[];
  arguments: DebateResponse[];
  userVoteSide: "for" | "against" | null;
  proposition?: string | null;
}

export default function DebateView({
  topicId,
  forCount,
  againstCount,
  forVoters,
  againstVoters,
  arguments: debateArgs,
  userVoteSide,
  proposition,
}: DebateViewProps) {
  const { viewMode } = useViewMode();
  const [view, setView] = useState<"book" | "arena">("book");
  const isAiOnly = viewMode === "ai_only";

  // Filter voters and arguments based on view mode
  const visibleForVoters = isAiOnly ? forVoters.filter((v) => v.isThinker) : forVoters;
  const visibleAgainstVoters = isAiOnly ? againstVoters.filter((v) => v.isThinker) : againstVoters;
  const visibleArgs = isAiOnly
    ? debateArgs.filter((arg) => arg.thinker !== null) // Only show AI thinker arguments
    : debateArgs;

  const arenaScript = useMemo(
    () =>
      view === "arena"
        ? buildDebateScript(
            isAiOnly
              ? visibleArgs.map((a) => ({ ...a, replies: a.replies?.filter((r) => r.thinker !== null) }))
              : visibleArgs,
            visibleForVoters,
            visibleAgainstVoters,
          )
        : null,
    [view, isAiOnly, visibleArgs, visibleForVoters, visibleAgainstVoters],
  );

  return (
    <div className="space-y-8">
      {/* Vote tally */}
      <DebateSideBar
        forCount={visibleForVoters.length}
        againstCount={visibleAgainstVoters.length}
        forVoters={visibleForVoters}
        againstVoters={visibleAgainstVoters}
      />

      {/* Vote buttons — prominent, right after tally (always visible — user action) */}
      <DebateVoteButtons topicId={topicId} initialSide={userVoteSide} />

      {/* Book | Arena switch */}
      {visibleArgs.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-full border border-border/40 p-0.5 text-[12px] tracking-wide">
            {(["book", "arena"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "rounded-full px-4 py-1 transition-colors",
                  view === v ? "bg-accent/15 text-accent" : "text-muted/60 hover:text-foreground/70",
                )}
              >
                {v === "book" ? "Book" : "Arena"}
              </button>
            ))}
          </div>
        </div>
      )}

      {view === "arena" && arenaScript && (
        <ArenaStage script={arenaScript} proposition={proposition} />
      )}

      {/* Arguments — chronological */}
      {view === "book" && visibleArgs.length > 0 && (
        <div className="space-y-6">
          <div className="fleuron">
            <span className="text-[10px] text-accent/30">Arguments</span>
          </div>
          {visibleArgs.map((arg) => (
            <DebateArgument key={arg.id} response={arg} topicId={topicId} />
          ))}
        </div>
      )}

      {visibleArgs.length === 0 && (
        <div className="book-page page-corner rounded-xl border border-border/40 px-6 py-16 text-center">
          <p className="font-quote text-lg text-muted">No arguments yet.</p>
          <p className="mt-2 text-sm italic text-muted/40">
            Cast your vote and be the first to make your case.
          </p>
        </div>
      )}

      {/* Comments removed — all interaction happens via argument replies or voting */}
    </div>
  );
}
