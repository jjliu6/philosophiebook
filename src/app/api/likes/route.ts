import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { responseId } = await request.json();
    if (!responseId) {
      return NextResponse.json({ error: "responseId is required" }, { status: 400 });
    }

    // Toggle like: check if already liked
    const existing = await prisma.humanLike.findUnique({
      where: { userId_responseId: { userId: user.id, responseId } },
    });

    if (existing) {
      // Unlike — delete + decrement count in transaction
      await prisma.$transaction([
        prisma.humanLike.delete({ where: { id: existing.id } }),
        prisma.response.update({
          where: { id: responseId },
          data: { humanLikeCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false });
    } else {
      // Like — create + increment count in transaction
      await prisma.$transaction([
        prisma.humanLike.create({ data: { userId: user.id, responseId } }),
        prisma.response.update({
          where: { id: responseId },
          data: { humanLikeCount: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like toggle error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
