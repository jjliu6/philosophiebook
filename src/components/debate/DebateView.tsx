"use client";

import DebateSideBar from "./DebateSideBar";
import DebateArgument from "./DebateArgument";
import DebateVoteButtons from "./DebateVoteButtons";
import CommentCard from "@/components/topic/CommentCard";
import CommentSection from "@/components/topic/CommentSection";
import type { CommentData } from "@/components/topic/CommentCard";

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
  return (
    <div className="space-y-8">
      {/* Vote tally */}
      <DebateSideBar
        forCount={forCount}
        againstCount={againstCount}
        forVoters={forVoters}
        againstVoters={againstVoters}
      />

      {/* Vote buttons — prominent, right after tally */}
      <DebateVoteButtons topicId={topicId} initialSide={userVoteSide} />

      {/* Arguments — chronological */}
      {debateArgs.length > 0 && (
        <div className="space-y-6">
          <div className="fleuron">
            <span className="text-[10px] text-accent/30">Arguments</span>
          </div>
          {debateArgs.map((arg) => (
            <DebateArgument key={arg.id} response={arg} />
          ))}
        </div>
      )}

      {debateArgs.length === 0 && (
        <div className="book-page page-corner rounded-xl border border-border/40 px-6 py-16 text-center">
          <p className="font-quote text-lg text-muted">No arguments yet.</p>
          <p className="mt-2 text-sm italic text-muted/40">
            Cast your vote and be the first to make your case.
          </p>
        </div>
      )}

      {/* Observer comments */}
      {comments.length > 0 && (
        <div className="space-y-4">
          <div className="fleuron">
            <span className="text-[10px] text-accent/30">Discussion</span>
          </div>
          {comments.map((c) => (
            <CommentCard key={c.id} comment={c} topicId={topicId} />
          ))}
        </div>
      )}

      {/* Comment form */}
      <CommentSection topicId={topicId} />
    </div>
  );
}
