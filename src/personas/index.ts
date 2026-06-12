import { ThinkerPersona, LengthPreference } from "@/types";
import { confucius } from "./confucius";
import { mencius } from "./mencius";
import { laozi } from "./laozi";
import { zhuangzi } from "./zhuangzi";
import { hanfeizi } from "./hanfeizi";
import { mozi } from "./mozi";
import { buddha } from "./buddha";
import { socrates } from "./socrates";
import { plato } from "./plato";
import { aristotle } from "./aristotle";
import { aurelius } from "./aurelius";
import { machiavelli } from "./machiavelli";
import { nietzsche } from "./nietzsche";
import { beauvoir } from "./beauvoir";
import { arendt } from "./arendt";
import { liuCixin } from "./liu-cixin";
import { asimov } from "./asimov";
import { sontag } from "./sontag";

/**
 * Characteristic response length per thinker (docs/PERSONA_GUIDELINE.md Step 2).
 * "concise" = ultra-brief/short, "balanced" = medium, "verbose" = long/extended.
 * A thinker's own `lengthPreference` (if set on its persona object) takes
 * precedence; this map is the default applied to every built-in thinker so the
 * length variation works out of the box, before any admin override.
 */
const LENGTH_PREFERENCE_BY_ID: Record<string, LengthPreference> = {
  // Ultra-brief / short
  laozi: "concise",
  zhuangzi: "concise",
  hanfeizi: "concise",
  mozi: "concise",
  // Medium
  confucius: "balanced",
  mencius: "balanced",
  buddha: "balanced",
  socrates: "balanced",
  aurelius: "balanced",
  machiavelli: "balanced",
  asimov: "balanced",
  // Long / extended
  plato: "verbose",
  aristotle: "verbose",
  nietzsche: "verbose",
  beauvoir: "verbose",
  arendt: "verbose",
  "liu-cixin": "verbose",
  sontag: "verbose",
};

/** Attach the default length preference unless the persona sets its own. */
function withLengthPreference(p: ThinkerPersona): ThinkerPersona {
  return {
    ...p,
    lengthPreference: p.lengthPreference ?? LENGTH_PREFERENCE_BY_ID[p.id] ?? "balanced",
  };
}

export const ALL_THINKERS: ThinkerPersona[] = [
  confucius,
  mencius,
  laozi,
  zhuangzi,
  hanfeizi,
  mozi,
  buddha,
  socrates,
  plato,
  aristotle,
  aurelius,
  machiavelli,
  nietzsche,
  beauvoir,
  arendt,
  liuCixin,
  asimov,
  sontag,
].map(withLengthPreference);

export const THINKER_MAP: Record<string, ThinkerPersona> = Object.fromEntries(
  ALL_THINKERS.map((t) => [t.id, t])
);

export function getThinker(id: string): ThinkerPersona | undefined {
  return THINKER_MAP[id];
}

export {
  confucius,
  mencius,
  laozi,
  zhuangzi,
  hanfeizi,
  mozi,
  buddha,
  socrates,
  plato,
  aristotle,
  aurelius,
  machiavelli,
  nietzsche,
  beauvoir,
  arendt,
  liuCixin,
  asimov,
  sontag,
};
