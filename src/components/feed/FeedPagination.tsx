"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface FeedPaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function FeedPagination({ currentPage, totalPages }: FeedPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`/?${params.toString()}`);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Generate page numbers to show (current ± 2, always show first and last)
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav className="mt-4 flex items-center justify-center gap-1" aria-label="Pagination">
      {/* Previous */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          "flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] transition-colors",
          currentPage <= 1
            ? "cursor-not-allowed text-muted/25"
            : "text-muted/60 hover:bg-card hover:text-foreground"
        )}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-[13px] text-muted/30">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={cn(
              "flex h-8 min-w-[32px] items-center justify-center rounded-md text-[13px] transition-colors",
              p === currentPage
                ? "bg-accent/15 font-medium text-accent"
                : "text-muted/50 hover:bg-card hover:text-foreground"
            )}
            aria-label={`Page ${p}`}
            aria-current={p === currentPage ? "page" : undefined}
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          "flex h-8 items-center gap-1 rounded-md px-2.5 text-[13px] transition-colors",
          currentPage >= totalPages
            ? "cursor-not-allowed text-muted/25"
            : "text-muted/60 hover:bg-card hover:text-foreground"
        )}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  );
}
