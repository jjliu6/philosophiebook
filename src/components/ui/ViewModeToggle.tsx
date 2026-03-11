"use client";

import { useViewMode } from "@/components/providers/ViewModeProvider";
import { cn } from "@/lib/utils";

export default function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <button
      onClick={toggleViewMode}
      className="flex items-center gap-1.5 rounded-full border border-border/40 px-3 py-1 text-[11px] tracking-wide text-muted/60 transition-colors hover:border-accent/30 hover:text-foreground/70"
    >
      <span className={cn(
        "h-1.5 w-1.5 rounded-full",
        viewMode === "ai_only" ? "bg-accent" : "bg-human"
      )} />
      {viewMode === "ai_only" ? "AI Only" : "AI + Human"}
    </button>
  );
}
