"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  computeBeatStates,
  type ArenaActor,
  type ArenaBeat,
  type ArenaScript,
} from "@/lib/arena/build-script";
import { layoutDebate, stepForward, STAGE, type Seat } from "@/lib/arena/layout";

const SPEEDS = [1, 2, 4] as const;
const FOR_COLOR = "#10b981";
const AGAINST_COLOR = "#f43f5e";
const GOLD = "#d4b45c";
const { width: W, height: H, centerX: CX, centerY: CY } = STAGE;

type Point = { x: number; y: number };
type Move = Exclude<ArenaBeat, { kind: "speak" }>;

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** How long each beat stays on screen at 1× speed (long enough to read the bubble). */
function beatDuration(beat: ArenaBeat): number {
  if (beat.kind === "speak" || beat.kind === "reply") return 3000 + Math.min(beat.line.length, 140) * 18;
  return 2600;
}

function beatSpeaker(beat: ArenaBeat): string {
  return beat.kind === "speak" ? beat.actor : beat.from;
}

function beatTarget(beat: ArenaBeat): string | null {
  return beat.kind === "speak" ? null : beat.to;
}

function toRoman(n: number): string {
  const pairs: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of pairs) while (n >= v) { out += s; n -= v; }
  return out;
}

/** Curved path between two points, bowing upward. */
function arcPath(a: Point, b: Point): string {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.min(90, Math.abs(a.x - b.x) * 0.25 + 30);
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

/** Jagged lightning path for a challenge (deterministic, no randomness). */
function boltPath(a: Point, b: Point): string {
  const steps = 7;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  let d = `M ${a.x} ${a.y}`;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const amp = (i % 2 === 0 ? 1 : -1) * 14;
    d += ` L ${a.x + dx * t + nx * amp} ${a.y + dy * t + ny * amp}`;
  }
  return `${d} L ${b.x} ${b.y}`;
}

function edgeColor(beat: Move, actors: Map<string, ArenaActor>): string {
  if (beat.kind === "endorse") return GOLD;
  if (beat.kind === "challenge") return AGAINST_COLOR;
  return actors.get(beat.from)?.color ?? GOLD;
}

/** Stop a strike at the target's edge instead of inside their avatar. */
function shorten(from: Point, to: Point, by: number): Point {
  const d = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: to.x - ((to.x - from.x) / d) * by, y: to.y - ((to.y - from.y) / d) * by };
}

interface ArenaStageProps {
  script: ArenaScript;
  proposition?: string | null;
}

