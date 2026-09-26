/**
 * Two-sided debate layout: For on the left, Against on the right, the
 * proposition "stone" in the middle. Debaters stand in the front rows,
 * thinkers who only voted/endorsed stand in the back row. Pure function.
 */
import type { ArenaActor } from "./build-script";

export const STAGE = { width: 720, height: 460, centerX: 360, centerY: 230 };

export interface Seat {
  x: number;
  y: number;
  r: number; // radius
}

/** Spread n points evenly between top and bottom. */
function spreadY(n: number, top: number, bottom: number): number[] {
  if (n === 1) return [(top + bottom) / 2];
  return Array.from({ length: n }, (_, i) => top + ((bottom - top) * i) / (n - 1));
}

function placeSide(actors: ArenaActor[], dir: -1 | 1, seats: Map<string, Seat>) {
  const { centerX } = STAGE;
  const debaters = actors.filter((a) => a.isDebater);
  const backers = actors.filter((a) => !a.isDebater);

  // Front two staggered columns for debaters
  const ys = spreadY(debaters.length, 80, 380);
  debaters.forEach((a, i) => {
    const offset = i % 2 === 0 ? 150 : 215;
    seats.set(a.id, { x: centerX + dir * offset, y: ys[i], r: 26 });
  });

  // Back row for supporters
  const backYs = spreadY(backers.length, 70, 390);
  backers.forEach((a, i) => {
    seats.set(a.id, { x: centerX + dir * 305, y: backYs[i], r: 15 });
  });
}

export function layoutDebate(actors: ArenaActor[]): Map<string, Seat> {
  const seats = new Map<string, Seat>();
  placeSide(actors.filter((a) => a.side === "for"), -1, seats);
  placeSide(actors.filter((a) => a.side === "against"), 1, seats);

  // Undecided: a row along the bottom of the stage
  const neutral = actors.filter((a) => a.side === "neutral");
  neutral.forEach((a, i) => {
    const x = STAGE.centerX + (i - (neutral.length - 1) / 2) * 56;
    seats.set(a.id, { x, y: 420, r: a.isDebater ? 22 : 15 });
  });

  return seats;
}

/** Where the current speaker steps to: partway toward the centre stone. */
export function stepForward(seat: Seat, amount = 0.35): { x: number; y: number } {
  return {
    x: seat.x + (STAGE.centerX - seat.x) * amount,
    y: seat.y + (STAGE.centerY - seat.y) * amount * 0.5,
  };
}
