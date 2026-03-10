import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import FeedSort from "@/components/feed/FeedSort";
import TopicFeed from "@/components/feed/TopicFeed";
import ViewModeToggle from "@/components/ui/ViewModeToggle";
import type { FeedSortOption } from "@/types";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ sort?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const sort = (params.sort as FeedSortOption) || "hot";

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
    totalEndorsements: number;
    voteScore: number;
    userVote: number | null;
    commentCount: number;
    responses: {
      thinker: {
        id: string;
        name: string;
        color: string;
        school: string;
      };
    }[];
    humanParticipants: {
      id: string;
      username: string;
    }[];
  }[] = [];

  const currentUser = await getCurrentUser();

  try {
    const rawTopics = await prisma.topic.findMany({
      where: sort === "timeless" ? { sourceType: "evergreen" } : undefined,
      include: {
        responses: {
          include: {
            thinker: {
              select: {
                id: true,
                name: true,
                color: true,
                school: true,
              },
            },
            endorsements: true,
          },
          orderBy: { position: "asc" },
        },
        comments: {
          select: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
        ...(currentUser
          ? { topicVotes: { where: { userId: currentUser.id }, select: { value: true } } }
          : {}),
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

      // Unique human commenters
      const humanParticipants = topic.comments.reduce(
        (acc, c) => {
          if (!acc.find((u) => u.id === c.user.id)) {
            acc.push(c.user);
          }
          return acc;
        },
        [] as { id: string; username: string }[]
      );

      const topicVotes = (topic as unknown as { topicVotes?: { value: number }[] }).topicVotes;
      const userVote = topicVotes && topicVotes.length > 0 ? topicVotes[0].value : null;

      return {
        ...topic,
        responseCount,
        totalLikes,
        totalEndorsements,
        voteScore: topic.voteScore,
        userVote,
        commentCount: topic.comments.length,
        humanParticipants,
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
        default:
          return 0;
      }
    });

    topics = topicsWithMetrics;
  } catch (error) {
    console.error("Failed to fetch topics:", error);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Title section — table-of-contents style */}
      <div className="mb-10 text-center">
        <p className="folio mb-3 uppercase">Volume I</p>
        <h1 className="font-quote text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          Today&apos;s Debates
        </h1>
        <p className="mt-3 text-[15px] italic text-muted">
          History&apos;s greatest minds weigh in on the questions that matter now.
        </p>

        {/* Book-style fleuron */}
        <div className="fleuron mt-4">
          <span className="text-[10px] text-accent/40">&#10022;</span>
        </div>
      </div>

      {/* Sort tabs + view mode toggle */}
      <div className="mb-8 flex items-center justify-between">
        <Suspense fallback={null}>
          <FeedSort />
        </Suspense>
        <ViewModeToggle />
      </div>

      {/* Topic feed */}
      <TopicFeed topics={topics} />
    </div>
  );
}
