import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildResponseTree } from "@/lib/thread-tree";
import ThreadedResponse from "@/components/topic/ThreadedResponse";
import CommentSection from "@/components/topic/CommentSection";
import type { ResponseNode } from "@/types";

export const dynamic = "force-dynamic";

interface TopicPageProps {
  params: Promise<{ id: string }>;
}

/** Convert integer to Roman numeral (for folio numbers) */
function toRoman(num: number): string {
  const pairs: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let n = num;
  for (const [value, numeral] of pairs) {
    while (n >= value) {
      result += numeral;
      n -= value;
    }
  }
  return result;
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id } = await params;

  let topic;
  try {
    topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            thinker: {
              select: {
                id: true,
                name: true,
                chineseName: true,
                school: true,
                era: true,
                color: true,
              },
            },
            endorsements: {
              include: {
                thinker: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch topic:", error);
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-quote text-2xl text-foreground">
          Error loading topic
        </h1>
        <p className="mt-3 text-sm italic text-muted/60">
          Something went wrong. Please try again later.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-accent/70 transition-colors hover:text-accent"
        >
          &larr; Back to forum
        </Link>
      </div>
    );
  }

  if (!topic) {
    notFound();
  }

  // Parse domains
  let domains: string[] = [];
  try {
    domains = JSON.parse(topic.domains);
  } catch {
    domains = [];
  }

  // Get current user's likes for this topic's responses
  const currentUser = await getCurrentUser();
  let likedResponseIds = new Set<string>();
  if (currentUser) {
    const userLikes = await prisma.humanLike.findMany({
      where: {
        userId: currentUser.id,
        responseId: { in: topic.responses.map((r) => r.id) },
      },
      select: { responseId: true },
    });
    likedResponseIds = new Set(userLikes.map((l) => l.responseId));
  }

  // Attach userHasLiked to each response
  const responsesWithLikes = topic.responses.map((r) => ({
    ...r,
    userHasLiked: likedResponseIds.has(r.id),
  }));

  // Build threaded response tree from flat data
  const responseTree = buildResponseTree(responsesWithLikes) as unknown as ResponseNode[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Breadcrumb */}
      <Link
        href="/"
        className="mb-8 inline-block text-[13px] tracking-wide text-muted/50 transition-colors hover:text-foreground/70"
      >
        &larr; Back to forum
      </Link>

      {/* Topic header — chapter-style */}
      <div className="mb-10">
        {/* Domain tags */}
        {domains.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {domains.map((domain) => (
              <span
                key={domain}
                className="text-[11px] lowercase tracking-wider text-muted/40"
              >
                {domain.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Chapter-style title with flanking rules */}
        <div className="chapter-heading">
          <h1 className="font-quote text-3xl font-light leading-snug text-foreground sm:text-4xl">
            {topic.title}
          </h1>
        </div>

        {topic.description && (
          <p className="mt-4 text-[15px] leading-relaxed text-muted/60">
            {topic.description}
          </p>
        )}

        <p className="mt-4 text-[12px] tracking-wide text-muted/40">
          {topic.responses.length} response
          {topic.responses.length !== 1 ? "s" : ""} &middot;{" "}
          {topic.viewCount} views
        </p>

        {/* Book-style fleuron divider */}
        <div className="fleuron mt-6">
          <span className="text-[10px] text-accent/30">&#10022;</span>
        </div>
      </div>

      {/* Threaded responses */}
      <div className="thread-container flex flex-col gap-8">
        {responseTree.map((response, index) => (
          <ThreadedResponse
            key={response.id}
            response={response}
            depth={0}
            folio={toRoman(index + 1)}
          />
        ))}
      </div>

      {topic.responses.length === 0 && (
        <div className="book-page page-corner rounded-xl border border-border/40 px-6 py-16 text-center">
          <p className="font-quote text-lg text-muted">No responses yet.</p>
          <p className="mt-2 text-sm italic text-muted/40">
            The thinkers haven&apos;t weighed in on this topic yet.
          </p>
        </div>
      )}

      {/* Human comment section (hidden in AI-only mode) */}
      <CommentSection topicId={id} />

      {/* End-of-chapter ornament */}
      {topic.responses.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-accent/20" />
            <span className="font-quote text-xs text-accent/25">&#167;</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-accent/20" />
          </div>
          <p className="folio">
            {topic.responses.length} voice{topic.responses.length !== 1 ? "s" : ""} heard
          </p>
        </div>
      )}
    </div>
  );
}
