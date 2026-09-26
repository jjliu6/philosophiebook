/**
 * Turn a debate topic's existing rows (arguments, replies, endorsements,
 * votes) into an ordered "script" the Arena can replay.
 *
 * Pure function — no React, no DB — so it can be reused later for
 * share images / video export. See docs/ARENA_DESIGN.md.
 */

export type ArenaSide = "for" | "against" | "neutral";

export interface ArenaActor {
  id: string; // "thinker:<id>" or "user:<id>"
  kind: "thinker" | "human" | "agent";
  name: string;
  color: string;
  thinkerId?: string;
  side: ArenaSide;
  /** Speaks in the debate (vs. only votes / endorses from the back row) */
  isDebater: boolean;
}

export type ArenaBeat =
  | { kind: "speak"; actor: string; responseId: string; line: string; content: string }
  | { kind: "reply"; from: string; to: string; responseId: string; line: string; content: string }
  | { kind: "endorse" | "challenge"; from: string; to: string; responseId: string; reason: string | null };

export interface ArenaScript {
  actors: ArenaActor[];
  beats: ArenaBeat[];
  /** Human / external-agent voters — drawn as the audience. */
  crowd: { for: number; against: number };
}

interface PersonRef {
  thinker: { id: string; name: string; color: string } | null;
  user?: { id: string; username: string; role: string } | null;
}

interface ArenaReplyInput extends PersonRef {
  id: string;
  content: string;
  createdAt: Date | string;
}

export interface ArenaArgumentInput extends PersonRef {
  id: string;
  content: string;
  debateSide: string | null;
  /** Set on replies — the topic page passes replies in the same flat list. */
  parentResponseId?: string | null;
  createdAt: Date | string;
  endorsements: {
    type: string;
    reason: string | null;
    thinker: { id: string; name: string; color: string };
  }[];
  replies?: ArenaReplyInput[];
}

export interface ArenaVoterInput {
  name: string;
  color?: string;
  isThinker: boolean;
  thinkerId?: string;
}

const USER_COLORS = { human: "#34d46e", agent: "#818cf8" };

function actorIdOf(p: PersonRef): string | null {
  if (p.thinker) return `thinker:${p.thinker.id}`;
  if (p.user) return `user:${p.user.id}`;
  return null;
}

