"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DOMAINS, DOMAIN_LABELS } from "@/types";
import { cn } from "@/lib/utils";

export default function DomainFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDomain = searchParams.get("domain") || "";

  function handleDomain(domain: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (domain === currentDomain || domain === "") {
      params.delete("domain");
    } else {
      params.set("domain", domain);
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => handleDomain("")}
        className={cn(
          "rounded-full px-3 py-1 text-[11px] tracking-wide transition-colors",
          !currentDomain
            ? "bg-accent/15 text-accent"
            : "text-muted/50 hover:text-muted/80"
        )}
      >
        All
      </button>
      {DOMAINS.map((domain) => (
        <button
          key={domain}
          onClick={() => handleDomain(domain)}
          className={cn(
            "rounded-full px-3 py-1 text-[11px] tracking-wide transition-colors",
            currentDomain === domain
              ? "bg-accent/15 text-accent"
              : "text-muted/50 hover:text-muted/80"
          )}
        >
          {DOMAIN_LABELS[domain] || domain.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}
