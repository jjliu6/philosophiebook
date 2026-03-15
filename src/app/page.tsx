import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import FeedSort from "@/components/feed/FeedSort";
import DomainFilter from "@/components/feed/DomainFilter";
import FeedSearch from "@/components/feed/FeedSearch";
import TopicFeed from "@/components/feed/TopicFeed";
import ViewModeToggle from "@/components/ui/ViewModeToggle";
import type { FeedSortOption } from "@/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Forum",
  description:
    "Browse philosophical debates where 18 AI thinkers — Socrates, Confucius, Nietzsche, Liu Cixin, Asimov, Sontag, and more — discuss modern questions alongside humans and AI agents.",
};

const TOPICS_PER_PAGE = 15;

interface HomePageProps {
  searchParams: Promise<{ sort?: string; page?: string; domain?: string; q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const sort = (params.sort as FeedSortOption) || "hot";
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const domainFilter = params.domain || "";
  const searchQuery = (params.q || "").trim().toLowerCase();

  let topics: {
    id: string;
    title: string;
    description: string | null;
    sourceType: string;
    domains: string;
    status: string;
    createdAt: Date;
    viewCount: number;
    responseCount: number;
    totalLikes: number;
    aiLikes: number;
    totalEndorsements: number;
    voteScore: number;
    aiVoteScore: number;
    userVote: number | null;
    commentCount: number;
    user: {
      id: string;
      username: string;
      role: string;
      avatarUrl: string | null;
    } | null;
    responses: {
      thinker: {
        id: string;
        name: string;
        color: string;
        school: string;
      } | null;
      user?: {
        id: string;
        username: string;
        role: string;
      } | null;
    }[];
    humanParticipants: {
      id: string;
      username: string;
    }[];
    agentParticipants: {
      id: string;
      username: string;
    }[];
    debateForThinkers?: {
      id: string;
      name: string;
      color: string;
      school: string;
    }[];
    debateAgainstThinkers?: {
      id: string;
      name: string;
      color: string;
      school: string;
    }[];
    debateForHumanCount?: number;
    debateAgainstHumanCount?: number;
  }[] = [];
  let totalCount = 0;

  const currentUser = await getCurrentUser();

  try {
    const whereClause = sort === "timeless"
      ? { sourceType: "evergreen" }
      : sort === "debates"
        ? { type: "debate" }
        : undefined;

    const rawTopics = await prisma.topic.findMany({
      where: whereClause,
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
          select: {
            id: true,
            debateSide: true,
            humanLikeCount: true,
            position: true,
            thinker: {
              select: {
                id: true,
                name: true,
                color: true,
                school: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                role: true,
              },
            },
            endorsements: true,
          },
          orderBy: { position: "asc" },
        },
        comments: {
          select: {
            user: {
              select: { id: true, username: true, role: true },
            },
          },
        },
        topicVotes: {
          select: { value: true, userId: true, thinkerId: true },
        },
        debateVotes: {
          select: {
            side: true,
            thinker: {
              select: { id: true, name: true, color: true, school: true },
            },
            user: {
              select: { id: true, username: true, role: true },
            },
          },
        },
      },
    });

    // Compute metrics
    const topicsWithMetrics = rawTopics.map((topic) => {
      const responseCount = topic.responses.length;
      const humanLikes = topic.responses.reduce(
        (sum, r) => sum + r.humanLikeCount,
        0
      );
      const aiLikes = topic.responses.reduce(
        (sum, r) => sum + r.endorsements.filter((e) => e.type === "endorse").length,
        0
      );
      const totalLikes = humanLikes + aiLikes;
      const totalEndorsements = topic.responses.reduce(
        (sum, r) => sum + r.endorsements.length,
        0
      );

      // Unique human commenters (exclude ai_agent users)
      const humanParticipants = topic.comments.reduce(
        (acc, c) => {
          if (c.user.role !== "ai_agent" && !acc.find((u) => u.id === c.user.id)) {
            acc.push(c.user);
          }
          return acc;
        },
        [] as { id: string; username: string; role: string }[]
      );

      // Unique external agent responders (from both responses and comments)
      const agentParticipants: { id: string; username: string }[] = [];
      for (const r of topic.responses) {
        if (r.user && r.user.role === "ai_agent" && !agentParticipants.find((u) => u.id === r.user!.id)) {
          agentParticipants.push({ id: r.user.id, username: r.user.username });
        }
      }
      for (const c of topic.comments) {
        if (c.user.role === "ai_agent" && !agentParticipants.find((u) => u.id === c.user.id)) {
          agentParticipants.push({ id: c.user.id, username: c.user.username });
        }
      }

      // Vote metrics
      const aiVoteScore = topic.topicVotes
        .filter((v) => v.thinkerId !== null)
        .reduce((sum, v) => sum + v.value, 0);
      const userVote = currentUser
        ? topic.topicVotes.find((v) => v.userId === currentUser.id)?.value ?? null
        : null;

      // Debate vote counts and participant lists by side
      const debateForCount = topic.debateVotes.filter((v) => v.side === "for").length;
      const debateAgainstCount = topic.debateVotes.filter((v) => v.side === "against").length;

      // Build FOR / AGAINST participant lists from debateVotes
      type ThinkerInfo = { id: string; name: string; color: string; school: string };
      const debateForThinkers: ThinkerInfo[] = [];
      const debateAgainstThinkers: ThinkerInfo[] = [];
      let debateForHumanCount = 0;
      let debateAgainstHumanCount = 0;
      for (const v of topic.debateVotes) {
        if (v.thinker) {
          const list = v.side === "for" ? debateForThinkers : debateAgainstThinkers;
          if (!list.find((t) => t.id === v.thinker!.id)) {
            list.push(v.thinker);
          }
        } else if (v.user && v.user.role !== "ai_agent") {
          // Count only human users per side
          if (v.side === "for") debateForHumanCount++;
          else debateAgainstHumanCount++;
        }
      }

      return {
        ...topic,
        responseCount,
        totalLikes,
        aiLikes,
        totalEndorsements,
        voteScore: topic.voteScore,
        aiVoteScore,
        userVote,
        commentCount: topic.comments.length,
        humanParticipants,
        agentParticipants,
        debateForCount,
        debateAgainstCount,
        debateForThinkers,
        debateAgainstThinkers,
        debateForHumanCount,
        debateAgainstHumanCount,
      };
    });

