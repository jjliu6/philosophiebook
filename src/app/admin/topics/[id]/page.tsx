"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, DOMAIN_LABELS } from "@/types";

interface TopicDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  proposition: string | null;
  domains: string[];
  sourceType: string;
  viewCount: number;
  voteScore: number;
  createdAt: string;
}

export default function AdminTopicEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposition, setProposition] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/admin/topics/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTopic(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setProposition(data.proposition || "");
        setStatus(data.status);
        setType(data.type);
        setDomains(data.domains);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, proposition, status, type, domains }),
    });
    setSaving(false);
    router.push("/admin/topics");
  };

  const toggleDomain = (d: string) => {
    setDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  if (loading) {
    return <div style={{ color: "var(--muted)" }} className="py-20 text-center">Loading...</div>;
  }

  if (!topic) {
    return <div style={{ color: "var(--color-error)" }} className="py-20 text-center">Topic not found</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
          Edit Topic
        </h1>
        <button
          onClick={() => router.push("/admin/topics")}
          className="text-sm"
          style={{ color: "var(--muted)" }}
        >
          ← Back to list
        </button>
      </div>

      <div
        className="space-y-5 rounded-lg border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Proposition (for debates) */}
        {type === "debate" && (
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Proposition</label>
            <input
              type="text"
              value={proposition}
              onChange={(e) => setProposition(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                background: "var(--color-input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        )}

        {/* Type & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                background: "var(--color-input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <option value="discussion">Discussion</option>
              <option value="debate">Debate</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{
                background: "var(--color-input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="generating">Generating</option>
            </select>
          </div>
        </div>

        {/* Domains */}
        <div>
          <label className="mb-2 block text-xs font-medium" style={{ color: "var(--muted)" }}>Domains</label>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDomain(d)}
                className="rounded-full border px-3 py-1 text-xs transition-colors"
                style={{
                  background: domains.includes(d) ? "var(--accent-dim)" : "transparent",
                  borderColor: domains.includes(d) ? "var(--accent)" : "var(--border)",
                  color: domains.includes(d) ? "var(--accent)" : "var(--muted)",
                }}
              >
                {DOMAIN_LABELS[d] || d}
              </button>
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex gap-6 text-xs" style={{ color: "var(--muted)" }}>
          <span>Views: {topic.viewCount}</span>
          <span>Score: {topic.voteScore}</span>
          <span>Source: {topic.sourceType}</span>
          <span>Created: {new Date(topic.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => router.push("/admin/topics")}
            className="rounded-md border px-4 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
