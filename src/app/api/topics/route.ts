import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") || "hot";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Base query: fetch topics with responses (including thinker) and endorsements
    const topics = await prisma.topic.findMany({
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

    // Compute metrics for each topic
    const topicsWithMetrics = topics.map((topic) => {
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

    // Sort based on the requested strategy
    const sorted = topicsWithMetrics.sort((a, b) => {
      switch (sort) {
        case "hot": {
          // Combination of viewCount + totalLikes, weighted by recency
          const now = Date.now();
          const ageA =
            (now - new Date(a.createdAt).getTime()) / (1000 * 60 * 60); // hours
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

    // Paginate
    const paginated = sorted.slice(skip, skip + limit);
    const totalCount = sorted.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      topics: paginated,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
