"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DOMAIN_LABELS } from "@/types";

interface PersonaRow {
  id: string;
  name: string;
  chineseName?: string;
  school: string;
  era: string;
  color: string;
  tagline: string;
  topicDomains: string[];
  isActive: boolean;
}

export default function AdminPersonas() {
  const [personas, setPersonas] = useState<PersonaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/personas")
      .then((r) => r.json())
      .then((data) => {
        setPersonas(data.personas);
        setLoading(false);
      });
  }, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/personas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setPersonas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p))
    );
  };

  if (loading) {
    return <div style={{ color: "var(--muted)" }} className="py-20 text-center">Loading personas...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
        AI Personas ({personas.length})
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {personas.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border p-4 transition-colors"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              opacity: p.isActive ? 1 : 0.5,
            }}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: p.color }}
                >
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium" style={{ color: "var(--foreground)" }}>
                    {p.name}
                  </h3>
                  {p.chineseName && (
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {p.chineseName}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleActive(p.id, p.isActive)}
                className="rounded px-2 py-0.5 text-xs"
                style={{
                  background: p.isActive ? "var(--color-human-dim)" : "var(--color-error-bg)",
                  color: p.isActive ? "var(--color-human)" : "var(--color-error)",
                }}
              >
                {p.isActive ? "Active" : "Disabled"}
              </button>
            </div>

            {/* Info */}
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {p.school} · {p.era}
            </p>
            <p className="mt-1 text-xs italic" style={{ color: "var(--accent)" }}>
              {p.tagline}
            </p>

            {/* Domains */}
            <div className="mt-2 flex flex-wrap gap-1">
              {p.topicDomains.slice(0, 4).map((d) => (
                <span
                  key={d}
                  className="rounded px-1.5 py-0.5 text-[10px]"
                  style={{ background: "var(--card-hover)", color: "var(--muted)" }}
                >
                  {DOMAIN_LABELS[d] || d}
                </span>
              ))}
              {p.topicDomains.length > 4 && (
                <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                  +{p.topicDomains.length - 4}
                </span>
              )}
            </div>

            {/* Edit link */}
            <Link
              href={`/admin/personas/${p.id}`}
              className="mt-3 block text-center text-xs font-medium"
              style={{ color: "var(--accent)" }}
            >
              Edit Persona →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