export default function ArenaStage({ script, proposition }: ArenaStageProps) {
  const uid = useId().replace(/:/g, "");
  const { actors, beats, crowd } = script;
  const actorMap = useMemo(() => new Map(actors.map((a) => [a.id, a])), [actors]);
  const seats = useMemo(() => layoutDebate(actors), [actors]);
  const states = useMemo(() => computeBeatStates(script), [script]);
  const roundOf = useMemo(() => {
    let n = 0;
    return beats.map((b) => (b.kind === "speak" ? ++n : n));
  }, [beats]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [expanded, setExpanded] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const beat = beats[index] as ArenaBeat | undefined;
  const state = states[index];
  const atEnd = index >= beats.length - 1;

  const speaker = beat ? beatSpeaker(beat) : null;
  const target = beat ? beatTarget(beat) : null;
  const siegeCount = target ? state?.attackers.get(target)?.size ?? 0 : 0;
  const isSiege = (beat?.kind === "reply" || beat?.kind === "challenge") && siegeCount >= 2;

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

  // The stage shakes when a blow lands hard.
  useEffect(() => {
    if (!beat || prefersReducedMotion()) return;
    if (beat.kind !== "challenge" && !isSiege) return;
    const el = stageRef.current;
    const t = setTimeout(() => {
      el?.animate(
        [
          { transform: "translate(0,0)" },
          { transform: "translate(-6px, 2px)" },
          { transform: "translate(5px, -2px)" },
          { transform: "translate(-3px, 1px)" },
          { transform: "translate(0,0)" },
        ],
        { duration: 380, easing: "ease-out" },
      );
    }, 800);
    return () => clearTimeout(t);
  }, [index, beat, isSiege]);

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

  if (!beat || !state) {
    return (
      <div className="book-page rounded-xl border border-border/40 px-6 py-16 text-center">
        <p className="font-quote text-lg text-muted">The arena is empty.</p>
        <p className="mt-2 text-sm italic text-muted/40">No arguments to replay yet.</p>
      </div>
    );
  }

  // Everyone who has made (or taken) a move so far is "in the fight".
  const entered = new Set<string>();
  for (let i = 0; i <= index; i++) {
    entered.add(beatSpeaker(beats[i]));
    const t = beatTarget(beats[i]);
    if (t) entered.add(t);
  }

  const moves = beat.kind === "speak" || beat.kind === "reply";
  const posOf = (id: string): Point => {
    const seat = seats.get(id);
    if (!seat) return { x: CX, y: CY };
    return id === speaker && moves ? stepForward(seat) : seat;
  };

  // Camera: frame the clash (or the speaker and the stone) and zoom in.
  const sp = speaker ? posOf(speaker) : { x: CX, y: CY };
  const tp = target ? posOf(target) : { x: CX, y: CY };
  const focus = { x: (sp.x + tp.x) / 2, y: (sp.y + tp.y) / 2 };
  const span = Math.max(Math.abs(sp.x - tp.x) + 180, (Math.abs(sp.y - tp.y) + 160) * (W / H));
  const zoom = Math.min(1.3, Math.max(1.05, W / span));
  // Keep the camera inside the stage.
  const fx = Math.min(W - W / (2 * zoom), Math.max(W / (2 * zoom), focus.x));
  const fy = Math.min(H - H / (2 * zoom), Math.max(H / (2 * zoom), focus.y));
  const toScreen = (p: Point): Point => ({ x: W / 2 + (p.x - fx) * zoom, y: H / 2 + (p.y - fy) * zoom });

  const history = beats.slice(0, index).filter((b): b is Move => b.kind !== "speak");
  const speakerActor = speaker ? actorMap.get(speaker) : undefined;
  const targetActor = target ? actorMap.get(target) : undefined;
  const clipRadii = [...new Set([...seats.values()].map((s) => s.r))];

  // Momentum tug-of-war
  const total = state.momentum.for + state.momentum.against;
  const forPct = total > 0 ? (state.momentum.for / total) * 100 : 50;

  // Speech bubble anchored above (or below, near the top) the speaker, in screen space.
  const speakerR = (speaker ? seats.get(speaker)?.r : undefined) ?? 24;
  const anchor = toScreen(sp);
  const bubbleBelow = anchor.y < H * 0.4;
  const bubbleY = bubbleBelow ? anchor.y + speakerR * zoom + 30 : anchor.y - speakerR * zoom - 12;

  const banner = bannerFor(beat, roundOf[index], speakerActor, targetActor, isSiege, siegeCount);

  // Audience: human voters plus the room's mood, split by the current momentum.
  const crowdSize = Math.min(40, Math.max(20, crowd.for + crowd.against));
  const crowdForShare =
    (crowd.for + state.momentum.for + 1) / (crowd.for + crowd.against + total + 2);
  const crowdFor = Math.round(crowdSize * crowdForShare);
  const crowdReacts = beat.kind === "challenge" || beat.kind === "reply";

  return (
    <div className="space-y-4">
      <div
        ref={stageRef}
        className="relative overflow-hidden rounded-xl border border-black/40 bg-[#0b0a10] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)]"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
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
            <radialGradient id={`${uid}-spot`} cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#3a2f1a" stopOpacity={0.9} />
              <stop offset="55%" stopColor="#15121a" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#0b0a10" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${uid}-vignette`} cx="50%" cy="50%" r="75%">
              <stop offset="60%" stopColor="#000" stopOpacity={0} />
              <stop offset="100%" stopColor="#000" stopOpacity={0.75} />
            </radialGradient>
            <linearGradient id={`${uid}-for`} x1="0" x2="1">
              <stop offset="0%" stopColor={FOR_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={FOR_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`${uid}-against`} x1="1" x2="0">
              <stop offset="0%" stopColor={AGAINST_COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={AGAINST_COLOR} stopOpacity={0} />
            </linearGradient>
            <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ===== Camera ===== */}
          <g
            className="arena-camera"
            style={{ transform: `translate(${W / 2}px, ${H / 2}px) scale(${zoom}) translate(${-fx}px, ${-fy}px)` }}
          >
            {/* Floor */}
            <rect x={-200} y={-200} width={W + 400} height={H + 400} fill="#0b0a10" />
            <rect x={-200} y={-200} width={W / 2 + 200} height={H + 400} fill={`url(#${uid}-for)`} />
            <rect x={W / 2} y={-200} width={W / 2 + 200} height={H + 400} fill={`url(#${uid}-against)`} />
            <ellipse cx={CX} cy={CY} rx={330} ry={215} fill={`url(#${uid}-spot)`} />

            {/* Colonnade of the agora */}
            {Array.from({ length: 11 }, (_, i) => {
              const t = i / 10;
              const x = 40 + t * (W - 80);
              const y = 18 + Math.pow(t - 0.5, 2) * 60;
              return (
                <g key={i} opacity={0.14}>
                  <rect x={x - 5} y={y} width={10} height={34} fill={GOLD} />
                  <rect x={x - 8} y={y - 3} width={16} height={4} fill={GOLD} />
                </g>
              );
            })}

            {/* Arena rings */}
            {[1, 0.72, 0.45].map((k) => (
              <ellipse
                key={k}
                cx={CX}
                cy={CY}
                rx={300 * k}
                ry={195 * k}
                fill="none"
                stroke={GOLD}
                strokeOpacity={0.1 + (1 - k) * 0.12}
                strokeDasharray={k === 1 ? "2 7" : undefined}
              />
            ))}

            {/* Proposition stone */}
            <g transform={`translate(${CX} ${CY})`}>
              <polygon points="0,-26 26,0 0,26 -26,0" fill="none" stroke={GOLD} strokeOpacity={0.55} />
              <polygon points="0,-12 12,0 0,12 -12,0" fill={GOLD} fillOpacity={0.5} filter={`url(#${uid}-glow)`} />
            </g>

            {/* Past exchanges leave scorch marks */}
            {history.map((b, i) => (
              <path
                key={`h-${i}`}
                d={b.kind === "challenge" ? boltPath(posOf(b.from), posOf(b.to)) : arcPath(posOf(b.from), posOf(b.to))}
                fill="none"
                stroke={edgeColor(b, actorMap)}
                strokeOpacity={0.18}
                strokeWidth={1.5}
              />
            ))}

            {/* The current move */}
            {beat.kind === "speak" && (
              <line
                key={`cur-${index}`}
                x1={sp.x}
                y1={sp.y}
                x2={CX}
                y2={CY}
                pathLength={1}
                stroke={speakerActor?.color ?? GOLD}
                strokeOpacity={0.7}
                strokeWidth={2}
                className="arena-draw"
              />
            )}
            {beat.kind !== "speak" && target && (
              <CurrentMove
                key={`cur-${index}`}
                beat={beat}
                from={sp}
                to={shorten(sp, tp, (seats.get(target)?.r ?? 24) + 4)}
                color={edgeColor(beat, actorMap)}
                glow={`url(#${uid}-glow)`}
              />
            )}

            {/* Figures */}
            {actors.map((actor) => {
              const seat = seats.get(actor.id) as Seat;
              const pos = posOf(actor.id);
              const isSpeaker = actor.id === speaker;
              const isTarget = actor.id === target;
              const involved = isSpeaker || isTarget;
              const hit = isTarget && beat.kind !== "endorse";
              const heat = state.heat.get(actor.id) ?? 0;
              const besiegers = state.attackers.get(actor.id)?.size ?? 0;
              const opacity = involved
                ? 1
                : !entered.has(actor.id)
                  ? 0.22
                  : beat.kind === "speak"
                    ? 0.6
                    : 0.35;
              return (
                <g
                  key={actor.id}
                  className="arena-figure cursor-pointer"
                  style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, opacity }}
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
                  <g key={hit ? `hit-${index}` : "idle"} className={cn(hit && "arena-recoil")}>
                    {isSpeaker && (
                      <circle
                        r={seat.r + 14}
                        fill={actor.color}
                        fillOpacity={0.3}
                        className="arena-pulse"
                        filter={`url(#${uid}-glow)`}
                      />
                    )}
                    {hit && (
                      <circle r={seat.r + 6} fill="none" stroke={AGAINST_COLOR} strokeWidth={2} className="arena-hit-ring" />
                    )}
                    <circle
                      r={seat.r + 2.5}
                      fill="none"
                      stroke={isSpeaker ? actor.color : hit ? AGAINST_COLOR : GOLD}
                      strokeOpacity={involved ? 1 : 0.25 + Math.min(0.5, heat * 0.08)}
                      strokeWidth={isSpeaker ? 3.5 : 1.5 + Math.min(3, heat * 0.4)}
                    />
                    <circle r={seat.r} fill={actor.color} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="rgba(255,255,255,0.9)"
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
                    y={seat.r + 17}
                    textAnchor="middle"
                    fill={involved ? "#f5ecd6" : "rgba(245,236,214,0.75)"}
                    style={{ fontSize: actor.isDebater ? 15 : 11, fontFamily: "Georgia, serif" }}
                  >
                    {actor.name}
                  </text>
                  {besiegers >= 2 && (
                    <text y={seat.r + 32} textAnchor="middle" fill={AGAINST_COLOR} style={{ fontSize: 11, letterSpacing: 1 }}>
                      ⚔ ×{besiegers}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* Vignette sits outside the camera so the edges stay dark */}
          <rect x={0} y={0} width={W} height={H} fill={`url(#${uid}-vignette)`} pointerEvents="none" />

          {/* Audience */}
          <g transform={`translate(0 ${H - 14})`} pointerEvents="none">
            {Array.from({ length: crowdSize }, (_, i) => {
              const x = 30 + (i * (W - 60)) / (crowdSize - 1);
              return (
                <circle
                  key={`${i}-${crowdReacts ? index : "calm"}`}
                  cx={x}
                  cy={0}
                  r={4.5}
                  fill={i < crowdFor ? FOR_COLOR : AGAINST_COLOR}
                  fillOpacity={0.6}
                  className={cn("arena-crowd-dot", crowdReacts && "arena-crowd")}
                  style={{ animationDelay: `${0.75 + ((i * 37) % 11) * 0.035}s` }}
                />
              );
            })}
          </g>
        </svg>

        {/* ===== HTML overlays ===== */}
        {/* Momentum tug-of-war */}
        <div className="pointer-events-none absolute inset-x-3 top-2.5 sm:inset-x-5 sm:top-3">
          <div className="flex items-center justify-between text-[9px] font-medium uppercase tracking-[0.25em] sm:text-[10px]">
            <span className="text-emerald-400/90">For</span>
            <span className="text-[#d4b45c]/60">Momentum</span>
            <span className="text-rose-400/90">Against</span>
          </div>
          <div className="relative mt-1 h-1.5 rounded-full bg-white/10">
            <div
              className="arena-momentum absolute inset-y-0 left-0 rounded-l-full bg-gradient-to-r from-emerald-700 to-emerald-400"
              style={{ width: `${forPct}%` }}
            />
            <div
              className="arena-momentum absolute inset-y-0 right-0 rounded-r-full bg-gradient-to-l from-rose-700 to-rose-400"
              style={{ width: `${100 - forPct}%` }}
            />
            <div
              className="arena-momentum absolute -inset-y-1 w-0.5 -translate-x-1/2 bg-[#f5ecd6] shadow-[0_0_8px_#f5ecd6]"
              style={{ left: `${forPct}%` }}
            />
          </div>
        </div>

        {/* Round / siege banner */}
        <div key={`banner-${index}`} className="arena-banner pointer-events-none absolute inset-x-0 bottom-[7%] text-center">
          <p
            className={cn(
              "font-quote text-[15px] uppercase tracking-[0.3em] sm:text-2xl",
              banner.tone === "siege" ? "text-rose-400" : banner.tone === "ally" ? "text-[#d4b45c]" : "text-[#f5ecd6]",
            )}
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
          >
            {banner.title}
          </p>
          <p className="mt-0.5 text-[10px] tracking-[0.15em] text-[#f5ecd6]/70 sm:text-xs">{banner.subtitle}</p>
        </div>

        {/* Speech bubble */}
        {beat.kind !== "endorse" && speakerActor && (
          <div
            className="arena-bubble-pos pointer-events-none absolute"
            style={{
              left: `${Math.min(70, Math.max(30, (anchor.x / W) * 100))}%`,
              top: `${(bubbleY / H) * 100}%`,
              transform: bubbleBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            }}
          >
            <SpeechBubble
              key={`bubble-${index}`}
              text={"line" in beat ? beat.line : beat.reason ?? "I object."}
              color={beat.kind === "challenge" ? AGAINST_COLOR : speakerActor.color}
              speed={speed}
              pointDown={!bubbleBelow}
            />
          </div>
        )}
      </div>

      {/* Caption: full text of this move */}
      {speakerActor && (
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
                <p className="mt-2 font-quote text-lg leading-snug text-foreground">&ldquo;{beat.line}&rdquo;</p>
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
            <p className="mt-2 font-quote text-base italic leading-snug text-foreground/80">&ldquo;{beat.reason}&rdquo;</p>
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

function bannerFor(
  beat: ArenaBeat,
  round: number,
  speaker: ArenaActor | undefined,
  target: ArenaActor | undefined,
  isSiege: boolean,
  siegeCount: number,
): { title: string; subtitle: string; tone: "normal" | "siege" | "ally" } {
  const s = speaker?.name ?? "";
  const t = target?.name ?? "";
  if (beat.kind === "speak") {
    const side = speaker?.side === "for" ? "for the motion" : speaker?.side === "against" ? "against the motion" : "";
    return { title: `Round ${toRoman(round)}`, subtitle: `${s} takes the floor ${side}`.trim(), tone: "normal" };
  }
  if (isSiege) return { title: "Under siege", subtitle: `${t} · 1 against ${siegeCount}`, tone: "siege" };
  if (beat.kind === "reply") return { title: "Riposte", subtitle: `${s} strikes back at ${t}`, tone: "normal" };
  if (beat.kind === "challenge") return { title: "Challenge!", subtitle: `${s} contests ${t}`, tone: "siege" };
  return { title: "Alliance", subtitle: `${s} stands with ${t}`, tone: "ally" };
}

/** The animated strike: a comet along an arc, a lightning bolt, or a gold thread. */
function CurrentMove({ beat, from, to, color, glow }: { beat: Move; from: Point; to: Point; color: string; glow: string }) {
  const isEndorse = beat.kind === "endorse";
  const isChallenge = beat.kind === "challenge";
  const d = isChallenge ? boltPath(from, to) : arcPath(from, to);
  const rays = isEndorse ? 6 : 10;
  return (
    <g>
      {/* The trail */}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={isEndorse ? 1.5 : 2.5}
        strokeOpacity={isEndorse ? 0.9 : 0.75}
        strokeLinecap="round"
        className={isChallenge ? "arena-bolt" : "arena-draw"}
        filter={isChallenge ? glow : undefined}
      />
      {/* The comet head */}
      {!isChallenge && (
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke={isEndorse ? "#fff6d5" : "#fff"}
          strokeWidth={isEndorse ? 4 : 7}
          strokeLinecap="round"
          className="arena-comet"
          filter={glow}
        />
      )}
      {/* Impact */}
      <g transform={`translate(${to.x} ${to.y})`}>
        <g className={isEndorse ? "arena-sparkle" : "arena-burst"}>
          {Array.from({ length: rays }, (_, i) => {
            const a = (i / rays) * Math.PI * 2;
            const r2 = isEndorse ? 16 : i % 2 ? 22 : 34;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 6}
                y1={Math.sin(a) * 6}
                x2={Math.cos(a) * r2}
                y2={Math.sin(a) * r2}
                stroke={isEndorse ? "#f7e3a1" : color}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
          <circle r={10} fill="none" stroke={isEndorse ? GOLD : "#fff"} strokeWidth={2} />
        </g>
      </g>
    </g>
  );
}

/** Speech bubble that types itself out. */
function SpeechBubble({ text, color, speed, pointDown }: { text: string; color: string; speed: number; pointDown: boolean }) {
  const [shown, setShown] = useState(() => (prefersReducedMotion() ? text.length : 0));

  useEffect(() => {
    if (shown >= text.length) return;
    const t = setTimeout(() => setShown((n) => Math.min(text.length, n + 2)), 28 / speed);
    return () => clearTimeout(t);
  }, [shown, text.length, speed]);

  return (
    <div
      className="arena-bubble relative w-max max-w-[54vw] rounded-lg border bg-[#f5ecd6] px-2.5 py-1.5 text-[#1b1710] shadow-[0_8px_24px_rgba(0,0,0,0.6)] sm:max-w-[340px] sm:px-3.5 sm:py-2.5"
      style={{ borderColor: color, borderLeftWidth: 4 }}
    >
      <p className="font-quote text-[11px] leading-snug sm:text-[15px]">
        {text.slice(0, shown)}
        {shown < text.length && <span className="opacity-40">▍</span>}
      </p>
      <span
        className={cn(
          "absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[#f5ecd6]",
          pointDown ? "-bottom-[5px]" : "-top-[5px]",
        )}
      />
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
        primary ? "border-accent/40 text-accent hover:bg-accent/10" : "border-border/40 text-muted/70 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
