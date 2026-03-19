"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◉" },
  { href: "/admin/topics", label: "Topics", icon: "◈" },
  { href: "/admin/personas", label: "Personas", icon: "◎" },
  { href: "/admin/system", label: "System", icon: "⚙" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-56 flex-col border-r"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {/* Logo */}
      <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
        <Link href="/admin" className="block">
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--accent)" }}
          >
            PB Admin
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            System Dashboard
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
              style={{
                background: isActive ? "var(--accent-dim)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--foreground)",
              }}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
          style={{ color: "var(--muted)" }}
        >
          ← Back to Site
        </Link>
      </div>
    </aside>
  );
}
