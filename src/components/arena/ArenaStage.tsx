"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { ArenaActor, ArenaBeat, ArenaScript } from "@/lib/arena/build-script";
import { layoutDebate, stepForward, STAGE, type Seat } from "@/lib/arena/layout";

const SPEEDS = [1, 2, 4] as const;
const FOR_COLOR = "#10b981";
const AGAINST_COLOR = "#f43f5e";
const GOLD = "#d4b45c";

/** How long each beat stays on screen at 1× speed. */
function beatDuration(beat: ArenaBeat): number {
  return beat.kind === "speak" || beat.kind === "reply" ? 3600 : 2000;
}

function beatSpeaker(beat: ArenaBeat): string {
  return beat.kind === "speak" ? beat.actor : beat.from;
}

function beatTarget(beat: ArenaBeat): string | null {
  return beat.kind === "speak" ? null : beat.to;
}

/** Curved path between two points, bowing upward. */
function arcPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.min(90, Math.abs(a.x - b.x) * 0.25 + 30);
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

function edgeColor(beat: ArenaBeat, actors: Map<string, ArenaActor>): string {
  if (beat.kind === "endorse") return GOLD;
  if (beat.kind === "challenge") return AGAINST_COLOR;
  return actors.get(beatSpeaker(beat))?.color ?? GOLD;
}

interface ArenaStageProps {
  script: ArenaScript;
  proposition?: string | null;
}

