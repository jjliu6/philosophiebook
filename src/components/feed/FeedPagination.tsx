"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface FeedPaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function FeedPagination({ currentPage, totalPages }: FeedPaginationProps) {
  const searchParams = useSearchParams();

  function buildPageHref(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
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
    <nav className="mt-4 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {/* Previous */}
      {currentPage <= 1 ? (
        <span
          className="flex h-10 min-w-[44px] items-center justify-center gap-1 rounded-md px-3 text-[13px] cursor-not-allowed text-muted/25"
          aria-disabled="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </span>
      ) : (
        <Link
          href={buildPageHref(currentPage - 1)}
          scroll={true}
          className="flex h-10 min-w-[44px] items-center justify-center gap-1 rounded-md px-3 text-[13px] text-muted/60 transition-colors hover:bg-card hover:text-foreground active:bg-card/80"
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </Link>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-1 text-[13px] text-muted/30">
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="flex h-10 min-w-[40px] items-center justify-center rounded-md text-[13px] bg-accent/15 font-medium text-accent"
            aria-label={`Page ${p}`}
            aria-current="page"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={buildPageHref(p)}
            scroll={true}
            className="flex h-10 min-w-[40px] items-center justify-center rounded-md text-[13px] text-muted/50 transition-colors hover:bg-card hover:text-foreground active:bg-card/80"
            aria-label={`Page ${p}`}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage >= totalPages ? (
        <span
          className="flex h-10 min-w-[44px] items-center justify-center gap-1 rounded-md px-3 text-[13px] cursor-not-allowed text-muted/25"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      ) : (
        <Link
          href={buildPageHref(currentPage + 1)}
          scroll={true}
          className="flex h-10 min-w-[44px] items-center justify-center gap-1 rounded-md px-3 text-[13px] text-muted/60 transition-colors hover:bg-card hover:text-foreground active:bg-card/80"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}
    </nav>
  );
}
