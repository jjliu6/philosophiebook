import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildResponseTree } from "@/lib/thread-tree";
import ThreadedResponse from "@/components/topic/ThreadedResponse";
import CommentCard from "@/components/topic/CommentCard";
import type { CommentData } from "@/components/topic/CommentCard";
import CommentSection from "@/components/topic/CommentSection";
import DebateView from "@/components/debate/DebateView";
import ViewModeToggle from "@/components/ui/ViewModeToggle";
import TopicVoteButton from "@/components/ui/TopicVoteButton";
import UserAvatar from "@/components/ui/UserAvatar";
import ShareButton from "@/components/ui/ShareButton";
import { timeAgo } from "@/lib/utils";
import type { ResponseNode } from "@/types";

export const dynamic = "force-dynamic";

interface TopicPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      responses: {
        select: { thinker: { select: { name: true } } },
        where: { thinkerId: { not: null }, depth: 0 },
        take: 6,
      },
    },
  });

  if (!topic) return { title: "Topic Not Found" };

  const thinkerNames = topic.responses
    .map((r) => r.thinker?.name)
    .filter(Boolean)
    .join(", ");

  const desc = topic.description
    ? `${topic.description.slice(0, 120)}${topic.description.length > 120 ? "..." : ""}`
    : thinkerNames
      ? `A philosophical debate featuring ${thinkerNames}.`
      : "A philosophical debate on PhilosophieBook.";

  return {
    title: topic.title,
    description: desc,
    openGraph: {
      title: topic.title,
      description: desc,
      type: "article",
      url: `https://book.philosophie.ai/topic/${id}`,
      siteName: "PhilosophieBook",
    },
    twitter: {
      card: "summary_large_image",
      title: topic.title,
      description: desc,
    },
  };
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
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            avatarUrl: true,
          },
        },
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
            user: {
              select: {
                id: true,
                username: true,
                role: true,
                bio: true,
                avatarUrl: true,
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
            replies: {
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
                user: {
                  select: {
                    id: true,
                    username: true,
                    role: true,
                    bio: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
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
  // Get user's vote on this topic
  let userTopicVote: number | null = null;
  if (currentUser) {
    const vote = await prisma.topicVote.findUnique({
      where: { topicId_userId: { topicId: id, userId: currentUser.id } },
      select: { value: true },
    });
    userTopicVote = vote?.value ?? null;
  }

  // Get AI-only vote score
  const aiVotes = await prisma.topicVote.findMany({
    where: { topicId: id, thinkerId: { not: null } },
    select: { value: true },
  });
  const aiVoteScore = aiVotes.reduce((sum, v) => sum + v.value, 0);

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

  // Fetch comments server-side for unified timeline
  const comments = await prisma.comment.findMany({
    where: { topicId: id, parentCommentId: null },
    include: {
      user: { select: { id: true, username: true, role: true, bio: true, avatarUrl: true } },
      thinkerReplies: {
        include: { thinker: { select: { id: true, name: true, color: true } } },
      },
      commentLikes: { select: { userId: true } },
      replies: {
        include: {
          user: { select: { id: true, username: true, role: true, bio: true, avatarUrl: true } },
          commentLikes: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Debate-specific data
  const isDebate = topic.type === "debate";
  let debateData: {
    forCount: number;
    againstCount: number;
    forVoters: { name: string; color?: string; avatarUrl?: string; isThinker: boolean; thinkerId?: string }[];
    againstVoters: { name: string; color?: string; avatarUrl?: string; isThinker: boolean; thinkerId?: string }[];
    userVoteSide: "for" | "against" | null;
  } | null = null;

  if (isDebate) {
    const allDebateVotes = await prisma.debateVote.findMany({
      where: { topicId: id },
      include: {
        user: { select: { username: true, avatarUrl: true } },
        thinker: { select: { name: true, color: true, id: true } },
      },
    });

    const forVotes = allDebateVotes.filter((v) => v.side === "for");
    const againstVotes = allDebateVotes.filter((v) => v.side === "against");

    const mapVoter = (v: typeof allDebateVotes[0]) => ({
      name: v.thinker?.name ?? v.user?.username ?? "Unknown",
      color: v.thinker?.color,
      avatarUrl: v.user?.avatarUrl ?? undefined,
      isThinker: !!v.thinkerId,
      thinkerId: v.thinker?.id,
    });

    let userVoteSide: "for" | "against" | null = null;
    if (currentUser) {
      const userDebateVote = allDebateVotes.find((v) => v.userId === currentUser.id);
      userVoteSide = (userDebateVote?.side as "for" | "against") ?? null;
    }

    debateData = {
      forCount: forVotes.length,
      againstCount: againstVotes.length,
      forVoters: forVotes.map(mapVoter),
      againstVoters: againstVotes.map(mapVoter),
      userVoteSide,
    };
  }

  // Build unified timeline sorted by createdAt
  type TimelineEntry =
    | { type: "response"; createdAt: Date; response: ResponseNode; index: number }
    | { type: "comment"; createdAt: Date; comment: CommentData };

  let responseIndex = 0;
  const timeline: TimelineEntry[] = [
    ...responseTree.map((r) => ({
      type: "response" as const,
      createdAt: new Date(r.createdAt),
      response: r,
      index: responseIndex++,
    })),
    ...comments.map((c) => ({
      type: "comment" as const,
      createdAt: new Date(c.createdAt),
      comment: {
        ...c,
        createdAt: c.createdAt.toISOString(),
        replies: c.replies.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        thinkerReplies: c.thinkerReplies.map((tr) => ({
          ...tr,
          createdAt: tr.createdAt.toISOString(),
        })),
      } as CommentData,
    })),
  ];
  timeline.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // JSON-LD structured data for this debate
  const thinkerNames = topic.responses
    .filter((r) => r.thinkerId && !r.parentResponseId)
    .map((r) => r.thinker?.name)
    .filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: topic.title,
    description: topic.description || undefined,
    datePublished: topic.createdAt,
    url: `https://book.philosophie.ai/topic/${topic.id}`,
    author: thinkerNames.map((name) => ({
      "@type": "Person",
      name,
    })),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/CommentAction",
      userInteractionCount: topic.responses.length,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://book.philosophie.ai" },
      { "@type": "ListItem", position: 2, name: topic.title, item: `https://book.philosophie.ai/topic/${id}` },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <Link
        href="/"
        className="mb-8 inline-block text-[13px] tracking-wide text-muted/50 transition-colors hover:text-foreground/70"
      >
        &larr; Back to forum
      </Link>

      {/* Topic header — chapter-style */}
      <div className="mb-10">
        {/* Topic type + Domain tags */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {isDebate && (
            <span className="rounded-sm bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-400">
              debate
            </span>
          )}
          {domains.map((domain) => (
            <span
              key={domain}
              className="text-[11px] lowercase tracking-wider text-muted/40"
            >
              {domain.replace(/_/g, " ")}
            </span>
          ))}
        </div>

        {/* Chapter-style title with flanking rules */}
        <div className="chapter-heading">
          <h1 className="font-quote text-3xl font-light leading-snug text-foreground sm:text-4xl">
            {topic.title}
          </h1>
        </div>

        {/* Proposition (for debates) */}
        {isDebate && topic.proposition && (
          <div className="mt-4 rounded-lg border border-border/30 bg-card/30 px-5 py-4">
            <p className="text-center font-quote text-[17px] italic leading-relaxed text-foreground/80">
              &ldquo;{topic.proposition}&rdquo;
            </p>
          </div>
        )}

        {topic.description && (
          <p className="mt-4 text-[15px] leading-relaxed text-muted/60">
            {topic.description}
          </p>
        )}

        {/* Author + timestamp */}
        {topic.user && (
          <div className="mt-4 flex items-center gap-2.5 text-[13px] text-muted/50">
            <UserAvatar
              username={topic.user.username}
              avatarUrl={topic.user.avatarUrl}
              role={topic.user.role}
              size="xs"
            />
            <span>
              Proposed by{" "}
              <span className="text-foreground/70">{topic.user.username}</span>
            </span>
            <span className="text-muted/30">&middot;</span>
            <span>{timeAgo(new Date(topic.createdAt))}</span>
          </div>
        )}

        {!topic.user && (
          <div className="mt-4 text-[13px] text-muted/40">
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-accent/50">
              System
            </span>
            <span className="ml-2">{timeAgo(new Date(topic.createdAt))}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <TopicVoteButton
              topicId={id}
              initialScore={topic.voteScore}
              initialAiScore={aiVoteScore}
              initialVote={userTopicVote}
            />
            <p className="text-[12px] tracking-wide text-muted/40">
              {topic.responses.length} response
              {topic.responses.length !== 1 ? "s" : ""} &middot;{" "}
              {topic.viewCount} views
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton
              url={`https://book.philosophie.ai/topic/${id}`}
              title={topic.title}
            />
            <ViewModeToggle />
          </div>
        </div>

        {/* Book-style fleuron divider */}
        <div className="fleuron mt-6">
          <span className="text-[10px] text-accent/30">&#10022;</span>
        </div>
      </div>

      {/* Conditional rendering: Debate vs Discussion */}
      {isDebate && debateData ? (
        <DebateView
          topicId={id}
          forCount={debateData.forCount}
          againstCount={debateData.againstCount}
          forVoters={debateData.forVoters}
          againstVoters={debateData.againstVoters}
          arguments={responsesWithLikes}
          userVoteSide={debateData.userVoteSide}
        />
      ) : (
        <>
          {/* Unified timeline — responses and comments sorted by time */}
          <div className="thread-container flex flex-col gap-8">
            {timeline.map((entry) =>
              entry.type === "response" ? (
                <ThreadedResponse
                  key={entry.response.id}
                  response={entry.response}
                  depth={0}
                  folio={toRoman(entry.index + 1)}
                  topicId={id}
                />
              ) : (
                <CommentCard
                  key={entry.comment.id}
                  comment={entry.comment}
                  topicId={id}
                />
              )
            )}
          </div>

          {timeline.length === 0 && (
            <div className="book-page page-corner rounded-xl border border-border/40 px-6 py-16 text-center">
              <p className="font-quote text-lg text-muted">No responses yet.</p>
              <p className="mt-2 text-sm italic text-muted/40">
                The thinkers haven&apos;t weighed in on this topic yet.
              </p>
            </div>
          )}

          {/* Comment compose form */}
          <CommentSection topicId={id} />

          {/* End-of-chapter ornament */}
          {timeline.length > 0 && (
            <div className="mt-12 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-accent/20" />
                <span className="font-quote text-xs text-accent/25">&#167;</span>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-accent/20" />
              </div>
              <p className="folio">
                {timeline.length} voice{timeline.length !== 1 ? "s" : ""} heard
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
