"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";

export default function FeedSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const [value, setValue] = useState(currentQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Use ref for searchParams so the effect doesn't re-trigger on URL changes
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Debounced live search — only triggers when the user types (value changes)
  const pushSearch = useCallback((searchValue: string) => {
    const params = new URLSearchParams(searchParamsRef.current.toString());
    const trimmed = searchValue.trim();
    if (trimmed) {
      params.set("q", trimmed);
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }, [router]);

  useEffect(() => {
    // Sync local state when URL query changes externally (e.g. clear button, back navigation)
    if (currentQuery !== value && currentQuery !== value.trim()) {
      setValue(currentQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery]);

  useEffect(() => {
    // Don't push if value matches what's already in the URL
    if (value.trim() === currentQuery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushSearch(value);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // Only re-run when the user types (value changes), not on URL changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pushSearch(value);
  }

  function handleClear() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue("");
    pushSearch("");
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
