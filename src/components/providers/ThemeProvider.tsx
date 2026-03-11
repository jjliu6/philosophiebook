"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR always renders "dark"; the real theme is set by the inline script in <head>.
  // We sync with the DOM after hydration via the useEffect below.
  const [theme, setTheme] = useState<Theme>("dark");

  // Sync React state with the actual data-theme the inline script applied.
  // Without this, the first toggle click "changes" dark→light in state while
  // the DOM is already light, making it look like nothing happened.
  useEffect(() => {
    const domTheme = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (domTheme && (domTheme === "light" || domTheme === "dark")) {
      setTheme(domTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  // Listen for system preference changes (only when no explicit stored preference)
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handleChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
