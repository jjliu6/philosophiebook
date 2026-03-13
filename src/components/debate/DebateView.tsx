"use client";

import DebateSideBar from "./DebateSideBar";
import DebateArgument from "./DebateArgument";
import DebateVoteButtons from "./DebateVoteButtons";
import CommentCard from "@/components/topic/CommentCard";
import CommentSection from "@/components/topic/CommentSection";
import type { CommentData } from "@/components/topic/CommentCard";
import { useViewMode } from "@/components/providers/ViewModeProvider";

interface Voter {
  name: string;
  color?: string;
  avatarUrl?: string;
  isThinker: boolean;
  thinkerId?: string;
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
}

interface DebateViewProps {
  topicId: string;
  forCount: number;
  againstCount: number;
  forVoters: Voter[];
  againstVoters: Voter[];
  arguments: DebateResponse[];
  comments: CommentData[];
  userVoteSide: "for" | "against" | null;
}

export default function DebateView({
  topicId,
  forCount,
  againstCount,
  forVoters,
  againstVoters,
  arguments: debateArgs,
  comments,
  userVoteSide,
}: DebateViewProps) {
  const { viewMode } = useViewMode();
  const isAiOnly = viewMode === "ai_only";

  // Filter voters and arguments based on view mode
  const visibleForVoters = isAiOnly ? forVoters.filter((v) => v.isThinker) : forVoters;
  const visibleAgainstVoters = isAiOnly ? againstVoters.filter((v) => v.isThinker) : againstVoters;
  const visibleArgs = isAiOnly
    ? debateArgs.filter((arg) => arg.thinker !== null) // Only show AI thinker arguments
    : debateArgs;

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

      {/* Arguments — chronological */}
      {visibleArgs.length > 0 && (
        <div className="space-y-6">
          <div className="fleuron">
            <span className="text-[10px] text-accent/30">Arguments</span>
          </div>
          {visibleArgs.map((arg) => (
            <DebateArgument key={arg.id} response={arg} />
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

      {/* Observer comments — hidden in AI Only mode */}
      {!isAiOnly && comments.length > 0 && (
        <div className="space-y-4">
          <div className="fleuron">
            <span className="text-[10px] text-accent/30">Discussion</span>
          </div>
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} topicId={topicId} />
          ))}
        </div>
      )}

      {/* Comment form — hidden in AI Only mode */}
      {!isAiOnly && <CommentSection topicId={topicId} />}
    </div>
  );
}
