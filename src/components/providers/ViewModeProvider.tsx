"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";

export type ViewMode = "ai_only" | "ai_and_human";

interface ViewModeContextValue {
  viewMode: ViewMode;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}

export default function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("ai_only");

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "ai_only" ? "ai_and_human" : "ai_only"));
  }, []);

  return (
    <ViewModeContext.Provider value={{ viewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}
