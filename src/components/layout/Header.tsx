"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = [
    { href: "/", label: "Forum" },
    { href: "/thinkers", label: "Thinkers" },
    { href: "/leaderboard", label: "Ranks" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Logo — always show site name */}
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="PhilosophieBook" className="h-9 w-auto rounded-sm" />
          <span className="font-quote text-[13px] font-light tracking-[0.05em] text-foreground/80 sm:text-[15px] sm:tracking-[0.08em]">
            PhilosophieBook
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative py-1 text-[13px] tracking-wide uppercase transition-colors duration-300",
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}

          {/* My Activity — only when logged in */}
          {user && (
            <Link
              href="/dashboard"
              className={cn(
                "relative py-1 text-[13px] tracking-wide uppercase transition-colors duration-300",
                pathname.startsWith("/dashboard")
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              )}
            >
              My Activity
              {pathname.startsWith("/dashboard") && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
              )}
            </Link>
          )}

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-foreground/70">{user.username}</span>
              <button
                onClick={logout}
                className="text-[12px] tracking-wide text-muted/50 transition-colors hover:text-foreground/70"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[13px] tracking-wide text-muted/60 transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="relative z-[60] flex flex-col gap-1.5 p-1 sm:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={cn(
              "block h-px w-5 bg-foreground/70 transition-transform duration-300",
              menuOpen && "translate-y-[7px] rotate-45"
            )}
          />
          <span
            className={cn(
              "block h-px w-5 bg-foreground/70 transition-opacity duration-300",
              menuOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "block h-px w-5 bg-foreground/70 transition-transform duration-300",
              menuOpen && "-translate-y-[7px] -rotate-45"
            )}
          />
        </button>
      </div>

      {/* Subtle bottom separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Mobile Overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[100] bg-black/30 transition-opacity duration-300 sm:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Slide-in Panel */}
      <nav
        className={cn(
          "fixed left-0 top-0 z-[101] flex h-dvh w-64 flex-col bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Menu header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <span className="font-quote text-[14px] tracking-wide text-foreground/70">Menu</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 text-muted/50 transition-colors hover:text-foreground"
            aria-label="Close menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3.5 text-[14px] tracking-wide transition-colors duration-200",
                  isActive
                    ? "bg-accent/10 text-foreground"
                    : "text-muted/70 hover:bg-card/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                )}
                {link.label}
              </Link>
            );
          })}
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3.5 text-[14px] tracking-wide transition-colors duration-200",
                pathname.startsWith("/dashboard")
                  ? "bg-accent/10 text-foreground"
                  : "text-muted/70 hover:bg-card/50 hover:text-foreground"
              )}
            >
              {pathname.startsWith("/dashboard") && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              )}
              My Activity
            </Link>
          )}
        </div>

        {/* Bottom section: auth + theme */}
        <div className="border-t border-border/40 px-5 py-4">
          {user ? (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] text-foreground/70">{user.username}</span>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="text-[12px] text-muted/50 transition-colors hover:text-foreground/70"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mb-3 block text-[13px] text-accent/70 transition-colors hover:text-accent"
            >
              Sign in
            </Link>
          )}
          <ThemeToggle showLabel />
        </div>
      </nav>
    </header>
  );
}
