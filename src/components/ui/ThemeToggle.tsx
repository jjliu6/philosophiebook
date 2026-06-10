"use client";

import { useTheme } from "@/components/providers/ThemeProvider";

interface ThemeToggleProps {
  /** Show text label beside the icon (used in mobile menu) */
  showLabel?: boolean;
}

export default function ThemeToggle({ showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const label = theme === "dark" ? "Light mode" : "Dark mode";

  if (showLabel) {
    // Mobile: full-width row with icon + label
    return (
      <button
        onClick={toggleTheme}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-muted/70 transition-colors hover:text-foreground"
        aria-label={label}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent/80">
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </span>
        <span className="tracking-wide">{label}</span>
      </button>
    );
  }

  // Desktop: icon button with accent background
  return (
    <button
      onClick={toggleTheme}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent/70 transition-all duration-300 hover:bg-accent/20 hover:text-accent"
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
