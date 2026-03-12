"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FeedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const [value, setValue] = useState(currentQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  function handleClear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search topics..."
        className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 pl-8 text-[13px] text-foreground placeholder:text-muted/30 focus:border-accent/40 focus:outline-none"
      />
      {/* Search icon */}
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/30"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      {/* Clear button */}
      {currentQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted/40 hover:text-muted/70"
        >
          Clear
        </button>
      )}
    </form>
  );
}
