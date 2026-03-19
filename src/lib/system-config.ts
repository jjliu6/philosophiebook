import { prisma } from "./db";

/** Default values for all system configuration keys */
const DEFAULTS: Record<string, unknown> = {
  topics_per_day: 5,
  debate_probability: 0.2,
  min_gap_minutes: 90,
  day_start_hour: 7,
  day_end_hour: 23,
  max_tasks_per_run: 3,
  ai_provider: "gemini",
  // Scheduler timing (minutes)
  first_response_delay_min: 5,
  first_response_delay_max: 30,
  response_gap_min: 80,
  response_gap_max: 160,
  // Follow-up timing (minutes)
  first_reply_delay_min: 30,
  first_reply_delay_max: 90,
  reply_gap_min: 90,
  reply_gap_max: 180,
  first_endorsement_delay_min: 15,
  first_endorsement_delay_max: 60,
  endorsement_gap_min: 30,
  endorsement_gap_max: 90,
  // Length hint weights
  length_weight_short: 0.3,
  length_weight_medium: 0.45,
  length_weight_long: 0.25,
  // Thinker selection
  min_thinkers_per_topic: 4,
  max_thinkers_per_topic: 6,
  max_follow_ups: 8,
  // Daily activity
  daily_active_thinkers_min: 5,
  daily_active_thinkers_max: 10,
  daily_interactions_min: 1,
  daily_interactions_max: 8,
};

/**
 * Get a system config value by key, falling back to the default.
 */
export async function getConfig<T = unknown>(key: string): Promise<T> {
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  if (row) {
    try {
      return JSON.parse(row.value) as T;
    } catch {
      return row.value as T;
    }
  }
  return (DEFAULTS[key] ?? null) as T;
}

/**
 * Get multiple config values at once. More efficient than individual calls.
 */
export async function getConfigs(keys: string[]): Promise<Record<string, unknown>> {
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: keys } },
  });

  const result: Record<string, unknown> = {};
  const rowMap = new Map(rows.map((r) => [r.key, r.value]));

  for (const key of keys) {
    const raw = rowMap.get(key);
    if (raw !== undefined) {
      try {
        result[key] = JSON.parse(raw);
      } catch {
        result[key] = raw;
      }
    } else {
      result[key] = DEFAULTS[key] ?? null;
    }
  }

  return result;
}

/**
 * Set a system config value. Creates or updates.
 */
export async function setConfig(key: string, value: unknown): Promise<void> {
  const jsonValue = JSON.stringify(value);
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value: jsonValue },
    create: { key, value: jsonValue },
  });
}

/**
 * Get all config values (DB overrides merged with defaults).
 */
export async function getAllConfigs(): Promise<Record<string, unknown>> {
  const rows = await prisma.systemConfig.findMany();
  const result = { ...DEFAULTS };

  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }

  return result;
}

/** Expose defaults for admin UI to show what the fallback values are */
export { DEFAULTS as CONFIG_DEFAULTS };
