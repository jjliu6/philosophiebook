"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { DOMAINS, DOMAIN_LABELS } from "@/types";

interface Relationship {
  targetThinkerId: string;
  type: string;
  dynamic: string;
}

interface PersonaDetail {
  id: string;
  name: string;
  chineseName: string | null;
  school: string;
  era: string;
  color: string;
  tagline: string;
  topicDomains: string[];
  neverDoes: string[];
  keyConcepts: string[];
  relationships: Relationship[];
  systemPromptTemplate: string;
  isActive: boolean;
}

function EditableList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="flex-1 rounded border px-2 py-1 text-xs"
              style={{
                background: "var(--color-input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
            <button
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-xs"
              style={{ color: "var(--color-error)" }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add new..."
          className="flex-1 rounded border px-2 py-1 text-xs"
          style={{
            background: "var(--color-input-bg)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
        />
        <button
          onClick={() => {
            if (draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
          className="rounded px-2 py-1 text-xs"
          style={{ background: "var(--accent)", color: "var(--background)" }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function AdminPersonaEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [persona, setPersona] = useState<PersonaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [chineseName, setChineseName] = useState("");
  const [school, setSchool] = useState("");
  const [era, setEra] = useState("");
  const [color, setColor] = useState("");
  const [tagline, setTagline] = useState("");
  const [topicDomains, setTopicDomains] = useState<string[]>([]);
  const [keyConcepts, setKeyConcepts] = useState<string[]>([]);
  const [neverDoes, setNeverDoes] = useState<string[]>([]);
  const [systemPromptTemplate, setSystemPromptTemplate] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/personas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPersona(data);
        setName(data.name);
        setChineseName(data.chineseName || "");
        setSchool(data.school);
        setEra(data.era);
        setColor(data.color);
        setTagline(data.tagline);
        setTopicDomains(data.topicDomains);
        setKeyConcepts(data.keyConcepts);
        setNeverDoes(data.neverDoes);
        setSystemPromptTemplate(data.systemPromptTemplate);
        setIsActive(data.isActive);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/personas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, chineseName, school, era, color, tagline,
        topicDomains, keyConcepts, neverDoes, systemPromptTemplate, isActive,
      }),
    });
    setSaving(false);
    router.push("/admin/personas");
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await fetch(`/api/admin/personas/${id}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setTestResult(data.response || data.error || "No response");
    setTesting(false);
  };

  const toggleDomain = (d: string) => {
    setTopicDomains((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  if (loading) {
    return <div style={{ color: "var(--muted)" }} className="py-20 text-center">Loading...</div>;
  }

  if (!persona) {
    return <div style={{ color: "var(--color-error)" }} className="py-20 text-center">Persona not found</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: color }}
          >
            {name.charAt(0)}
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            Edit: {name}
          </h1>
        </div>
        <button
          onClick={() => router.push("/admin/personas")}
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
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--color-input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Chinese Name</label>
            <input type="text" value={chineseName} onChange={(e) => setChineseName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--color-input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>School</label>
            <input type="text" value={school} onChange={(e) => setSchool(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--color-input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Era</label>
            <input type="text" value={era} onChange={(e) => setEra(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ background: "var(--color-input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Color</label>
            <div className="flex gap-2">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border-0"
              />
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                style={{ background: "var(--color-input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>Tagline</label>
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ background: "var(--color-input-bg)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>Active</label>
          <button
            onClick={() => setIsActive(!isActive)}
            className="rounded px-3 py-1 text-xs font-medium"
            style={{
              background: isActive ? "var(--color-human-dim)" : "var(--color-error-bg)",
              color: isActive ? "var(--color-human)" : "var(--color-error)",
            }}
          >
            {isActive ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* Domains */}
        <div>
          <label className="mb-2 block text-xs font-medium" style={{ color: "var(--muted)" }}>Topic Domains</label>
          <div className="flex flex-wrap gap-2">
            {DOMAINS.map((d) => (
              <button
                key={d}
                onClick={() => toggleDomain(d)}
                className="rounded-full border px-3 py-1 text-xs transition-colors"
                style={{
                  background: topicDomains.includes(d) ? "var(--accent-dim)" : "transparent",
                  borderColor: topicDomains.includes(d) ? "var(--accent)" : "var(--border)",
                  color: topicDomains.includes(d) ? "var(--accent)" : "var(--muted)",
                }}
              >
                {DOMAIN_LABELS[d] || d}
              </button>
            ))}
          </div>
        </div>

        {/* Key Concepts */}
        <EditableList label="Key Concepts" items={keyConcepts} onChange={setKeyConcepts} />

        {/* Never Does */}
        <EditableList label="Never Does (constraints)" items={neverDoes} onChange={setNeverDoes} />

        {/* System Prompt */}
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
            System Prompt Template
          </label>
          <textarea
            value={systemPromptTemplate}
            onChange={(e) => setSystemPromptTemplate(e.target.value)}
            rows={16}
            className="w-full rounded-md border px-3 py-2 font-mono text-xs leading-relaxed"
            style={{
              background: "var(--color-input-bg)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Test */}
        <div
          className="rounded-md border p-4"
          style={{ background: "var(--card-hover)", borderColor: "var(--border)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Test Persona
            </h4>
            <button
              onClick={handleTest}
              disabled={testing}
              className="rounded px-3 py-1 text-xs font-medium"
              style={{ background: "var(--color-agent)", color: "white" }}
            >
              {testing ? "Generating..." : "Run Test"}
            </button>
          </div>
          {testResult && (
            <div
              className="rounded-md border p-3 text-xs leading-relaxed"
              style={{
                background: "var(--color-input-bg)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              {testResult}
            </div>
          )}
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
            onClick={() => router.push("/admin/personas")}
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
