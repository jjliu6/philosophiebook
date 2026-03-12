import { ThinkerPersona } from "@/types";
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
];

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