export default function ArenaStage({ script, proposition }: ArenaStageProps) {
  const uid = useId().replace(/:/g, "");
  const { actors, beats } = script;
  const actorMap = useMemo(() => new Map(actors.map((a) => [a.id, a])), [actors]);
  const seats = useMemo(() => layoutDebate(actors), [actors]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [expanded, setExpanded] = useState(false);

  const beat = beats[index] as ArenaBeat | undefined;
  const atEnd = index >= beats.length - 1;

  // Autoplay: advance one beat after its duration.
  useEffect(() => {
    if (!playing || !beat || atEnd) return;
    const t = setTimeout(() => {
      setIndex(index + 1);
      setExpanded(false);
      if (index + 1 >= beats.length - 1) setPlaying(false);
    }, beatDuration(beat) / speed);
    return () => clearTimeout(t);
  }, [playing, beat, atEnd, speed, index, beats.length]);

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(beats.length - 1, i)));
    setExpanded(false);
  };

  const togglePlay = () => {
    if (atEnd) {
      goTo(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  /** Clicking a figure jumps to their next move after the current beat. */
  const jumpToActor = (actorId: string) => {
    const n = beats.length;
    for (let step = 1; step <= n; step++) {
      const i = (index + step) % n;
      if (beatSpeaker(beats[i]) === actorId) {
        setPlaying(false);
        goTo(i);
        return;
      }
    }
  };

  if (beats.length === 0) {
    return (
      <div className="book-page rounded-xl border border-border/40 px-6 py-16 text-center">
        <p className="font-quote text-lg text-muted">The arena is empty.</p>
        <p className="mt-2 text-sm italic text-muted/40">No arguments to replay yet.</p>
      </div>
    );
  }

  // Everyone who has made a move up to now is "in the fight".
  const active = new Set<string>();
  for (let i = 0; i <= index; i++) active.add(beatSpeaker(beats[i]));

  const speaker = beat ? beatSpeaker(beat) : null;
  const target = beat ? beatTarget(beat) : null;
  const moves = beat?.kind === "speak" || beat?.kind === "reply";

  const posOf = (id: string): { x: number; y: number } => {
    const seat = seats.get(id);
    if (!seat) return { x: STAGE.centerX, y: STAGE.centerY };
    return id === speaker && moves ? stepForward(seat) : seat;
  };

  // Past exchanges stay on stage as faint traces.
  const history = beats
    .slice(0, index)
    .filter((b): b is Exclude<ArenaBeat, { kind: "speak" }> => b.kind !== "speak");
  const speakerActor = speaker ? actorMap.get(speaker) : undefined;
  const targetActor = target ? actorMap.get(target) : undefined;

  const clipRadii = [...new Set([...seats.values()].map((s) => s.r))];

  return (
    <div className="space-y-4">
      <div className="book-page overflow-hidden rounded-xl border border-border/40">
        <svg
          viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
          className="block h-auto w-full select-none"
          role="img"
          aria-label="Debate arena replay"
        >
          <defs>
            {clipRadii.map((r) => (
              <clipPath key={r} id={`${uid}-clip-${r}`}>
                <circle cx={0} cy={0} r={r} />
              </clipPath>
            ))}
            <radialGradient id={`${uid}-floor`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.1} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
            </radialGradient>
            <linearGradient id={`${uid}-for`} x1="0" x2="1">
              <stop offset="0%" stopColor={FOR_COLOR} stopOpacity={0.12} />
              <stop offset="100%" stopColor={FOR_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${uid}-against`} x1="1" x2="0">
              <stop offset="0%" stopColor={AGAINST_COLOR} stopOpacity={0.12} />
              <stop offset="100%" stopColor={AGAINST_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Floor: side tints + agora circle */}
          <rect x={0} y={0} width={STAGE.width / 2} height={STAGE.height} fill={`url(#${uid}-for)`} />
          <rect
            x={STAGE.width / 2}
            y={0}
            width={STAGE.width / 2}
            height={STAGE.height}
            fill={`url(#${uid}-against)`}
          />
          <ellipse cx={STAGE.centerX} cy={STAGE.centerY} rx={300} ry={200} fill={`url(#${uid}-floor)`} />
          <ellipse
            cx={STAGE.centerX}
            cy={STAGE.centerY}
            rx={300}
            ry={200}
            fill="none"
            stroke={GOLD}
            strokeOpacity={0.12}
            strokeDasharray="2 6"
          />

          <text x={24} y={30} className="fill-emerald-500/70 text-[13px] uppercase tracking-[0.2em]">
            For
          </text>
          <text
            x={STAGE.width - 24}
            y={30}
            textAnchor="end"
            className="fill-rose-500/70 text-[13px] uppercase tracking-[0.2em]"
          >
            Against
          </text>

          {/* Proposition stone */}
          <g transform={`translate(${STAGE.centerX} ${STAGE.centerY})`}>
            <polygon points="0,-22 22,0 0,22 -22,0" fill="none" stroke={GOLD} strokeOpacity={0.5} />
            <polygon points="0,-10 10,0 0,10 -10,0" fill={GOLD} fillOpacity={0.35} />
          </g>

          {/* History traces */}
          {history.map((b, i) => (
            <path
              key={`h-${i}`}
              d={arcPath(posOf(b.from), posOf(b.to))}
              fill="none"
              stroke={edgeColor(b, actorMap)}
              strokeOpacity={0.14}
              strokeWidth={1.5}
            />
          ))}

          {/* Current move */}
          {beat && beat.kind !== "speak" && (
            <path
              key={`cur-${index}`}
              d={arcPath(posOf(beat.from), posOf(beat.to))}
              pathLength={1}
              fill="none"
              stroke={edgeColor(beat, actorMap)}
              strokeWidth={beat.kind === "reply" ? 3 : 2}
              strokeLinecap="round"
              className="arena-draw"
            />
          )}
          {beat?.kind === "speak" && speaker && (
            <line
              key={`cur-${index}`}
              x1={posOf(speaker).x}
              y1={posOf(speaker).y}
              x2={STAGE.centerX}
              y2={STAGE.centerY}
              pathLength={1}
              stroke={speakerActor?.color ?? GOLD}
              strokeOpacity={0.6}
              strokeWidth={2}
              strokeDasharray="1"
              className="arena-draw"
            />
          )}

          {/* Figures */}
          {actors.map((actor) => {
            const seat = seats.get(actor.id) as Seat;
            const pos = posOf(actor.id);
            const isSpeaker = actor.id === speaker;
            const isTarget = actor.id === target;
            const dim = !active.has(actor.id) && !isTarget;
            return (
              <g
                key={actor.id}
                className="arena-figure cursor-pointer"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  opacity: dim ? (actor.isDebater ? 0.35 : 0.5) : 1,
                }}
                onClick={() => jumpToActor(actor.id)}
                role="button"
                tabIndex={0}
                aria-label={`${actor.name} — jump to their next move`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    jumpToActor(actor.id);
                  }
                }}
              >
                <g
                  key={isTarget ? `hit-${index}` : "idle"}
                  className={cn(
                    isTarget && beat?.kind === "reply" && "arena-recoil",
                    isTarget && beat?.kind === "challenge" && "arena-recoil",
                  )}
                >
                  {isSpeaker && (
                    <circle r={seat.r + 9} fill={actor.color} fillOpacity={0.18} className="arena-pulse" />
                  )}
                  <circle
                    r={seat.r + 2}
                    fill="none"
                    stroke={isSpeaker ? actor.color : isTarget ? edgeColor(beat!, actorMap) : GOLD}
                    strokeOpacity={isSpeaker || isTarget ? 0.9 : 0.35}
                    strokeWidth={isSpeaker ? 3 : 1.5}
                  />
                  <circle r={seat.r} fill={actor.color} fillOpacity={0.85} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-white/90"
                    style={{ fontSize: seat.r * 0.9 }}
                  >
                    {actor.name.charAt(0).toUpperCase()}
                  </text>
                  {actor.thinkerId && (
                    <image
                      href={`/avatars/${actor.thinkerId}.svg`}
                      x={-seat.r}
                      y={-seat.r}
                      width={seat.r * 2}
                      height={seat.r * 2}
                      clipPath={`url(#${uid}-clip-${seat.r})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  )}
                </g>
                <text
                  y={seat.r + 16}
                  textAnchor="middle"
                  className={cn(
                    "fill-current",
                    isSpeaker ? "text-foreground" : "text-muted",
                  )}
                  style={{ fontSize: actor.isDebater ? 15 : 11 }}
                >
                  {actor.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Caption: what is happening in this beat */}
      {beat && speakerActor && (
        <div className="book-page rounded-xl border border-border/40 px-5 py-4 sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted/60">
            <span style={{ color: speakerActor.color }}>{speakerActor.name}</span>{" "}
            {beat.kind === "speak" &&
              (speakerActor.side === "neutral" ? "takes the floor" : `argues ${speakerActor.side}`)}
            {beat.kind === "reply" && <>replies to {targetActor?.name}</>}
            {beat.kind === "endorse" && <>endorses {targetActor?.name}</>}
            {beat.kind === "challenge" && <>challenges {targetActor?.name}</>}
          </p>

          {(beat.kind === "speak" || beat.kind === "reply") && (
            <>
              {expanded ? (
                <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-foreground/85">
                  {beat.content
                    .split(/\n\s*\n/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i} className="whitespace-pre-line">
                        {p}
                      </p>
                    ))}
                </div>
              ) : (
                <p className="mt-2 font-quote text-lg leading-snug text-foreground">
                  &ldquo;{beat.line}&rdquo;
                </p>
              )}
              <button
                onClick={() => {
                  setPlaying(false);
                  setExpanded((e) => !e);
                }}
                className="mt-2 text-[12px] text-accent/70 transition-colors hover:text-accent"
              >
                {expanded ? "Show less" : "Read in full →"}
              </button>
            </>
          )}

          {(beat.kind === "endorse" || beat.kind === "challenge") && beat.reason && (
            <p className="mt-2 font-quote text-base italic leading-snug text-foreground/80">
              &ldquo;{beat.reason}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <ControlButton label="Previous move" onClick={() => { setPlaying(false); goTo(index - 1); }} disabled={index === 0}>
            ‹
          </ControlButton>
          <ControlButton label={playing ? "Pause" : "Play"} onClick={togglePlay} primary>
            {playing ? "❚❚" : "▶"}
          </ControlButton>
          <ControlButton label="Next move" onClick={() => { setPlaying(false); goTo(index + 1); }} disabled={atEnd}>
            ›
          </ControlButton>
        </div>

        <input
          type="range"
          min={0}
          max={beats.length - 1}
          value={index}
          onChange={(e) => {
            setPlaying(false);
            goTo(Number(e.target.value));
          }}
          aria-label="Replay position"
          className="min-w-[120px] flex-1 accent-[var(--accent)]"
        />

        <span className="text-[12px] tabular-nums text-muted/60">
          {index + 1} / {beats.length}
        </span>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] tabular-nums transition-colors",
                speed === s ? "bg-accent/15 text-accent" : "text-muted/50 hover:text-foreground/70",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {proposition && (
        <p className="text-center text-[12px] italic text-muted/40">
          Replaying the debate on &ldquo;{proposition}&rdquo; — click any figure to jump to their next move.
        </p>
      )}
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors disabled:opacity-30",
        primary
          ? "border-accent/40 text-accent hover:bg-accent/10"
          : "border-border/40 text-muted/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
