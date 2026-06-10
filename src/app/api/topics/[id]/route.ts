import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        responses: {
          orderBy: { position: "asc" },
          include: {
            thinker: {
              select: {
                id: true,
                name: true,
                chineseName: true,
                school: true,
                era: true,
                color: true,
                tagline: true,
              },
            },
            endorsements: {
              include: {
                thinker: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Shape the endorsements to include thinker name and reason at the top level
    const shaped = {
      ...topic,
      responses: topic.responses.map((response) => ({
        ...response,
        endorsements: response.endorsements.map((e) => ({
          id: e.id,
          type: e.type,
          reason: e.reason,
          thinkerId: e.thinkerId,
          thinkerName: e.thinker.name,
        })),
      })),
    };

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}
