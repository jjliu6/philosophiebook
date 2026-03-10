import { Suspense } from "react";
import { prisma } from "@/lib/db";
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
    responses: {
      thinker: {
        id: string;
        name: string;
        color: string;
        school: string;
      };
    }[];
  }[] = [];

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
      },
    });

    // Compute metrics
    const topicsWithMetrics = rawTopics.map((topic) => {
      const responseCount = topic.responses.length;
      const totalLikes = topic.responses.reduce(
        (sum, r) => sum + r.humanLikeCount,
        0
      );
      const totalEndorsements = topic.responses.reduce(
        (sum, r) => sum + r.endorsements.length,
        0
      );

      return {
        ...topic,
        responseCount,
        totalLikes,
        totalEndorsements,
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
            (a.viewCount + a.totalLikes * 3) / Math.pow(ageA + 2, 1.5);
          const scoreB =
            (b.viewCount + b.totalLikes * 3) / Math.pow(ageB + 2, 1.5);
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