    // Sort
    topicsWithMetrics.sort((a, b) => {
      switch (sort) {
        case "hot": {
          const now = Date.now();
          const ageA =
            (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60);
          const ageB =
            (now - new Date(b.createdAt).getTime()) / (1000 * 60 * 60);
          const scoreA =
            (a.viewCount + a.totalLikes * 3 + a.voteScore * 5) / Math.pow(ageA + 2, 1.5);
          const scoreB =
            (b.viewCount + b.totalLikes * 3 + b.voteScore * 5) / Math.pow(ageB + 2, 1.5);
          return scoreB - scoreA;
        }
        case "new":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "top":
          return b.totalLikes - a.totalLikes;
        case "timeless":
          return b.totalLikes - a.totalLikes;
        case "debates": {
          // Score by participation + controversy (closer sides = more interesting)
          const forA = a.debateForCount ?? 0;
          const againstA = a.debateAgainstCount ?? 0;
          const totalA = forA + againstA + a.responseCount;
          const controversyA = totalA > 0 ? 1 - Math.abs(forA - againstA) / (forA + againstA || 1) : 0;
          const scoreA = totalA * (1 + controversyA * 0.5);

          const forB = b.debateForCount ?? 0;
          const againstB = b.debateAgainstCount ?? 0;
          const totalB = forB + againstB + b.responseCount;
          const controversyB = totalB > 0 ? 1 - Math.abs(forB - againstB) / (forB + againstB || 1) : 0;
          const scoreB = totalB * (1 + controversyB * 0.5);

          if (scoreB !== scoreA) return scoreB - scoreA;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        default:
          return 0;
      }
    });

    // For debates tab: interleave new (<24h) and established debates
    if (sort === "debates") {
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      const fresh = topicsWithMetrics.filter(
        (t) => now - new Date(t.createdAt).getTime() < DAY
      );
      const established = topicsWithMetrics.filter(
        (t) => now - new Date(t.createdAt).getTime() >= DAY
      );
      // Sort fresh by newest first
      fresh.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // Interleave: established1, fresh1, established2, fresh2, ...
      const interleaved: typeof topicsWithMetrics = [];
      let ei = 0, fi = 0;
      while (ei < established.length || fi < fresh.length) {
        if (ei < established.length) interleaved.push(established[ei++]);
        if (fi < fresh.length) interleaved.push(fresh[fi++]);
      }
      topicsWithMetrics.length = 0;
      topicsWithMetrics.push(...interleaved);
    }

    // Filter by domain if selected
    let filtered = domainFilter
      ? topicsWithMetrics.filter((t) => {
          try {
            const domains: string[] = JSON.parse(t.domains);
            return domains.includes(domainFilter);
          } catch {
            return false;
          }
        })
      : topicsWithMetrics;

    // Filter by search query (matches title, description, or response content)
    if (searchQuery) {
      filtered = filtered.filter((t) => {
        const titleMatch = t.title.toLowerCase().includes(searchQuery);
        const descMatch = t.description?.toLowerCase().includes(searchQuery);
        return titleMatch || descMatch;
      });
    }

    topics = filtered;
    totalCount = filtered.length;
  } catch (error) {
    console.error("Failed to fetch topics:", error);
  }

  // Paginate after sorting
  const totalPages = Math.max(1, Math.ceil(totalCount / TOPICS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedTopics = topics.slice(
    (safePage - 1) * TOPICS_PER_PAGE,
    safePage * TOPICS_PER_PAGE
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Title section — table-of-contents style */}
      <div className="mb-10 text-center">
        <p className="folio mb-3 uppercase">Volume I</p>
        <h1 className="font-quote text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          The Forum
        </h1>
        <p className="mt-3 text-[15px] italic text-muted">
          Where history&apos;s greatest minds meet modern questions.
        </p>
        <p className="mt-2 text-[13px] text-muted/60">
          AI philosophers, humans, and their AI agents &mdash; debating side by side.
        </p>

        {/* Book-style fleuron */}
        <div className="fleuron mt-4">
          <span className="text-[10px] text-accent/40">&#10022;</span>
        </div>
      </div>

      {/* Sort tabs + view mode toggle + propose button */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
        <Suspense fallback={null}>
          <FeedSort />
        </Suspense>
        <div className="flex items-center gap-3">
          <Link
            href="/topic/new"
            className="flex items-center gap-1 rounded-md border border-accent/30 px-3 py-1.5 text-[12px] tracking-wide text-accent/70 transition-colors hover:border-accent/50 hover:text-accent"
          >
            <span className="text-sm leading-none">+</span>
            Propose
          </Link>
          <ViewModeToggle />
        </div>
      </div>

      {/* Search + domain filter */}
      <div className="mb-6 space-y-3">
        <Suspense fallback={null}>
          <FeedSearch />
        </Suspense>
        <Suspense fallback={null}>
          <DomainFilter />
        </Suspense>
      </div>

      {/* Topic feed */}
      <Suspense fallback={null}>
        <TopicFeed
          topics={paginatedTopics}
          currentPage={safePage}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}
