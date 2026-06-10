import { prisma } from "./db";
import { ALL_THINKERS as SEED_THINKERS } from "@/personas";
import type { ThinkerPersona, ThinkerRelationship } from "@/types";

/**
 * Simple in-memory cache for persona data.
 * Invalidated when admin edits a persona.
 */
let cachedPersonas: ThinkerPersona[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Invalidate the persona cache (call after admin edit) */
export function invalidatePersonaCache(): void {
  cachedPersonas = null;
  cacheTimestamp = 0;
}

/**
 * Convert a DB Thinker row to a ThinkerPersona.
 * Falls back to seed data for fields that may not be populated in DB yet.
 */
function dbRowToPersona(row: {
  id: string;
  name: string;
  chineseName: string | null;
  school: string;
  era: string;
  avatarUrl: string;
  color: string;
  tagline: string;
  topicDomains: string;
  neverDoes: string;
  keyConcepts: string;
  relationships: string;
  systemPromptTemplate: string;
  isActive: boolean;
  alwaysActive: boolean;
  activationWeight: number;
  dailyInteractionsMin: number | null;
  dailyInteractionsMax: number | null;
  activeHourStart: number | null;
  activeHourEnd: number | null;
}): ThinkerPersona & { isActive: boolean } {
  // Find matching seed persona for fallbacks
  const seed = SEED_THINKERS.find((t) => t.id === row.id);

  let topicDomains: string[] = [];
  try { topicDomains = JSON.parse(row.topicDomains); } catch { /* empty */ }
  if (topicDomains.length === 0 && seed) topicDomains = seed.topicDomains;

  let neverDoes: string[] = [];
  try { neverDoes = JSON.parse(row.neverDoes); } catch { /* empty */ }
  if (neverDoes.length === 0 && seed) neverDoes = seed.neverDoes;

  let keyConcepts: string[] = [];
  try { keyConcepts = JSON.parse(row.keyConcepts); } catch { /* empty */ }
  if (keyConcepts.length === 0 && seed) keyConcepts = seed.keyConcepts;

  let relationships: ThinkerRelationship[] = [];
  try { relationships = JSON.parse(row.relationships); } catch { /* empty */ }
  if (relationships.length === 0 && seed) relationships = seed.relationships;

  const systemPromptTemplate = row.systemPromptTemplate || seed?.systemPromptTemplate || "";

  return {
    id: row.id,
    name: row.name,
    chineseName: row.chineseName ?? seed?.chineseName,
    school: row.school,
    era: row.era,
    color: row.color,
    tagline: row.tagline,
    topicDomains,
    neverDoes,
    keyConcepts,
    relationships,
    systemPromptTemplate,
    isActive: row.isActive,
    alwaysActive: row.alwaysActive,
    activationWeight: row.activationWeight,
    dailyInteractionsMin: row.dailyInteractionsMin,
    dailyInteractionsMax: row.dailyInteractionsMax,
    activeHourStart: row.activeHourStart,
    activeHourEnd: row.activeHourEnd,
  };
}

/**
 * Load all active thinker personas from DB, with seed fallbacks.
 */
export async function getAllThinkers(): Promise<ThinkerPersona[]> {
  const now = Date.now();
  if (cachedPersonas && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPersonas;
  }

  try {
    const rows = await prisma.thinker.findMany({
      orderBy: { name: "asc" },
    });

    if (rows.length === 0) {
      // DB not seeded yet — use TypeScript definitions
      cachedPersonas = SEED_THINKERS;
      cacheTimestamp = now;
      return SEED_THINKERS;
    }

    const personas = rows
      .map(dbRowToPersona)
      .filter((p) => p.isActive);

    cachedPersonas = personas;
    cacheTimestamp = now;
    return personas;
  } catch {
    // DB error — fall back to seed data
    return SEED_THINKERS;
  }
}

/**
 * Load all thinkers including inactive ones (for admin).
 */
export async function getAllThinkersAdmin(): Promise<(ThinkerPersona & { isActive: boolean })[]> {
  const rows = await prisma.thinker.findMany({
    orderBy: { name: "asc" },
  });

  if (rows.length === 0) {
    return SEED_THINKERS.map((t) => ({ ...t, isActive: true }));
  }

  return rows.map(dbRowToPersona);
}

/**
 * Get a single thinker by ID.
 */
export async function getThinkerById(id: string): Promise<ThinkerPersona | undefined> {
  const all = await getAllThinkers();
  return all.find((t) => t.id === id);
}

/**
 * Build a thinker map (keyed by ID) from currently loaded personas.
 */
export async function getThinkerMap(): Promise<Record<string, ThinkerPersona>> {
  const all = await getAllThinkers();
  return Object.fromEntries(all.map((t) => [t.id, t]));
}
