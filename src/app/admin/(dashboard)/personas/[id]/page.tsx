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
  avatarUrl: string;
}

const DICEBEAR_STYLES = [
  { id: "notionists", label: "Sketched" },
  { id: "personas", label: "Personas" },
  { id: "avataaars", label: "Cartoon" },
  { id: "lorelei", label: "Lorelei" },
  { id: "micah", label: "Micah" },
];

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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState<string[]>([]);

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
  const [lengthPreference, setLengthPreference] = useState("balanced"); // "concise" | "balanced" | "verbose"

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
        setLengthPreference(data.lengthPreference || "balanced");
        setAvatarUrl(data.avatarUrl || "");
        setLoading(false);
      });
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/admin/personas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, chineseName, school, era, color, tagline, lengthPreference,
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

  const currentAvatarSrc = avatarUrl || `/avatars/${id}.svg`;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/admin/personas/${id}/avatar`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
    setAvatarUploading(false);
  };

  const handleAvatarGenerate = () => {
    const seed = `${name}-${Date.now()}`;
    const urls = DICEBEAR_STYLES.map(
      (s) => `https://api.dicebear.com/9.x/${s.id}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`
    );
    setGeneratedAvatars(urls);
  };

  const handleSelectGenerated = async (url: string) => {
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append("generatedUrl", url);
    const res = await fetch(`/api/admin/personas/${id}/avatar`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
    setGeneratedAvatars([]);
    setAvatarUploading(false);
  };

  const handleAvatarReset = async () => {
    setAvatarUploading(true);
    await fetch(`/api/admin/personas/${id}/avatar`, { method: "DELETE" });
    setAvatarUrl("");
    setAvatarUploading(false);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentAvatarSrc} alt={name} className="h-10 w-10 rounded-full object-cover" style={{ background: color }} />
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

      {/* Avatar Management */}
      <div
        className="rounded-lg border p-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <label className="mb-3 block text-xs font-medium" style={{ color: "var(--muted)" }}>Avatar</label>
        <div className="flex items-start gap-6">
          {/* Current avatar preview */}
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentAvatarSrc}
              alt={name}
              className="h-24 w-24 rounded-full border-2 object-cover"
              style={{ borderColor: color, background: color + "20" }}
            />
            <span className="text-[10px]" style={{ color: "var(--muted)" }}>
              {avatarUrl ? "Custom" : "Default SVG"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <label
                className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {avatarUploading ? "Uploading..." : "Upload Image"}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
              <button
                onClick={handleAvatarGenerate}
                className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                style={{ borderColor: "var(--color-agent)", color: "var(--color-agent)" }}
              >
                Generate Avatars
              </button>
              {avatarUrl && (
                <button
                  onClick={handleAvatarReset}
                  className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
                  style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                >
                  Reset to Default
                </button>
              )}
            </div>

            {/* Generated avatar options */}
            {generatedAvatars.length > 0 && (
              <div>
                <p className="mb-2 text-[11px]" style={{ color: "var(--muted)" }}>Click to select:</p>
                <div className="flex flex-wrap gap-3">
                  {generatedAvatars.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectGenerated(url)}
                      className="group relative overflow-hidden rounded-full border-2 transition-all hover:scale-110"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Style ${i + 1}`} className="h-16 w-16" />
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {DICEBEAR_STYLES[i]?.label}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={handleAvatarGenerate}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed text-lg transition-colors hover:opacity-70"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                    title="Regenerate"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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

        {/* Response Length Preference */}
        <div>
          <label className="mb-2 block text-xs font-medium" style={{ color: "var(--muted)" }}>
            Response Length Preference
          </label>
          <div className="flex gap-2">
            {[
              { id: "concise", label: "Concise", desc: "Short, punchy replies" },
              { id: "balanced", label: "Balanced", desc: "Mix of lengths" },
              { id: "verbose", label: "Verbose", desc: "Detailed, long-form" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLengthPreference(opt.id)}
                className="flex-1 rounded-lg border px-3 py-2 text-center transition-colors"
                style={{
                  background: lengthPreference === opt.id ? "rgba(255,255,255,0.85)" : "transparent",
                  borderColor: lengthPreference === opt.id ? "var(--accent)" : "var(--border)",
                  color: lengthPreference === opt.id ? "#4a5520" : "var(--muted)",
                }}
              >
                <div className="text-xs font-medium">{opt.label}</div>
                <div className="mt-0.5 text-[10px] opacity-60">{opt.desc}</div>
              </button>
            ))}
          </div>
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
            {DOMAINS.map((d) => {
              const selected = topicDomains.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDomain(d)}
                  className="rounded-full border-2 px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    background: selected ? "rgba(255,255,255,0.85)" : "transparent",
                    borderColor: selected ? "var(--accent)" : "var(--border)",
                    color: selected ? "#4a5520" : "var(--muted)",
                  }}
                >
                  {selected && "✓ "}{DOMAIN_LABELS[d] || d}
                </button>
              );
            })}
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
