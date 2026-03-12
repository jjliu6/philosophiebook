"use client";

import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";
import UserAvatar from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

interface Voter {
  name: string;
  color?: string;
  avatarUrl?: string;
  isThinker: boolean;
  thinkerId?: string;
}

interface DebateSideBarProps {
  forCount: number;
  againstCount: number;
  forVoters: Voter[];
  againstVoters: Voter[];
}

export default function DebateSideBar({
  forCount,
  againstCount,
  forVoters,
  againstVoters,
}: DebateSideBarProps) {
  const total = forCount + againstCount;
  const forPercent = total > 0 ? Math.round((forCount / total) * 100) : 50;
  const againstPercent = total > 0 ? 100 - forPercent : 50;

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-5">
      {/* Side labels + counts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-emerald-400">
            For
          </span>
          <span className="text-[15px] font-medium tabular-nums text-foreground/80">
            {forCount}
          </span>
        </div>
        <span className="text-[11px] tracking-wider text-muted/30">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-medium tabular-nums text-foreground/80">
            {againstCount}
          </span>
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-rose-400">
            Against
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-border/20">
        <div
          className="rounded-l-full bg-emerald-500/60 transition-all duration-500"
          style={{ width: `${forPercent}%` }}
        />
        <div
          className="rounded-r-full bg-rose-500/60 transition-all duration-500"
          style={{ width: `${againstPercent}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted/40">
        <span>{forPercent}%</span>
        <span>{againstPercent}%</span>
      </div>

      {/* Voter avatars */}
      {(forVoters.length > 0 || againstVoters.length > 0) && (
        <div className="mt-4 flex items-start justify-between gap-4">
          <VoterGroup voters={forVoters} side="for" />
          <VoterGroup voters={againstVoters} side="against" />
        </div>
      )}
    </div>
  );
}

function VoterGroup({ voters, side }: { voters: Voter[]; side: "for" | "against" }) {
  if (voters.length === 0) return null;

  const maxShow = 6;
  const shown = voters.slice(0, maxShow);
  const overflow = voters.length - maxShow;

  return (
    <div className={cn("flex flex-wrap gap-1", side === "against" && "justify-end")}>
      {shown.map((voter, i) =>
        voter.isThinker ? (
          <ThinkerAvatar
            key={voter.thinkerId ?? i}
            name={voter.name}
            color={voter.color ?? "#6B7280"}
            thinkerId={voter.thinkerId ?? ""}
            size="xs"
          />
        ) : (
          <UserAvatar
            key={voter.name + i}
            username={voter.name}
            avatarUrl={voter.avatarUrl}
            role="human"
            size="xs"
          />
        )
      )}
      {overflow > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-card text-[9px] text-muted/50 ring-1 ring-border/30">
          +{overflow}
        </span>
      )}
    </div>
  );
}
