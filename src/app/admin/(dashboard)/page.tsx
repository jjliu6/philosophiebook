"use client";

import { useEffect, useState } from "react";

interface OverviewStats {
  topics: number;
  responses: number;
  comments: number;
  users: number;
  thinkers: number;
  activeAgentKeys: number;
  taskQueue: {
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
  cronStatus: Record<string, { updatedAt: string; date: string }>;
}

interface ActivityDay {
  date: string;
  topics: number;
  responses: number;
  comments: number;
}

function StatsCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
        {value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function ActivityChart({ days }: { days: ActivityDay[] }) {
  const maxVal = Math.max(1, ...days.flatMap((d) => [d.topics, d.responses, d.comments]));

  return (
    <div
      className="rounded-lg border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <h3 className="mb-4 text-sm font-medium" style={{ color: "var(--foreground)" }}>
        7-Day Activity
      </h3>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {days.map((day) => (
          <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-0.5" style={{ height: 100 }}>
              <div
                className="flex-1 rounded-t"
                style={{
                  height: `${(day.topics / maxVal) * 100}%`,
                  background: "var(--accent)",
                  minHeight: day.topics > 0 ? 4 : 0,
                }}
                title={`${day.topics} topics`}
              />
              <div
                className="flex-1 rounded-t"
                style={{
                  height: `${(day.responses / maxVal) * 100}%`,
                  background: "var(--color-agent)",
                  minHeight: day.responses > 0 ? 4 : 0,
                }}
                title={`${day.responses} responses`}
              />
              <div
                className="flex-1 rounded-t"
                style={{
                  height: `${(day.comments / maxVal) * 100}%`,
                  background: "var(--color-human)",
                  minHeight: day.comments > 0 ? 4 : 0,
                }}
                title={`${day.comments} comments`}
              />
            </div>
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>
              {day.date.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs" style={{ color: "var(--muted)" }}>
        <span><span style={{ color: "var(--accent)" }}>■</span> Topics</span>
        <span><span style={{ color: "var(--color-agent)" }}>■</span> Responses</span>
        <span><span style={{ color: "var(--color-human)" }}>■</span> Comments</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats/overview").then((r) => r.json()),
      fetch("/api/admin/stats/activity").then((r) => r.json()),
    ]).then(([s, a]) => {
      setStats(s);
      setActivity(a.days || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: "var(--muted)" }}>
        Loading dashboard...
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
        Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatsCard label="Topics" value={stats.topics} />
        <StatsCard label="Responses" value={stats.responses} />
        <StatsCard label="Comments" value={stats.comments} />
        <StatsCard label="Users" value={stats.users} />
      </div>

      {/* Activity Chart */}
      <ActivityChart days={activity} />

      {/* Task Queue & Cron */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Task Queue */}
        <div
          className="rounded-lg border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Agent Task Queue
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Pending</span>
              <span style={{ color: "var(--accent)" }}>{stats.taskQueue.pending}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Processing</span>
              <span style={{ color: "var(--color-agent)" }}>{stats.taskQueue.processing}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Failed</span>
              <span style={{ color: "var(--color-error)" }}>{stats.taskQueue.failed}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Completed</span>
              <span style={{ color: "var(--color-human)" }}>{stats.taskQueue.completed}</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div
          className="rounded-lg border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
            System Info
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Thinkers</span>
              <span style={{ color: "var(--foreground)" }}>{stats.thinkers}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: "var(--muted)" }}>Active Agent Keys</span>
              <span style={{ color: "var(--foreground)" }}>{stats.activeAgentKeys}</span>
            </div>
            {Object.entries(stats.cronStatus).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span style={{ color: "var(--muted)" }}>{key}</span>
                <span className="text-xs" style={{ color: "var(--foreground)" }}>
                  {new Date(val.updatedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
