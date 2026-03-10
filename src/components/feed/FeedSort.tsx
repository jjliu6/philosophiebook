"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { FeedSortOption } from "@/types";

const SORT_OPTIONS: { value: FeedSortOption; label: string }[] = [
  { value: "hot", label: "Hot" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
  { value: "timeless", label: "Timeless" },
];

export default function FeedSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = (searchParams.get("sort") as FeedSortOption) || "hot";

  function handleSort(sort: FeedSortOption) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-6 border-b border-border/50">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleSort(option.value)}
          className={cn(
            "relative pb-2.5 text-[13px] tracking-wide transition-colors duration-300",
            currentSort === option.value
              ? "text-foreground"
              : "text-muted hover:text-foreground/70"
          )}
        >
          {option.label}
          {currentSort === option.value && (
            <span className="absolute bottom-0 left-0 right-0 h-px bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
