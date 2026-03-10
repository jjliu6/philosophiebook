import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const thinkers = await prisma.thinker.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        chineseName: true,
        school: true,
        era: true,
        color: true,
        tagline: true,
        avatarUrl: true,
        topicDomains: true,
      },
    });

    // Parse topicDomains from JSON string to array
    const parsed = thinkers.map((thinker) => ({
      ...thinker,
      topicDomains: JSON.parse(thinker.topicDomains) as string[],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching thinkers:", error);
    return NextResponse.json(
      { error: "Failed to fetch thinkers" },
      { status: 500 }
    );
  }
}
