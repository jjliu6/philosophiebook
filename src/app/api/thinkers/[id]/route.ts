import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const thinker = await prisma.thinker.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            topicId: true,
            content: true,
            position: true,
            humanLikeCount: true,
            createdAt: true,
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!thinker) {
      return NextResponse.json(
        { error: "Thinker not found" },
        { status: 404 }
      );
    }

    // Parse JSON string fields into arrays
    const result = {
      ...thinker,
      topicDomains: JSON.parse(thinker.topicDomains) as string[],
      neverDoes: JSON.parse(thinker.neverDoes) as string[],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching thinker:", error);
    return NextResponse.json(
      { error: "Failed to fetch thinker" },
      { status: 500 }
    );
  }
}
