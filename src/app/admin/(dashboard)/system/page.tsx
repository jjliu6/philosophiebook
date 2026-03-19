"use client";

import { useEffect, useState } from "react";

interface ConfigGroup {
  label: string;
  keys: { key: string; label: string; type: "number" | "string" }[];
}

const CONFIG_GROUPS: ConfigGroup[] = [
  {
    label: "Topic Generation",
    keys: [
      { key: "topics_per_day", label: "Topics Per Day", type: "number" },
      { key: "debate_probability", label: "Debate Probability (0-1)", type: "number" },
      { key: "min_gap_minutes", label: "Min Gap Between Topics (min)", type: "number" },
      { key: "day_start_hour", label: "Day Start Hour (UTC)", type: "number" },
      { key: "day_end_hour", label: "Day End Hour (UTC)", type: "number" },
      { key: "ai_provider", label: "Default AI Provider", type: "string" },
    ],
  },
  {
    label: "Task Processing",
    keys: [
      { key: "max_tasks_per_run", label: "Max Tasks Per Run", type: "number" },
    ],
  },
  {
    label: "Response Timing",
    keys: [
      { key: "first_response_delay_min", label: "First Response Delay Min (min)", type: "number" },
      { key: "first_response_delay_max", label: "First Response Delay Max (min)", type: "number" },
      { key: "response_gap_min", label: "Response Gap Min (min)", type: "number" },
      { key: "response_gap_max", label: "Response Gap Max (min)", type: "number" },
    ],
  },
  {
    label: "Follow-up Timing",
    keys: [
      { key: "first_reply_delay_min", label: "First Reply Delay Min (min)", type: "number" },
      { key: "first_reply_delay_max", label: "First Reply Delay Max (min)", type: "number" },
      { key: "reply_gap_min", label: "Reply Gap Min (min)", type: "number" },
      { key: "reply_gap_max", label: "Reply Gap Max (min)", type: "number" },
      { key: "first_endorsement_delay_min", label: "First Endorsement Delay Min (min)", type: "number" },
      { key: "first_endorsement_delay_max", label: "First Endorsement Delay Max (min)", type: "number" },
      { key: "endorsement_gap_min", label: "Endorsement Gap Min (min)", type: "number" },
      { key: "endorsement_gap_max", label: "Endorsement Gap Max (min)", type: "number" },
    ],
  },
  {
    label: "Length Distribution",
    keys: [
      { key: "length_weight_short", label: "Short Weight", type: "number" },
      { key: "length_weight_medium", label: "Medium Weight", type: "number" },
      { key: "length_weight_long", label: "Long Weight", type: "number" },
    ],
  },
  {
    label: "Thinker Selection",
    keys: [
      { key: "min_thinkers_per_topic", label: "Min Thinkers Per Topic", type: "number" },
      { key: "max_thinkers_per_topic", label: "Max Thinkers Per Topic", type: "number" },
      { key: "max_follow_ups", label: "Max Follow-ups Per Topic", type: "number" },
    ],
  },
  {
    label: "Daily Activity",
    keys: [
      { key: "daily_active_thinkers_min", label: "Min Active Thinkers/Day", type: "number" },
      { key: "daily_active_thinkers_max", label: "Max Active Thinkers/Day", type: "number" },
      { key: "daily_interactions_min", label: "Min Interactions/Thinker", type: "number" },
      { key: "daily_interactions_max", label: "Max Interactions/Thinker", type: "number" },
    ],
  },
];

interface CronState {
  key: string;
  updatedAt: string;
  date: string;
  value: string;
}

export default function AdminSystem() {
  const [configs, setConfigs] = useState<Record<string, unknown>>({});
  const [defaults, setDefaults] = useState<Record<string, unknown>>({});
  const [cronStates, setCronStates] = useState<CronState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Record<string, unknown>>({});
  const [triggeringCron, setTriggeringCron] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/system/config").then((r) => r.json()),
      fetch("/api/admin/system/cron/status").then((r) => r.json()),
    ]).then(([configData, cronData]) => {
      setConfigs(configData.configs);
      setDefaults(configData.defaults);
      setCronStates(cronData.cronStates || []);
      setLoading(false);
    });
  }, []);

  const getValue = (key: string) => {
    if (key in dirty) return dirty[key];
    return configs[key] ?? defaults[key] ?? "";
  };

  const handleChange = (key: string, value: unknown, type: string) => {
    const parsed = type === "number" ? Number(value) : value;
    setDirty((prev) => ({ ...prev, [key]: parsed }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/admin/system/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dirty),
    });
    const data = await res.json();
    setConfigs(data.configs);
    setDirty({});
    setSaving(false);
  };

  const handleTriggerCron = async (job: string) => {
    setTriggeringCron(job);
    const cronSecret = ""; // Will be set server-side
    const endpoint = job === "generate-topic"
      ? "/api/admin/topics/generate"
      : null;

    if (endpoint) {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
    setTriggeringCron(null);
  };

  if (loading) {
    return <div style={{ color: "var(--muted)" }} className="py-20 text-center">Loading system settings...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          System Settings
        </h1>
        {Object.keys(dirty).length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            {saving ? "Saving..." : `Save ${Object.keys(dirty).length} Changes`}
          </button>
        )}
      </div>

      {/* Cron Status */}
      <div
        className="rounded-lg border p-4"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
          Cron Jobs
        </h3>
        <div className="space-y-3">
          {cronStates.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--muted)" }}>No cron state records yet</p>
          ) : (
            cronStates.map((cs) => (
              <div key={cs.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{cs.key}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Last: {new Date(cs.updatedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleTriggerCron(cs.key === "daily_topic_schedule" ? "generate-topic" : cs.key)}
                  disabled={triggeringCron !== null}
                  className="rounded px-3 py-1 text-xs"
                  style={{ background: "var(--color-agent-dim)", color: "var(--color-agent)" }}
                >
                  {triggeringCron ? "Running..." : "Trigger"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Config Groups */}
      {CONFIG_GROUPS.map((group) => (
        <div
          key={group.label}
          className="rounded-lg border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            {group.label}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.keys.map(({ key, label, type }) => (
              <div key={key}>
                <label className="mb-1 block text-xs" style={{ color: "var(--muted)" }}>
                  {label}
                  {defaults[key] !== undefined && (
                    <span className="ml-1 opacity-50">(default: {String(defaults[key])})</span>
                  )}
                </label>
                <input
                  type={type === "number" ? "number" : "text"}
                  step={type === "number" ? "any" : undefined}
                  value={String(getValue(key))}
                  onChange={(e) => handleChange(key, e.target.value, type)}
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  style={{
                    background: key in dirty ? "var(--accent-dim)" : "var(--color-input-bg)",
                    borderColor: key in dirty ? "var(--accent)" : "var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Save footer */}
      {Object.keys(dirty).length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md px-6 py-2 text-sm font-medium shadow-lg"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            {saving ? "Saving..." : `Save ${Object.keys(dirty).length} Changes`}
          </button>
        </div>
      )}
    </div>
  );
}