/** First sentence (or ~140 chars at a word boundary) — the speech-bubble line. */
export function punchline(content: string, max = 140): string {
  const text = content.replace(/\s+/g, " ").trim();
  const sentence = text.match(/^.+?[.!?。！？](?=\s|$)/)?.[0] ?? text;
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

function toSide(side: string | null | undefined): ArenaSide {
  return side === "for" || side === "against" ? side : "neutral";
}

export function buildDebateScript(
  args: ArenaArgumentInput[],
  forVoters: ArenaVoterInput[] = [],
  againstVoters: ArenaVoterInput[] = [],
): ArenaScript {
  const actors = new Map<string, ArenaActor>();

  const ensureActor = (p: PersonRef, side: ArenaSide, isDebater: boolean): string | null => {
    const id = actorIdOf(p);
    if (!id) return null;
    const existing = actors.get(id);
    if (existing) {
      if (existing.side === "neutral") existing.side = side;
      existing.isDebater ||= isDebater;
      return id;
    }
    if (p.thinker) {
      actors.set(id, {
        id,
        kind: "thinker",
        name: p.thinker.name,
        color: p.thinker.color,
        thinkerId: p.thinker.id,
        side,
        isDebater,
      });
    } else if (p.user) {
      const kind = p.user.role === "ai_agent" ? "agent" : "human";
      actors.set(id, { id, kind, name: p.user.username, color: USER_COLORS[kind], side, isDebater });
    }
    return id;
  };

  // Timed events: top-level arguments and their replies, merged by time.
  type Timed =
    | { at: number; type: "arg"; arg: ArenaArgumentInput }
    | { at: number; type: "reply"; reply: ArenaReplyInput; parent: ArenaArgumentInput };
  const timed: Timed[] = [];
  // Replies arrive both nested under their argument and in the flat list; keep top-level only.
  for (const arg of args.filter((a) => !a.parentResponseId)) {
    timed.push({ at: new Date(arg.createdAt).getTime(), type: "arg", arg });
    for (const reply of arg.replies ?? []) {
      timed.push({ at: new Date(reply.createdAt).getTime(), type: "reply", reply, parent: arg });
    }
  }
  timed.sort((a, b) => a.at - b.at);

  // Register debaters first so their side comes from what they argued.
  for (const t of timed) {
    if (t.type === "arg") ensureActor(t.arg, toSide(t.arg.debateSide), true);
  }

  const beats: ArenaBeat[] = [];
  for (const t of timed) {
    if (t.type === "arg") {
      const actor = actorIdOf(t.arg);
      if (!actor) continue;
      beats.push({
        kind: "speak",
        actor,
        responseId: t.arg.id,
        line: punchline(t.arg.content),
        content: t.arg.content,
      });
      // Endorsements carry no timestamp — play them right after the argument.
      for (const e of t.arg.endorsements) {
        const from = ensureActor({ thinker: e.thinker }, "neutral", false);
        if (!from || from === actor) continue;
        beats.push({
          kind: e.type === "challenge" ? "challenge" : "endorse",
          from,
          to: actor,
          responseId: t.arg.id,
          reason: e.reason,
        });
      }
    } else {
      const to = actorIdOf(t.parent);
      // A replier who never argued stands against whoever they answer.
      const parentSide = toSide(t.parent.debateSide);
      const guess: ArenaSide =
        parentSide === "for" ? "against" : parentSide === "against" ? "for" : "neutral";
      const from = ensureActor(t.reply, guess, true);
      if (!from || !to || from === to) continue;
      beats.push({
        kind: "reply",
        from,
        to,
        responseId: t.reply.id,
        line: punchline(t.reply.content),
        content: t.reply.content,
      });
    }
  }

  // Thinkers who only voted stand in the back row of their side.
  const addVoters = (voters: ArenaVoterInput[], side: ArenaSide) => {
    for (const v of voters) {
      if (!v.isThinker || !v.thinkerId) continue;
      ensureActor({ thinker: { id: v.thinkerId, name: v.name, color: v.color ?? "#6B7280" } }, side, false);
    }
  };
  addVoters(forVoters, "for");
  addVoters(againstVoters, "against");

  const crowd = {
    for: forVoters.filter((v) => !v.isThinker).length,
    against: againstVoters.filter((v) => !v.isThinker).length,
  };

  return { actors: [...actors.values()], beats, crowd };
}

export interface BeatState {
  /** Tug-of-war score so far (For vs Against). */
  momentum: { for: number; against: number };
  /** For each actor, the distinct opponents who have hit them so far. */
  attackers: Map<string, Set<string>>;
  /** How many moves each actor has been part of so far — drives their glow. */
  heat: Map<string, number>;
}

const MOVE_WEIGHT: Record<ArenaBeat["kind"], number> = {
  speak: 1,
  reply: 1.5,
  challenge: 1,
  endorse: 0.75,
};

/** Cumulative state after each beat — precomputed so scrubbing is instant. */
export function computeBeatStates(script: ArenaScript): BeatState[] {
  const sideOf = new Map(script.actors.map((a) => [a.id, a.side]));
  const momentum = { for: 0, against: 0 };
  const attackers = new Map<string, Set<string>>();
  const heat = new Map<string, number>();
  const bump = (id: string) => heat.set(id, (heat.get(id) ?? 0) + 1);

  return script.beats.map((beat) => {
    // Endorsing lends weight to the endorsed side; everything else scores for the mover.
    const scorer =
      beat.kind === "speak" ? beat.actor : beat.kind === "endorse" ? beat.to : beat.from;
    const side = sideOf.get(scorer);
    if (side === "for" || side === "against") momentum[side] += MOVE_WEIGHT[beat.kind];

    if (beat.kind === "speak") {
      bump(beat.actor);
    } else {
      bump(beat.from);
      bump(beat.to);
      if (beat.kind === "reply" || beat.kind === "challenge") {
        const set = attackers.get(beat.to) ?? new Set<string>();
        set.add(beat.from);
        attackers.set(beat.to, set);
      }
    }

    return {
      momentum: { ...momentum },
      attackers: new Map([...attackers].map(([k, v]) => [k, new Set(v)])),
      heat: new Map(heat),
    };
  });
}
