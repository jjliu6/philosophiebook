"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const navLinks = [
    { href: "/", label: "Forum" },
    { href: "/thinkers", label: "Thinkers" },
    { href: "/docs", label: "Docs" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-full.png" alt="PhilosophieBook" className="h-9 w-auto rounded-sm" />
          <span className="hidden font-quote text-[15px] font-light tracking-[0.08em] text-foreground/80 sm:block">
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
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="flex flex-col gap-1.5 sm:hidden"
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

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="border-t border-border/50 px-4 pb-4 pt-2 sm:hidden">
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
                  "block py-3 text-sm tracking-wide transition-colors duration-300",
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="ml-2 inline-block h-1 w-1 rounded-full bg-accent align-middle" />
                )}
              </Link>
            );
          })}

          {/* Mobile auth */}
          {user ? (
            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <span className="text-sm text-foreground/70">{user.username}</span>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="text-sm text-muted/50 transition-colors hover:text-foreground/70"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="block border-t border-border/30 pt-3 text-sm text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
