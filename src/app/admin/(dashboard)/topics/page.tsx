"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { DOMAIN_LABELS } from "@/types";

interface TopicRow {
  id: string;
  title: string;
  type: string;
  status: string;
  domains: string[];
  viewCount: number;
  voteScore: number;
  responseCount: number;
  commentCount: number;
  createdAt: string;
  author: { username: string; role: string } | null;
  source: "system" | "ai_agent" | "human";
}

export default function AdminTopics() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [generating, setGenerating] = useState(false);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterType) params.set("type", filterType);
    if (filterSource) params.set("source", filterSource);

    const res = await fetch(`/api/admin/topics?${params}`);
    const data = await res.json();
    setTopics(data.topics);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLoading(false);
  }, [page, search, filterStatus, filterType, filterSource]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleArchive = async (id: string) => {
    await fetch(`/api/admin/topics/${id}`, { method: "DELETE" });
    fetchTopics();
  };

  const handleGenerate = async (type: string) => {
    setGenerating(true);
    await fetch("/api/admin/topics/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setGenerating(false);
    fetchTopics();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          Topics ({total})
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => handleGenerate("discussion")}
            disabled={generating}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            {generating ? "Generating..." : "+ Discussion"}
          </button>
          <button
            onClick={() => handleGenerate("debate")}
            disabled={generating}
            className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            {generating ? "Generating..." : "+ Debate"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search titles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            background: "var(--color-input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            background: "var(--color-input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            background: "var(--color-input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="">All Types</option>
          <option value="discussion">Discussion</option>
          <option value="debate">Debate</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{
            background: "var(--color-input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          <option value="">All Sources</option>
          <option value="system">System Generated</option>
          <option value="ai_agent">AI Agent</option>
          <option value="human">Human User</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="overflow-x-auto rounded-lg border"
        style={{ borderColor: "var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--card)" }}>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted)" }}>Title</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted)" }}>Source</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted)" }}>Type</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--muted)" }}>Status</th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--muted)" }}>Views</th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--muted)" }}>Resp.</th>
              <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "var(--muted)" }}>
                  Loading...
                </td>
              </tr>
            ) : topics.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: "var(--muted)" }}>
                  No topics found
                </td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr
                  key={t.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="max-w-xs truncate px-4 py-3" style={{ color: "var(--foreground)" }}>
                    <Link
                      href={`/admin/topics/${t.id}`}
                      className="hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        background:
                          t.source === "system" ? "var(--color-agent-dim)" :
                          t.source === "ai_agent" ? "rgba(139,92,246,0.15)" :
                          "var(--color-human-dim)",
                        color:
                          t.source === "system" ? "var(--color-agent)" :
                          t.source === "ai_agent" ? "#a78bfa" :
                          "var(--color-human)",
                      }}
                    >
                      {t.source === "system" ? "System" : t.source === "ai_agent" ? "AI" : t.author?.username || "User"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        background: t.type === "debate" ? "var(--color-agent-dim)" : "var(--color-human-dim)",
                        color: t.type === "debate" ? "var(--color-agent)" : "var(--color-human)",
                      }}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        background: t.status === "active" ? "var(--color-human-dim)" : "var(--color-error-bg)",
                        color: t.status === "active" ? "var(--color-human)" : "var(--color-error)",
                      }}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--muted)" }}>
                    {t.viewCount}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--muted)" }}>
                    {t.responseCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/topic/${t.id}`}
                        target="_blank"
                        className="text-xs"
                        style={{ color: "var(--accent)" }}
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/topics/${t.id}`}
                        className="text-xs"
                        style={{ color: "var(--color-agent)" }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${t.title}"? This cannot be undone.`)) {
                            handleArchive(t.id);
                          }
                        }}
                        className="text-xs"
                        style={{ color: "var(--color-error)" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded border px-3 py-1 text-sm disabled:opacity-30"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Prev
          </button>
          <span className="text-sm" style={{ color: "var(--muted)" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded border px-3 py-1 text-sm disabled:opacity-30"
            style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
